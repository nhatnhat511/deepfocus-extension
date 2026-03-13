"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ExtensionLoginPage() {
  const searchParams = useSearchParams();
  const extRedirect = searchParams.get("ext_redirect") || "";

  useEffect(() => {
    if (!extRedirect) return;
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (session?.access_token && session.refresh_token) {
        const hash = new URLSearchParams({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          token_type: session.token_type || "bearer",
          expires_in: String(session.expires_in || 0),
          expires_at: String(session.expires_at || 0),
        });
        window.location.replace(`${extRedirect}#${hash.toString()}`);
        return;
      }
      const loginUrl = `https://deepfocustime.com/login?ext_redirect=${encodeURIComponent(extRedirect)}`;
      window.location.replace(loginUrl);
    });
  }, [extRedirect]);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold text-slate-900">Opening sign-in…</h1>
      <p className="mt-2 text-sm text-slate-600">
        Please keep this tab open while we connect your account.
      </p>
    </div>
  );
}
