import { NextResponse } from "next/server";

export const runtime = "edge";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

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

    const perPage = 1000;
    let page = 1;
    while (true) {
      const url = new URL("/auth/v1/admin/users", SUPABASE_URL);
      url.searchParams.set("page", String(page));
      url.searchParams.set("per_page", String(perPage));
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { message?: string };
        return jsonError(payload?.message || "Unable to check email.", 500);
      }
      const payload = (await response.json().catch(() => ({}))) as {
        users?: Array<{
          email?: string | null;
          identities?: Array<{ provider?: string | null }> | null;
          app_metadata?: { provider?: string | null; providers?: string[] | null } | null;
        }>;
      };
      const users = payload?.users || [];
      const match = users.find((u) => normalizeEmail(String(u.email || "")) === email);
      if (match) {
        const appMeta = match.app_metadata || {};
        const providers = Array.isArray(appMeta.providers) ? appMeta.providers : [];
        const appProvider = typeof appMeta.provider === "string" ? appMeta.provider : "";
        const identityProviders = Array.isArray(match.identities)
          ? match.identities
              .map((identity) => (typeof identity?.provider === "string" ? identity.provider : ""))
              .filter(Boolean)
          : [];
        const provider =
          appProvider || providers[0] || identityProviders[0] || "email";
        return NextResponse.json({ exists: true, provider });
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
