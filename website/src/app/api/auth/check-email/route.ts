import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

type ListUsersResult = {
  users?: Array<{ email?: string | null }>;
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export async function POST(req: Request) {
  try {
    if (!SUPABASE_SERVICE_ROLE_KEY) {
      return jsonError("Missing SUPABASE_SERVICE_ROLE_KEY", 500);
    }

    const body = (await req.json().catch(() => ({}))) as { email?: string };
    const email = normalizeEmail(String(body.email || ""));
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return jsonError("Invalid email.", 400);
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });

    const perPage = 1000;
    let page = 1;
    while (true) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
      if (error) {
        return jsonError(error.message || "Unable to check email.", 500);
      }
      const users = (data as ListUsersResult | null)?.users || [];
      const found = users.some((u) => normalizeEmail(String(u.email || "")) === email);
      if (found) {
        return NextResponse.json({ exists: true });
      }
      if (users.length < perPage) {
        return NextResponse.json({ exists: false });
      }
      page += 1;
      if (page > 50) {
        return jsonError("Email check exceeded limit.", 500);
      }
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unexpected server error.";
    return jsonError(msg, 500);
  }
}
