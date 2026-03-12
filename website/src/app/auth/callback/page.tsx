"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createClient } from "@supabase/supabase-js";

export default function AuthCallbackPage() {
  const supabaseRef = useRef(createSupabaseBrowserClient());
  const oauthClientRef = useRef(
    createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co",
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr",
      {
        auth: {
          flowType: "pkce",
          autoRefreshToken: false,
          // Persist PKCE verifier so exchangeCodeForSession can succeed after redirect.
          persistSession: true,
          detectSessionInUrl: false,
        },
      }
    )
  );
  const [message, setMessage] = useState("Completing sign-in...");

  useEffect(() => {
    if (typeof window === "undefined") return;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const redirectTo = (path: string) => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
      window.location.replace(path);
    };

    const run = async () => {
      try {
        const { hash, search } = window.location;
        if (hash) {
          const params = new URLSearchParams(hash.replace(/^#/, ""));
          const flowType = params.get("type");
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token") || "";
          if (!accessToken) {
            redirectTo("/login?error=missing_token");
            return;
          }
          const { error } = await supabaseRef.current.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            redirectTo("/login?error=oauth_session");
            return;
          }
          // Give cookies a brief moment to persist before redirecting.
          await new Promise((resolve) => setTimeout(resolve, 150));
          if (flowType === "recovery") {
            redirectTo("/update-password");
            return;
          }
          redirectTo("/account");
          return;
        }

        const query = new URLSearchParams(search);
        const code = query.get("code");
        const flowType = query.get("type") || "";
        if (!code) {
          redirectTo("/login?error=missing_code");
          return;
        }

        const { data, error } = await oauthClientRef.current.auth.exchangeCodeForSession(code);
        if (error) {
          redirectTo("/login?error=exchange_failed");
          return;
        }
        const exchangedSession = data?.session ?? null;
        if (exchangedSession?.access_token && exchangedSession?.refresh_token) {
          const { error: cookieError } = await supabaseRef.current.auth.setSession({
            access_token: exchangedSession.access_token,
            refresh_token: exchangedSession.refresh_token,
          });
          if (cookieError) {
            redirectTo("/login?error=callback_failed");
            return;
          }
        }
        if (!exchangedSession) {
          redirectTo("/login?error=callback_failed");
          return;
        }
        if (flowType === "recovery") {
          redirectTo("/update-password");
          return;
        }
        redirectTo("/account");
      } catch {
        redirectTo("/login?error=callback_failed");
      }
    };

    fallbackTimer = setTimeout(() => {
      setMessage("Still working... redirecting you to your account.");
      redirectTo("/account");
    }, 5000);

    void run();

    return () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold text-slate-900">{message}</h1>
      <p className="mt-2 text-sm text-slate-600">Please keep this tab open while we finish.</p>
    </div>
  );
}
