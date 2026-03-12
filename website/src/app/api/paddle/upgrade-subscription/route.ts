import { NextResponse } from "next/server";

export const runtime = "edge";

type PaddleSubscription = {
  id?: string;
};

type PaddleResponse<T> = {
  data?: T;
  error?: { detail?: string };
};

const PADDLE_API_BASE = process.env.PADDLE_API_BASE_URL || "https://api.paddle.com";
const PADDLE_API_KEY = process.env.PADDLE_API_KEY || "";
const PADDLE_PRICE_ID_YEARLY = process.env.PADDLE_PRICE_ID_YEARLY || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://deepfocustime.com";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr";

type SupabaseUser = {
  id?: string;
  email?: string;
};

type ProfileRow = {
  plan?: string | null;
  paddle_subscription_id?: string | null;
  premium_until?: string | null;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function mapPaddleError(message: string) {
  const text = message.toLowerCase();
  if (text.includes("authentication challenge") || text.includes("3ds") || text.includes("3d secure")) {
    return {
      message:
        "Additional verification is required to complete this upgrade. Please finish the authentication step.",
      code: "requires_action",
    };
  }
  if (text.includes("frozen") || text.includes("lost") || text.includes("stolen") || text.includes("damaged")) {
    return {
      message: "Your card issuer declined this payment. Please use a different card.",
      code: "card_unavailable",
    };
  }
  if (text.includes("payment declined") || (text.includes("card") && text.includes("declined"))) {
    return {
      message: "Your payment was declined. Please update your payment method and try again.",
      code: "payment_declined",
    };
  }
  if (text.includes("payment method") && (text.includes("missing") || text.includes("required"))) {
    return { message: "Please add a payment method before upgrading.", code: "missing_payment_method" };
  }
  if (text.includes("insufficient") && text.includes("funds")) {
    return { message: "Your card has insufficient funds. Please use a different card.", code: "insufficient_funds" };
  }
  if (text.includes("rate limit") || text.includes("too many")) {
    return { message: "Too many attempts. Please wait a moment and try again.", code: "rate_limited" };
  }
  return { message: "We couldn't complete the upgrade. Please try again or contact support.", code: "unknown" };
}

function getRequestOrigin(req: Request) {
  return req.headers.get("origin") || "";
}

function getRequestReferer(req: Request) {
  return req.headers.get("referer") || "";
}

function isAllowedRequestOrigin(req: Request) {
  const allowedOrigin = SITE_URL;
  const origin = getRequestOrigin(req);
  if (origin) return origin === allowedOrigin;
  const referer = getRequestReferer(req);
  if (referer) return referer.startsWith(allowedOrigin);
  return false;
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
    `${SUPABASE_URL}/rest/v1/profiles?select=plan,premium_until,paddle_subscription_id&id=eq.${encodeURIComponent(
      userId
    )}&limit=1`,
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

async function paddlePatch<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${PADDLE_API_BASE}${path}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  const payload = (await res.json().catch(() => ({}))) as PaddleResponse<T>;
  if (!res.ok) {
    const detail = payload.error?.detail || `Paddle API failed (${res.status})`;
    throw new Error(detail);
  }
  return payload.data as T;
}

export async function POST(req: Request) {
  try {
    if (!PADDLE_API_KEY) return jsonError("Missing PADDLE_API_KEY", 500);
    if (!PADDLE_PRICE_ID_YEARLY) return jsonError("Missing PADDLE_PRICE_ID_YEARLY", 500);
    if (!isAllowedRequestOrigin(req)) {
      return jsonError("Forbidden origin.", 403);
    }

    const authHeader = req.headers.get("authorization") || "";
    const bearer = authHeader.match(/^Bearer\s+(.+)$/i);
    const accessToken = bearer ? bearer[1].trim() : "";
    if (!accessToken) {
      return jsonError("Unauthorized. Please sign in.", 401);
    }

    const user = await getUserFromAccessToken(accessToken);
    const userId = String(user.id || "");
    if (!userId) {
      return jsonError("Unable to resolve account identity.", 401);
    }
    const email = String(user.email || "").trim().toLowerCase();

    const profile = await getProfile(accessToken, userId);
    const plan = String(profile?.plan || "");
    const premiumUntil = profile?.premium_until ? Date.parse(profile.premium_until) : 0;
    const hasActivePremium = Number.isFinite(premiumUntil) && premiumUntil > Date.now();
    if (!plan || (plan !== "premium" && plan !== "premium_monthly")) {
      return jsonError("Only monthly subscriptions can be upgraded to yearly.", 400);
    }
    if (!hasActivePremium) {
      return jsonError("Your monthly plan is no longer active. Please start a new yearly plan.", 400);
    }
    const subscriptionId = String(profile?.paddle_subscription_id || "");
    if (!subscriptionId) {
      return jsonError("Missing Paddle subscription. Please contact support.", 400);
    }

    const updated = await paddlePatch<PaddleSubscription>(`/subscriptions/${encodeURIComponent(subscriptionId)}`, {
      proration_billing_mode: "prorated_immediately",
      custom_data: {
        deepfocus_user_id: userId,
        deepfocus_email: email || undefined,
        deepfocus_plan: "premium_yearly",
      },
      items: [
        {
          price_id: PADDLE_PRICE_ID_YEARLY,
          quantity: 1,
        },
      ],
    });

    return NextResponse.json({ subscriptionId: updated?.id || subscriptionId });
  } catch (e) {
    const raw = e instanceof Error ? e.message : "Unexpected server error.";
    const mapped = mapPaddleError(raw);
    return NextResponse.json({ error: mapped.message, code: mapped.code, detail: raw }, { status: 400 });
  }
}
