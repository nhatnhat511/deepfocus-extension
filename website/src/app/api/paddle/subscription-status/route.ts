import { NextResponse } from "next/server";

export const runtime = "edge";

type PaddleSubscription = {
  id?: string;
  status?: string;
  next_billed_at?: string | null;
  current_billing_period?: {
    starts_at?: string | null;
    ends_at?: string | null;
  } | null;
  scheduled_change?: {
    action?: string | null;
    effective_at?: string | null;
  } | null;
};

type PaddleResponse<T> = {
  data?: T;
  error?: { detail?: string };
};

const PADDLE_API_BASE = process.env.PADDLE_API_BASE_URL || "https://api.paddle.com";
const PADDLE_API_KEY = process.env.PADDLE_API_KEY || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://deepfocustime.com";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr";

type SupabaseUser = {
  id?: string;
};

type ProfileRow = {
  paddle_subscription_id?: string | null;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
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
    `${SUPABASE_URL}/rest/v1/profiles?select=paddle_subscription_id&id=eq.${encodeURIComponent(userId)}&limit=1`,
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

async function paddleApi<T>(path: string): Promise<T> {
  const res = await fetch(`${PADDLE_API_BASE}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const payload = (await res.json().catch(() => ({}))) as PaddleResponse<T>;
  if (!res.ok) {
    throw new Error(payload.error?.detail || `Paddle API failed (${res.status})`);
  }
  return payload.data as T;
}

export async function POST(req: Request) {
  try {
    if (!PADDLE_API_KEY) return jsonError("Missing PADDLE_API_KEY", 500);
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

    const profile = await getProfile(accessToken, userId);
    const subscriptionId = String(profile?.paddle_subscription_id || "");
    if (!subscriptionId) {
      return jsonError("Missing Paddle subscription.", 400);
    }

    const subscription = await paddleApi<PaddleSubscription>(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
    return NextResponse.json({
      status: subscription.status || "",
      nextBilledAt: subscription.next_billed_at || null,
      currentPeriodEndsAt: subscription.current_billing_period?.ends_at || null,
      scheduledChange: subscription.scheduled_change
        ? {
            action: subscription.scheduled_change.action || "",
            effectiveAt: subscription.scheduled_change.effective_at || null,
          }
        : null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected server error.";
    return jsonError(msg, 500);
  }
}
