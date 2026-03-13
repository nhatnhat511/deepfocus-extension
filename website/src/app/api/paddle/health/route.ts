import { NextResponse } from "next/server";

export const runtime = "edge";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function GET() {
  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonError("Missing Supabase server credentials.", 500);
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/paddle_billing_health`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
      cache: "no-store",
    });

    const payload = (await res.json().catch(() => ({}))) as Array<{ ok?: boolean; version?: string }> & {
      message?: string;
    };
    if (!res.ok) {
      return jsonError(payload?.message || "Paddle billing health check failed.", 500);
    }

    const ok = !!payload?.[0]?.ok;
    const version = String(payload?.[0]?.version || "");
    return NextResponse.json({ ok, version });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Paddle billing health check failed.";
    return jsonError(msg, 500);
  }
}
