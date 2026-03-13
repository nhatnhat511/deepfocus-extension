import AuthFormClient from "@/components/AuthFormClient";
import LoginRedirector from "@/components/LoginRedirector";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr";

export const metadata = {
  title: "Sign In",
  description: "Sign in to manage your DeepFocus Time account and subscription.",
};

export const runtime = "edge";

export default async function LoginPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const cookieStore = await cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // no-op: login page only reads session for redirect
      },
    },
  });
  const { data } = await supabase.auth.getSession();
  const extRedirect = searchParams?.ext_redirect;
  const hasExtRedirect = Array.isArray(extRedirect) ? extRedirect[0] : extRedirect;
  if (data.session && !hasExtRedirect) {
    redirect("/account");
  }
  return (
    <>
      <LoginRedirector />
      <AuthFormClient mode="login" />
    </>
  );
}
