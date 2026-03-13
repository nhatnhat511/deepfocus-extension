import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "edge";

function getAllowedOrigin(origin: string | null) {
  if (!origin) return "";
  if (origin.startsWith("chrome-extension://")) return origin;
  if (/^https:\/\/[a-z0-9-]+\.chromiumapp\.org$/i.test(origin)) return origin;
  return "";
}

function buildCorsHeaders(origin: string) {
  const headers = new Headers();
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }
  headers.set("Access-Control-Allow-Methods", "GET,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  return headers;
}

export async function OPTIONS(req: Request) {
  const origin = getAllowedOrigin(req.headers.get("origin"));
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

export async function GET(req: Request) {
  const origin = getAllowedOrigin(req.headers.get("origin"));
  const headers = buildCorsHeaders(origin);

  try {
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      return NextResponse.json({ authenticated: false }, { status: 401, headers });
    }
    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: data.user.id,
          email: data.user.email ?? null,
        },
      },
      { status: 200, headers }
    );
  } catch (_e) {
    return NextResponse.json({ authenticated: false }, { status: 401, headers });
  }
}
