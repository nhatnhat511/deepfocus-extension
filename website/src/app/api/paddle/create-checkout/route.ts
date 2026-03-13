import { NextResponse } from "next/server";

export const runtime = "edge";

type PaddleTransactionResponse = {
  data?: {
    id?: string;
  };
};

type CreateCheckoutBody = {
  email?: string;
  plan?: "monthly" | "yearly";
  userId?: string;
};

const PADDLE_API_BASE = process.env.PADDLE_API_BASE_URL || "https://api.paddle.com";
const PADDLE_API_KEY = process.env.PADDLE_API_KEY || "";
const PADDLE_PRICE_ID_MONTHLY = process.env.PADDLE_PRICE_ID || "";
const PADDLE_PRICE_ID_YEARLY = process.env.PADDLE_PRICE_ID_YEARLY || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://deepfocustime.com";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr";
const CHECKOUT_RATE_LIMIT_MAX = Math.max(1, Number(process.env.PADDLE_CHECKOUT_RATE_LIMIT_MAX || 10));
const CHECKOUT_RATE_LIMIT_WINDOW_MS = Math.max(
  5_000,
  Number(process.env.PADDLE_CHECKOUT_RATE_LIMIT_WINDOW_SECONDS || 60) * 1000
);

type SupabaseUser = {
  id?: string;
  email?: string;
  email_confirmed_at?: string | null;
};

type ProfileRow = {
  plan?: string | null;
  premium_until?: string | null;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const rateLimitStore = new Map<string, RateLimitEntry>();

function jsonError(message: string, status = 400, headers?: HeadersInit) {
  return NextResponse.json({ error: message }, { status, headers });
}

function normalizeEmail(input: string) {
  return input.trim().toLowerCase();
}

function getRequestOrigin(req: Request) {
  return req.headers.get("origin") || "";
}

function getRequestReferer(req: Request) {
  return req.headers.get("referer") || "";
}

function getRequestIp(req: Request) {
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const xff = req.headers.get("x-forwarded-for") || "";
  if (!xff) return "unknown";
  return xff.split(",")[0]?.trim() || "unknown";
}

function isAllowedRequestOrigin(req: Request) {
  const allowedOrigin = SITE_URL;
  const origin = getRequestOrigin(req);
  if (origin) return origin === allowedOrigin;
  const referer = getRequestReferer(req);
  if (referer) return referer.startsWith(allowedOrigin);
  return false;
}

function isRateLimited(key: string) {
  const now = Date.now();
  const current = rateLimitStore.get(key);
  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, { count: 1, resetAt: now + CHECKOUT_RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (current.count >= CHECKOUT_RATE_LIMIT_MAX) {
    return true;
  }
  current.count += 1;
  return false;
}

function buildRateLimitHeaders() {
  const retryAfter = Math.ceil(CHECKOUT_RATE_LIMIT_WINDOW_MS / 1000);
  return {
    "Retry-After": String(retryAfter),
  };
}

async function getUserFromAccessToken(accessToken: string) {
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error("Missing Supabase public credentials for auth verification.");
  }

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "GET",
    headers: {
      apikey: SUPABASE_PUBLISHABLE_KEY,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });

  const payload = (await res.json().catch(() => ({}))) as SupabaseUser & {
    message?: string;
    error_description?: string;
  };
  if (!res.ok) {
    throw new Error(payload.message || payload.error_description || `Invalid session (${res.status})`);
  }
  return payload;
}

async function getProfile(accessToken: string, userId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=plan,premium_until&id=eq.${encodeURIComponent(userId)}&limit=1`,
    {
      method: "GET",
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  );
  const payload = (await res.json().catch(() => [])) as ProfileRow[];
  if (!res.ok) {
    const msg =
      (payload as unknown as { message?: string; error_description?: string })?.message ||
      (payload as unknown as { error_description?: string })?.error_description ||
      `Profile lookup failed (${res.status})`;
    throw new Error(msg);
  }
  return payload[0] || null;
}

export async function POST(req: Request) {
  try {
    if (!PADDLE_API_KEY) return jsonError("Missing PADDLE_API_KEY", 500);
    if (!PADDLE_PRICE_ID_MONTHLY) return jsonError("Missing PADDLE_PRICE_ID", 500);
    if (!isAllowedRequestOrigin(req)) {
      return jsonError("Forbidden origin.", 403);
    }

    const ip = getRequestIp(req);
    if (isRateLimited(`ip:${ip}`)) {
      return jsonError("Too many requests. Please wait and try again.", 429, buildRateLimitHeaders());
    }

    const authHeader = req.headers.get("authorization") || "";
    const bearer = authHeader.match(/^Bearer\s+(.+)$/i);
    const accessToken = bearer ? bearer[1].trim() : "";
    if (!accessToken) {
      return jsonError("Unauthorized. Please sign in before checkout.", 401);
    }

    const user = await getUserFromAccessToken(accessToken);
    const userId = String(user.id || "");
    const email = normalizeEmail(String(user.email || ""));
    if (!userId || !/^\S+@\S+\.\S+$/.test(email)) {
      return jsonError("Unable to resolve account identity.", 401);
    }

    if (!user.email_confirmed_at) {
      return jsonError("Please verify your email before upgrading.", 403);
    }

    const profile = await getProfile(accessToken, userId);
    const currentPlan = String(profile?.plan || "free");
    const premiumUntil = profile?.premium_until ? Date.parse(profile.premium_until) : 0;
    const hasActivePremium = Number.isFinite(premiumUntil) && premiumUntil > Date.now();

    const body = (await req.json().catch(() => ({}))) as CreateCheckoutBody;
    const requestedEmail = normalizeEmail(String(body.email || ""));
    const requestedUserId = String(body.userId || "").trim();
    const requestedPlan = body.plan === "yearly" ? "yearly" : "monthly";
    const priceId = requestedPlan === "yearly" ? PADDLE_PRICE_ID_YEARLY : PADDLE_PRICE_ID_MONTHLY;
    if (requestedPlan === "yearly" && !priceId) {
      return jsonError("Missing PADDLE_PRICE_ID_YEARLY", 500);
    }
    if (requestedEmail && requestedEmail !== email) {
      return jsonError("Checkout email must match your signed-in account.", 403);
    }
    if (requestedUserId && requestedUserId !== userId) {
      return jsonError("Checkout session mismatch. Please sign out and sign in again.", 409);
    }

    if (hasActivePremium) {
      if (requestedPlan === "monthly" && (currentPlan === "premium" || currentPlan === "premium_monthly")) {
        return jsonError("Monthly plan already active. It will renew automatically.", 409);
      }
      if (requestedPlan === "yearly" && currentPlan === "premium_yearly") {
        return jsonError("Yearly plan already active.", 409);
      }
    }

    if (isRateLimited(`user:${userId}`)) {
      return jsonError("Too many checkout attempts. Please wait and try again.", 429, buildRateLimitHeaders());
    }

    const payload = {
      items: [{ price_id: priceId, quantity: 1 }],
      collection_mode: "automatic",
      checkout: {
        url: SITE_URL,
      },
      custom_data: {
        deepfocus_user_id: userId,
        deepfocus_email: email,
        deepfocus_plan: requestedPlan === "yearly" ? "premium_yearly" : "premium_monthly",
        source: "deepfocus_web_checkout",
      },
    };

    const res = await fetch(`${PADDLE_API_BASE}/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PADDLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    const data = (await res.json().catch(() => ({}))) as PaddleTransactionResponse & {
      error?: { detail?: string; code?: string; type?: string };
    };
    if (!res.ok) {
      const detail = data?.error?.detail || `Paddle request failed (${res.status})`;
      return jsonError(detail, res.status);
    }

    const transactionId = String(data?.data?.id || "");
    if (!transactionId) return jsonError("Missing transaction id from Paddle.", 502);

    return NextResponse.json({ transactionId, accountEmail: email });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected server error.";
    return jsonError(msg, 500);
  }
}
