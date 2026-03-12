import { NextResponse } from "next/server";

export const runtime = "edge";

type PaddleTransaction = {
  id?: string;
  status?: string | null;
  created_at?: string | null;
  currency_code?: string | null;
  details?: {
    totals?: {
      grand_total?: string | number | null;
      total?: string | number | null;
      currency_code?: string | null;
    } | null;
  } | null;
  totals?: {
    grand_total?: string | number | null;
    total?: string | number | null;
    currency_code?: string | null;
  } | null;
  amount?: {
    total?: string | number | null;
    value?: string | number | null;
    currency_code?: string | null;
  } | null;
};

type PaddleListResponse<T> = {
  data?: T[];
  error?: { detail?: string };
};

type SupabaseUser = {
  id?: string;
};

type ProfileRow = {
  paddle_subscription_id?: string | null;
};

const PADDLE_API_BASE = process.env.PADDLE_API_BASE_URL || "https://api.paddle.com";
const PADDLE_API_KEY = process.env.PADDLE_API_KEY || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co";
const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function pickAmount(tx: PaddleTransaction) {
  const candidates: Array<string | number | null | undefined> = [
    tx.details?.totals?.grand_total,
    tx.details?.totals?.total,
    tx.totals?.grand_total,
    tx.totals?.total,
    tx.amount?.total,
    tx.amount?.value,
  ];
  const value = candidates.find((entry) => entry !== undefined && entry !== null);
  return value != null ? String(value) : "";
}

function pickCurrency(tx: PaddleTransaction) {
  const candidates: Array<string | null | undefined> = [
    tx.currency_code,
    tx.details?.totals?.currency_code,
    tx.totals?.currency_code,
    tx.amount?.currency_code,
  ];
  const value = candidates.find((entry) => entry);
  return value ? String(value) : "";
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

async function paddleList<T>(path: string): Promise<T[]> {
  const res = await fetch(`${PADDLE_API_BASE}${path}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PADDLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });
  const payload = (await res.json().catch(() => ({}))) as PaddleListResponse<T>;
  if (!res.ok) {
    const detail = payload.error?.detail || `Paddle API failed (${res.status})`;
    throw new Error(detail);
  }
  return payload.data || [];
}

export async function POST(req: Request) {
  try {
    if (!PADDLE_API_KEY) return jsonError("Missing PADDLE_API_KEY", 500);

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

    const transactions = await paddleList<PaddleTransaction>(
      `/transactions?subscription_id=${encodeURIComponent(subscriptionId)}&per_page=5`
    );
    if (!transactions.length) {
      return NextResponse.json({ status: "missing" });
    }

    const latest = transactions.find((tx) => {
      const status = String(tx.status || "").toLowerCase();
      return status === "paid" || status === "completed";
    }) || transactions[0];

    return NextResponse.json({
      transactionId: latest.id || "",
      status: latest.status || "",
      createdAt: latest.created_at || "",
      amount: pickAmount(latest),
      currency: pickCurrency(latest),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unable to fetch latest transaction.";
    return jsonError(msg, 500);
  }
}
