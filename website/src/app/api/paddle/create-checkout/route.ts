import { NextResponse } from "next/server";

export const runtime = "edge";

type PaddleTransactionResponse = {
  data?: {
    id?: string;
  };
};

type CreateCheckoutBody = {
  email?: string;
};

const PADDLE_API_BASE = process.env.PADDLE_API_BASE_URL || "https://api.paddle.com";
const PADDLE_API_KEY = process.env.PADDLE_API_KEY || "";
const PADDLE_PRICE_ID = process.env.PADDLE_PRICE_ID || "";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://deepfocustime.com";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

type SupabaseUser = {
  id?: string;
  email?: string;
  email_confirmed_at?: string | null;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeEmail(input: string) {
  return input.trim().toLowerCase();
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

export async function POST(req: Request) {
  try {
    if (!PADDLE_API_KEY) return jsonError("Missing PADDLE_API_KEY", 500);
    if (!PADDLE_PRICE_ID) return jsonError("Missing PADDLE_PRICE_ID", 500);

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

    const body = (await req.json().catch(() => ({}))) as CreateCheckoutBody;
    const requestedEmail = normalizeEmail(String(body.email || ""));
    if (requestedEmail && requestedEmail !== email) {
      return jsonError("Checkout email must match your signed-in account.", 403);
    }

    const payload = {
      items: [{ price_id: PADDLE_PRICE_ID, quantity: 1 }],
      collection_mode: "automatic",
      checkout: {
        url: SITE_URL,
      },
      custom_data: {
        deepfocus_user_id: userId,
        deepfocus_email: email,
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
      error?: { detail?: string };
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
