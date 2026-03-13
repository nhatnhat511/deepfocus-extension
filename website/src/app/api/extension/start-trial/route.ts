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
  headers.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  headers.set("Access-Control-Allow-Headers", "content-type, authorization");
  return headers;
}

export async function OPTIONS(req: Request) {
  const origin = getAllowedOrigin(req.headers.get("origin"));
  return new NextResponse(null, { status: 204, headers: buildCorsHeaders(origin) });
}

export async function POST(req: Request) {
  const origin = getAllowedOrigin(req.headers.get("origin"));
  const headers = buildCorsHeaders(origin);

  try {
    const supabase = await createSupabaseServerClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401, headers });
    }

    const { data, error } = await supabase.rpc("start_free_trial");
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400, headers });
    }

    return NextResponse.json(data ?? null, { status: 200, headers });
  } catch (_e) {
    return NextResponse.json({ error: "Unable to activate trial." }, { status: 500, headers });
  }
}
