import { NextResponse } from "next/server";

export const runtime = "edge";

type PaddleSubscription = {
  id?: string;
  customer_id?: string | null;
  status?: string | null;
  custom_data?: Record<string, unknown> | null;
  items?:
    | Array<{
        price_id?: string | null;
        price?: { id?: string | null; billing_cycle?: { interval?: string | null } | null } | null;
      }>
    | {
        data?: Array<{
          price_id?: string | null;
          price?: { id?: string | null; billing_cycle?: { interval?: string | null } | null } | null;
        }>;
      }
    | null;
  next_billed_at?: string | null;
  current_billing_period?: {
    starts_at?: string | null;
    ends_at?: string | null;
  } | null;
};

type PaddleResponse<T> = {
  data?: T;
  error?: { detail?: string };
};

type SupabaseUser = {
  id?: string;
  email?: string;
};

type ProfileRow = {
  paddle_subscription_id?: string | null;
  paddle_customer_id?: string | null;
};

const PADDLE_API_BASE = process.env.PADDLE_API_BASE_URL || "https://api.paddle.com";
const PADDLE_API_KEY = process.env.PADDLE_API_KEY || "";
const PADDLE_PRICE_ID_MONTHLY = process.env.PADDLE_PRICE_ID || "";
const PADDLE_PRICE_ID_YEARLY = process.env.PADDLE_PRICE_ID_YEARLY || "";
const SHOULD_WARN_MISSING_PRICE_IDS =
  !PADDLE_PRICE_ID_MONTHLY || !PADDLE_PRICE_ID_YEARLY;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function warnMissingPriceIds(context: string) {
  if (!SHOULD_WARN_MISSING_PRICE_IDS) return;
  console.warn(
    `[paddle] ${context}: missing price ids (monthly=${Boolean(PADDLE_PRICE_ID_MONTHLY)}, yearly=${Boolean(
      PADDLE_PRICE_ID_YEARLY
    )})`
  );
}

function parseSubscriptionWindow(data: PaddleSubscription) {
  const fromCurrentPeriod = data.current_billing_period?.ends_at || null;
  const fromNextBilled = data.next_billed_at || null;
  return fromCurrentPeriod || fromNextBilled;
}

function inferPlanFromPeriod(data: PaddleSubscription) {
  const startRaw = data.current_billing_period?.starts_at || "";
  const endRaw = data.current_billing_period?.ends_at || "";
  const startTs = startRaw ? Date.parse(startRaw) : NaN;
  const endTs = endRaw ? Date.parse(endRaw) : NaN;
  const now = Date.now();
  const durationMs = Number.isFinite(startTs) && Number.isFinite(endTs) ? endTs - startTs : NaN;
  const remainingMs = Number.isFinite(endTs) ? endTs - now : NaN;
  const days = Number.isFinite(durationMs) ? durationMs / (1000 * 60 * 60 * 24) : NaN;
  const remainingDays = Number.isFinite(remainingMs) ? remainingMs / (1000 * 60 * 60 * 24) : NaN;

  if (Number.isFinite(days)) {
    if (days >= 300) return "premium_yearly";
    if (days >= 20) return "premium_monthly";
  }
  if (Number.isFinite(remainingDays)) {
    if (remainingDays >= 200) return "premium_yearly";
    if (remainingDays >= 10) return "premium_monthly";
  }
  return "";
}

function derivePlanAndUntilFromSubscription(data: PaddleSubscription) {
  const status = String(data.status || "").toLowerCase();
  const rawUntil = parseSubscriptionWindow(data);
  const untilTs = rawUntil ? Date.parse(rawUntil) : NaN;
  const hasFutureWindow = Number.isFinite(untilTs) && untilTs > Date.now();
  const activeByStatus = status === "active" || status === "trialing" || status === "past_due";
  const shouldGrantPremium = activeByStatus || hasFutureWindow;

  let resolvedPlan = "";
  const items = Array.isArray(data.items)
    ? data.items
    : (data.items?.data || []);
  if (items.length > 0) {
    const priceIds = items.map((item) => item.price_id || item.price?.id || "").filter(Boolean);
    if (PADDLE_PRICE_ID_YEARLY && priceIds.includes(PADDLE_PRICE_ID_YEARLY)) {
      resolvedPlan = "premium_yearly";
    } else if (PADDLE_PRICE_ID_MONTHLY && priceIds.includes(PADDLE_PRICE_ID_MONTHLY)) {
      resolvedPlan = "premium_monthly";
    } else {
      const interval = String(items[0]?.price?.billing_cycle?.interval || "").toLowerCase();
      if (interval === "year" || interval === "yearly" || interval === "annual") {
        resolvedPlan = "premium_yearly";
      } else if (interval === "month" || interval === "monthly") {
        resolvedPlan = "premium_monthly";
      }
    }
  }
  if (!resolvedPlan) {
    resolvedPlan = inferPlanFromPeriod(data);
  }

  const normalizedPlan = resolvedPlan || "premium_monthly";
  return {
    plan: shouldGrantPremium ? normalizedPlan : "free",
    premiumUntil: shouldGrantPremium && rawUntil ? rawUntil : null,
    status,
  };
}

async function getUserFromAccessToken(accessToken: string) {
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
    `${SUPABASE_URL}/rest/v1/profiles?select=paddle_subscription_id,paddle_customer_id&id=eq.${encodeURIComponent(
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

async function paddleGet<T>(path: string): Promise<T> {
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
    const detail = payload.error?.detail || `Paddle API failed (${res.status})`;
    throw new Error(detail);
  }
  return payload.data as T;
}

type PaddleCustomer = {
  id?: string;
  email?: string;
};

async function resolveCustomerIdByEmail(email: string) {
  if (!email) return "";
  const list = await paddleGet<PaddleCustomer[]>(`/customers?email=${encodeURIComponent(email)}&per_page=5`);
  if (!Array.isArray(list) || list.length === 0) return "";
  const exact = list.find((item) => String(item.email || "").toLowerCase() === email.toLowerCase());
  return String((exact || list[0]).id || "");
}

async function applyProfileEntitlementByUserId(params: {
  userId: string;
  email: string;
  plan: string;
  premiumUntil: string | null;
  paddleSubscriptionId: string;
  paddleCustomerId?: string | null;
  paddleStatus: string;
}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/apply_paddle_billing_by_user_id`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_user_id: params.userId,
      p_email: params.email || null,
      p_plan: params.plan,
      p_premium_until: params.premiumUntil,
      p_paddle_subscription_id: params.paddleSubscriptionId || null,
      p_paddle_customer_id: params.paddleCustomerId || null,
      p_paddle_status: params.paddleStatus || null,
    }),
    cache: "no-store",
  });
  const payload = (await res.json().catch(() => ({}))) as Array<{ success?: boolean }> & { message?: string };
  if (!res.ok) {
    throw new Error(payload?.message || `Supabase RPC failed (${res.status})`);
  }
  return payload;
}

function parseSubscriptionEndDate(subscription: PaddleSubscription) {
  const raw = parseSubscriptionWindow(subscription);
  if (!raw) return 0;
  const ts = Date.parse(raw);
  return Number.isFinite(ts) ? ts : 0;
}

function isActiveStatus(status: string) {
  const normalized = status.toLowerCase();
  return normalized === "active" || normalized === "trialing" || normalized === "past_due";
}

function pickBestSubscription(subscriptions: PaddleSubscription[], userId: string) {
  if (!subscriptions.length) return null;
  const normalizedUserId = String(userId || "").trim();
  const matchesUser = subscriptions.filter((sub) => {
    if (!normalizedUserId) return false;
    const customData = (sub.custom_data || {}) as Record<string, unknown>;
    return String(customData.deepfocus_user_id || "").trim() === normalizedUserId;
  });
  const pool = matchesUser.length ? matchesUser : subscriptions;
  const active = pool.filter((sub) => isActiveStatus(String(sub.status || "")));
  const candidates = active.length ? active : pool;
  return candidates.reduce((best, current) => {
    const bestEnd = parseSubscriptionEndDate(best);
    const currentEnd = parseSubscriptionEndDate(current);
    return currentEnd > bestEnd ? current : best;
  }, candidates[0]);
}

export async function POST(req: Request) {
  try {
    if (!PADDLE_API_KEY) return jsonError("Missing PADDLE_API_KEY", 500);
    if (!SUPABASE_SERVICE_ROLE_KEY) return jsonError("Missing SUPABASE_SERVICE_ROLE_KEY", 500);

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
    const subscriptionId = String(profile?.paddle_subscription_id || "");
    const customerId = String(profile?.paddle_customer_id || "");

    let subscription: PaddleSubscription | null = null;
    if (subscriptionId) {
      subscription = await paddleGet<PaddleSubscription>(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
    }

    let resolvedCustomerId = customerId;
    if (!resolvedCustomerId && subscription?.customer_id) {
      resolvedCustomerId = String(subscription.customer_id || "");
    }
    if (!resolvedCustomerId && email) {
      resolvedCustomerId = await resolveCustomerIdByEmail(email);
    }

    if (resolvedCustomerId) {
      const list = await paddleGet<PaddleSubscription[]>(
        `/subscriptions?customer_id=${encodeURIComponent(resolvedCustomerId)}&per_page=20`
      );
      const best = pickBestSubscription(list || [], userId);
      if (best) {
        if (!subscription || best.id !== subscription.id) {
          subscription = best;
        }
      } else if (!subscription) {
        return jsonError("Unable to match Paddle subscription to this account.", 400);
      }
    }

    if (!subscription) {
      return jsonError("Missing Paddle subscription.", 400);
    }

    warnMissingPriceIds("sync-subscription");
    const entitlement = derivePlanAndUntilFromSubscription(subscription);

    await applyProfileEntitlementByUserId({
      userId,
      email,
      plan: entitlement.plan,
      premiumUntil: entitlement.premiumUntil,
      paddleSubscriptionId: String(subscription.id || subscriptionId),
      paddleCustomerId: subscription.customer_id || resolvedCustomerId || null,
      paddleStatus: entitlement.status,
    });

    return NextResponse.json({
      plan: entitlement.plan,
      premiumUntil: entitlement.premiumUntil,
      status: entitlement.status,
      subscriptionId: String(subscription.id || subscriptionId),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to sync subscription.";
    return jsonError(msg, 500);
  }
}
