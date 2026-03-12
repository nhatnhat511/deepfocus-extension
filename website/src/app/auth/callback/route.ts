import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SetAllCookies } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const flowType = url.searchParams.get("type") || "";
  const nextParam = url.searchParams.get("next") || "";

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  const safeNext =
    nextParam.startsWith("/") && !nextParam.startsWith("//") && !nextParam.includes("://") ? nextParam : "";
  const redirectTarget = flowType === "recovery" ? "/update-password" : safeNext || "/account";
  const response = NextResponse.redirect(new URL(redirectTarget, request.url));
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    const reason = encodeURIComponent(error.message || "exchange_failed");
    return NextResponse.redirect(new URL(`/login?error=callback_failed&reason=${reason}`, request.url));
  }

  return response;
}
