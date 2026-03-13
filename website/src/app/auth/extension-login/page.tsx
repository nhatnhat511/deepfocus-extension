import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@supabase/ssr";
import type { SetAllCookies } from "@supabase/ssr";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr";

export const runtime = "edge";

type ExtensionLoginProps = {
  searchParams?: { ext_redirect?: string };
};

export default async function ExtensionLoginPage({ searchParams }: ExtensionLoginProps) {
  const extRedirect = searchParams?.ext_redirect || "";
  if (!extRedirect) {
    return (
      <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-slate-900">Opening sign-in…</h1>
        <p className="mt-2 text-sm text-slate-600">
          Missing extension redirect. Please return to the extension and try again.
        </p>
      </div>
    );
  }

  if (!/^https:\/\/[a-z0-9]{32}\.chromiumapp\.org(\/.*)?$/i.test(extRedirect)) {
    redirect(`/login`);
  }

  const cookieStore = cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: Parameters<SetAllCookies>[0]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set(name, value, options);
        });
      },
    },
  });

  const { data } = await supabase.auth.getSession();
  if (data?.session) {
    const session = data.session;
    const hash = new URLSearchParams({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      token_type: session.token_type || "bearer",
      expires_in: String(session.expires_in || 0),
      expires_at: String(session.expires_at || 0),
    });
    redirect(`${extRedirect}#${hash.toString()}`);
  }

  redirect(`/login?ext_redirect=${encodeURIComponent(extRedirect)}`);
}
