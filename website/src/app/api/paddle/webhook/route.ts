import { NextResponse } from "next/server";

type PaddleEvent = {
  event_type?: string;
  data?: Record<string, unknown>;
};

type SignatureParts = {
  ts: string;
  h1: string;
};

function parsePaddleSignature(headerValue: string): SignatureParts | null {
  const map = new Map<string, string>();
  headerValue.split(";").forEach((pair) => {
    const [k, v] = pair.split("=");
    if (!k || !v) return;
    map.set(k.trim(), v.trim());
  });
  const ts = map.get("ts");
  const h1 = map.get("h1");
  if (!ts || !h1) return null;
  return { ts, h1 };
}

function hexToBytes(hex: string) {
  const normalized = hex.trim().toLowerCase();
  if (!/^[0-9a-f]+$/.test(normalized) || normalized.length % 2 !== 0) return null;
  const out = new Uint8Array(normalized.length / 2);
  for (let i = 0; i < normalized.length; i += 2) {
    out[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
  }
  return out;
}

function constantTimeEqual(a: Uint8Array, b: Uint8Array) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a[i] ^ b[i];
  }
  return diff === 0;
}

async function verifyWebhookSignature(rawBody: string, signatureHeader: string, secret: string) {
  const parts = parsePaddleSignature(signatureHeader);
  if (!parts) return false;

  const signedPayload = `${parts.ts}:${rawBody}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expected = new Uint8Array(digest);
  const received = hexToBytes(parts.h1);
  if (!received) return false;
  return constantTimeEqual(expected, received);
}

function getNestedString(obj: Record<string, unknown>, path: string[]): string | null {
  let cur: unknown = obj;
  for (const key of path) {
    if (!cur || typeof cur !== "object") return null;
    cur = (cur as Record<string, unknown>)[key];
  }
  if (typeof cur !== "string") return null;
  return cur;
}

function extractAccountEmail(data: Record<string, unknown>) {
  return (
    getNestedString(data, ["custom_data", "account_email"]) ||
    getNestedString(data, ["customer", "email"]) ||
    getNestedString(data, ["billing_details", "email"]) ||
    null
  );
}

function extractPremiumUntil(data: Record<string, unknown>) {
  const candidates = [
    getNestedString(data, ["next_billed_at"]),
    getNestedString(data, ["current_billing_period", "ends_at"]),
    getNestedString(data, ["scheduled_change", "effective_at"]),
  ];
  for (const value of candidates) {
    if (!value) continue;
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  const fallback = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  return fallback.toISOString();
}

async function updateProfilePlanByEmail(email: string, plan: "free" | "premium", premiumUntil: string | null) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) return;

  const url = `${supabaseUrl}/rest/v1/profiles?email=eq.${encodeURIComponent(email.toLowerCase())}`;
  await fetch(url, {
    method: "PATCH",
    headers: {
      apikey: serviceRole,
      Authorization: `Bearer ${serviceRole}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      plan,
      premium_until: premiumUntil,
    }),
  });
}

export async function POST(req: Request) {
  const webhookSecret = process.env.PADDLE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook secret is missing." }, { status: 500 });
  }

  const signature = req.headers.get("paddle-signature");
  const rawBody = await req.text();

  if (!signature) {
    return NextResponse.json({ error: "Missing signature header." }, { status: 401 });
  }

  const isValid = await verifyWebhookSignature(rawBody, signature, webhookSecret);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 401 });
  }

  const event = JSON.parse(rawBody) as PaddleEvent;
  const eventType = event.event_type || "";
  const data = (event.data || {}) as Record<string, unknown>;
  const email = extractAccountEmail(data);

  if (!email) {
    return NextResponse.json({ ok: true, skipped: "No account email found in payload." });
  }

  if (eventType === "subscription.canceled") {
    await updateProfilePlanByEmail(email, "free", null);
    return NextResponse.json({ ok: true, plan: "free" });
  }

  if (
    eventType === "transaction.completed" ||
    eventType === "subscription.created" ||
    eventType === "subscription.activated" ||
    eventType === "subscription.updated"
  ) {
    const premiumUntil = extractPremiumUntil(data);
    await updateProfilePlanByEmail(email, "premium", premiumUntil);
    return NextResponse.json({ ok: true, plan: "premium", premiumUntil });
  }

  return NextResponse.json({ ok: true, ignored: eventType || "unknown" });
}
