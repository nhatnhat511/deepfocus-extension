import { NextResponse } from "next/server";

export const runtime = "edge";

type PaddleWebhookEvent = {
  event_id?: string;
  event_type?: string;
  data?: Record<string, unknown>;
};

type PaddleSubscription = {
  id?: string;
  status?: string;
  customer_id?: string;
  custom_data?: Record<string, unknown>;
  next_billed_at?: string | null;
  current_billing_period?: {
    starts_at?: string | null;
    ends_at?: string | null;
  } | null;
};

type PaddleCustomer = {
  id?: string;
  email?: string;
};

const PADDLE_API_BASE = process.env.PADDLE_API_BASE_URL || "https://api.paddle.com";
const PADDLE_API_KEY = process.env.PADDLE_API_KEY || "";
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET || "";
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function jsonOk(data: Record<string, unknown> = {}) {
  return NextResponse.json(data, { status: 200 });
}

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function parseSignatureHeader(headerValue: string) {
  const parts = headerValue
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean);
  let ts = "";
  const signatures: string[] = [];

  for (const part of parts) {
    const [k, v] = part.split("=", 2);
    if (!k || !v) continue;
    if (k === "ts") ts = v;
    if (k === "h1") signatures.push(v);
  }

  return { ts, signatures };
}

function textToBytes(input: string) {
  return new TextEncoder().encode(input);
}

function bytesToHex(bytes: Uint8Array) {
  let out = "";
  for (const b of bytes) {
    out += b.toString(16).padStart(2, "0");
  }
  return out;
}

async function signHmacSha256Hex(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    textToBytes(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, textToBytes(message));
  return bytesToHex(new Uint8Array(signature));
}

function secureEqualHex(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

async function verifyPaddleSignature(rawBody: string, headerValue: string, secret: string) {
  const parsed = parseSignatureHeader(headerValue);
  if (!parsed.ts || !parsed.signatures.length) return false;

  const signedPayload = `${parsed.ts}:${rawBody}`;
  const expected = await signHmacSha256Hex(secret, signedPayload);
  const expectedLower = expected.toLowerCase();

  return parsed.signatures.some((candidate) => {
    const cand = String(candidate || "").toLowerCase();
    return secureEqualHex(cand, expectedLower);
  });
}

function isRecentSignature(headerValue: string, maxSkewSeconds = 300) {
  const parsed = parseSignatureHeader(headerValue);
  const ts = Number(parsed.ts || 0);
  if (!Number.isFinite(ts) || ts <= 0) return false;
  const now = Math.floor(Date.now() / 1000);
  return Math.abs(now - ts) <= maxSkewSeconds;
}

async function paddleApi<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${PADDLE_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${PADDLE_API_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });

  const payload = (await res.json().catch(() => ({}))) as {
    data?: T;
    error?: { detail?: string };
  };
  if (!res.ok) {
    throw new Error(payload.error?.detail || `Paddle API failed (${res.status})`);
  }
  return payload.data as T;
}

async function supabaseRpc<T>(fnName: string, params: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fnName}`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
    cache: "no-store",
  });

  const payload = (await res.json().catch(() => ({}))) as T & { message?: string };
  if (!res.ok) {
    throw new Error((payload as { message?: string })?.message || `Supabase RPC failed (${res.status})`);
  }
  return payload;
}

async function recordWebhookEvent(eventId: string, eventType: string, payload: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/paddle_webhook_events`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      event_id: eventId,
      event_type: eventType,
      payload,
      processed_at: new Date().toISOString(),
    }),
    cache: "no-store",
  });

  if (res.ok) return true;

  const raw = await res.text().catch(() => "");
  if (res.status === 409 || raw.includes("duplicate key")) {
    return false;
  }

  throw new Error(`Unable to record webhook event (${res.status})`);
}

async function isWebhookEventProcessed(eventId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/paddle_webhook_events?event_id=eq.${encodeURIComponent(eventId)}&select=event_id&limit=1`,
    {
      method: "GET",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    throw new Error(`Unable to check webhook idempotency (${res.status})`);
  }

  const rows = (await res.json().catch(() => [])) as Array<{ event_id?: string }>;
  return Array.isArray(rows) && rows.length > 0;
}

function toLowerEmail(value: unknown) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function toUserId(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function parseSubscriptionWindow(data: PaddleSubscription) {
  const fromCurrentPeriod = data.current_billing_period?.ends_at || null;
  const fromNextBilled = data.next_billed_at || null;
  return fromCurrentPeriod || fromNextBilled;
}

function derivePlanAndUntilFromSubscription(data: PaddleSubscription) {
  const status = String(data.status || "").toLowerCase();
  const rawUntil = parseSubscriptionWindow(data);
  const untilTs = rawUntil ? Date.parse(rawUntil) : NaN;
  const hasFutureWindow = Number.isFinite(untilTs) && untilTs > Date.now();

  const activeByStatus = status === "active" || status === "trialing" || status === "past_due";
  const shouldGrantPremium = activeByStatus || hasFutureWindow;

  return {
    plan: shouldGrantPremium ? "premium" : "free",
    premiumUntil: shouldGrantPremium && rawUntil ? rawUntil : null,
    status,
  };
}

async function resolveIdentityForEvent(
  eventType: string,
  data: Record<string, unknown>
): Promise<{
  email: string;
  userId: string;
  customerId: string;
  subscriptionId: string;
  subscription: PaddleSubscription | null;
}> {
  const customData = (data.custom_data || {}) as Record<string, unknown>;
  const directEmail = toLowerEmail(customData.deepfocus_email);
  const directUserId = toUserId(customData.deepfocus_user_id);
  const customerId = String(data.customer_id || "");
  let subscriptionId = String(data.subscription_id || "");
  let resolvedEmail = directEmail;
  let resolvedUserId = directUserId;
  let subscription: PaddleSubscription | null = null;

  if (eventType.startsWith("subscription.")) {
    subscription = data as unknown as PaddleSubscription;
    subscriptionId = String(subscription.id || subscriptionId || "");
    const subCustomData = (subscription.custom_data || {}) as Record<string, unknown>;
    const subEmail = toLowerEmail(subCustomData.deepfocus_email);
    const subUserId = toUserId(subCustomData.deepfocus_user_id);
    if (!resolvedEmail && subEmail) resolvedEmail = subEmail;
    if (!resolvedUserId && subUserId) resolvedUserId = subUserId;
  }

  if (!subscription && subscriptionId) {
    subscription = await paddleApi<PaddleSubscription>(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
  }

  if (!resolvedEmail && subscription?.custom_data) {
    resolvedEmail = toLowerEmail((subscription.custom_data as Record<string, unknown>).deepfocus_email);
  }
  if (!resolvedUserId && subscription?.custom_data) {
    resolvedUserId = toUserId((subscription.custom_data as Record<string, unknown>).deepfocus_user_id);
  }

  if (!resolvedEmail && customerId) {
    const customer = await paddleApi<PaddleCustomer>(`/customers/${encodeURIComponent(customerId)}`);
    resolvedEmail = toLowerEmail(customer.email);
  }

  return {
    email: resolvedEmail,
    userId: resolvedUserId,
    customerId: customerId || String(subscription?.customer_id || ""),
    subscriptionId: subscriptionId || String(subscription?.id || ""),
    subscription,
  };
}

async function applyProfileEntitlementByUserId(params: {
  userId: string;
  email: string;
  plan: string;
  premiumUntil: string | null;
  paddleSubscriptionId: string;
  paddleCustomerId: string;
  paddleStatus: string;
}) {
  return supabaseRpc<Array<{ success: boolean }>>("apply_paddle_billing_by_user_id", {
    p_user_id: params.userId,
    p_email: params.email || null,
    p_plan: params.plan,
    p_premium_until: params.premiumUntil,
    p_paddle_subscription_id: params.paddleSubscriptionId || null,
    p_paddle_customer_id: params.paddleCustomerId || null,
    p_paddle_status: params.paddleStatus || null,
  });
}

async function applyProfileEntitlementByEmail(params: {
  email: string;
  plan: string;
  premiumUntil: string | null;
  paddleSubscriptionId: string;
  paddleCustomerId: string;
  paddleStatus: string;
}) {
  return supabaseRpc<Array<{ success: boolean }>>("apply_paddle_billing_by_email", {
    p_email: params.email,
    p_plan: params.plan,
    p_premium_until: params.premiumUntil,
    p_paddle_subscription_id: params.paddleSubscriptionId || null,
    p_paddle_customer_id: params.paddleCustomerId || null,
    p_paddle_status: params.paddleStatus || null,
  });
}

async function handleWebhookEvent(eventType: string, data: Record<string, unknown>) {
  if (!eventType.startsWith("subscription.") && eventType !== "transaction.paid") {
    return;
  }

  const resolved = await resolveIdentityForEvent(eventType, data);
  if (!resolved.userId && !resolved.email) {
    throw new Error(`Unable to resolve account identity for ${eventType}`);
  }

  if (!resolved.subscription && eventType === "transaction.paid" && resolved.subscriptionId) {
    resolved.subscription = await paddleApi<PaddleSubscription>(
      `/subscriptions/${encodeURIComponent(resolved.subscriptionId)}`
    );
  }

  if (!resolved.subscription) {
    return;
  }

  const entitlement = derivePlanAndUntilFromSubscription(resolved.subscription);
  if (resolved.userId) {
    const resultById = await applyProfileEntitlementByUserId({
      userId: resolved.userId,
      email: resolved.email,
      plan: entitlement.plan,
      premiumUntil: entitlement.premiumUntil,
      paddleSubscriptionId: resolved.subscriptionId,
      paddleCustomerId: resolved.customerId,
      paddleStatus: entitlement.status,
    });
    const okById = Array.isArray(resultById) && resultById[0] && resultById[0].success === true;
    if (!okById) {
      throw new Error(`Profile mapping failed for user id: ${resolved.userId}`);
    }
    return;
  }

  const resultByEmail = await applyProfileEntitlementByEmail({
    email: resolved.email,
    plan: entitlement.plan,
    premiumUntil: entitlement.premiumUntil,
    paddleSubscriptionId: resolved.subscriptionId,
    paddleCustomerId: resolved.customerId,
    paddleStatus: entitlement.status,
  });
  const okByEmail = Array.isArray(resultByEmail) && resultByEmail[0] && resultByEmail[0].success === true;
  if (!okByEmail) {
    throw new Error(`Profile mapping failed for email: ${resolved.email}`);
  }
}

export async function POST(req: Request) {
  try {
    if (!PADDLE_WEBHOOK_SECRET) return jsonError("Missing PADDLE_WEBHOOK_SECRET", 500);
    if (!PADDLE_API_KEY) return jsonError("Missing PADDLE_API_KEY", 500);
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonError("Missing Supabase server credentials", 500);
    }

    const rawBody = await req.text();
    const signature = req.headers.get("paddle-signature") || "";
    if (!signature) return jsonError("Missing paddle-signature header.", 400);
    if (!isRecentSignature(signature)) return jsonError("Webhook timestamp is too old.", 400);

    if (!(await verifyPaddleSignature(rawBody, signature, PADDLE_WEBHOOK_SECRET))) {
      return jsonError("Invalid webhook signature.", 400);
    }

    const payloadForStore = JSON.parse(rawBody) as Record<string, unknown>;
    const event = payloadForStore as PaddleWebhookEvent;
    const eventId = String(event.event_id || "");
    const eventType = String(event.event_type || "");
    const data = (event.data || {}) as Record<string, unknown>;

    if (!eventId || !eventType) return jsonError("Invalid webhook payload.", 400);

    const alreadyProcessed = await isWebhookEventProcessed(eventId);
    if (alreadyProcessed) return jsonOk({ ok: true, duplicate: true });

    await handleWebhookEvent(eventType, data);
    await recordWebhookEvent(eventId, eventType, payloadForStore);
    return jsonOk({ ok: true });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Webhook processing failed.";
    return jsonError(msg, 500);
  }
}
