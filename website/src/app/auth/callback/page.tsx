"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { createClient } from "@supabase/supabase-js";

export default function AuthCallbackPage() {
  const supabaseRef = useRef(createSupabaseBrowserClient());
  const hasRunRef = useRef(false);
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
          storageKey: "df_oauth_auth",
        },
      }
    )
  );
  const [message, setMessage] = useState("Completing sign-in...");
  const [errorMessage, setErrorMessage] = useState("");
  const goLogin = () => {
    if (typeof window !== "undefined") {
      window.location.replace("/login");
    }
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hasRunRef.current) return;
    hasRunRef.current = true;
    let fallbackTimer: ReturnType<typeof setTimeout> | null = null;

    const redirectTo = (path: string) => {
      if (fallbackTimer) {
        clearTimeout(fallbackTimer);
      }
      window.location.replace(path);
    };

    const run = async () => {
      try {
        const maybeStop = supabaseRef.current.auth as typeof supabaseRef.current.auth & { stopAutoRefresh?: () => void };
        if (maybeStop.stopAutoRefresh) {
          maybeStop.stopAutoRefresh();
        }

        // Clear stale session tokens without touching PKCE code_verifier.
        const projectRef = (process.env.NEXT_PUBLIC_SUPABASE_URL || "")
          .replace("https://", "")
          .split(".")[0];
        const tokenKey = projectRef ? `sb-${projectRef}-auth-token` : "";
        if (tokenKey && typeof window !== "undefined") {
          try {
            window.localStorage.removeItem(tokenKey);
          } catch {
            // ignore
          }
          const domain = window.location.hostname.endsWith("deepfocustime.com") ? ".deepfocustime.com" : "";
          const baseCookie = `${tokenKey}=; Max-Age=0; path=/`;
          document.cookie = domain ? `${baseCookie}; domain=${domain}` : baseCookie;
          document.cookie = baseCookie;
        }

        const { hash, search } = window.location;
        if (hash) {
          const params = new URLSearchParams(hash.replace(/^#/, ""));
          const flowType = params.get("type");
          const accessToken = params.get("access_token");
          const refreshToken = params.get("refresh_token") || "";
          const hashError = params.get("error") || params.get("error_description");
          if (accessToken) {
            const { error } = await supabaseRef.current.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              setErrorMessage(`Session error: ${error.message || "unknown error"}`);
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
          if (hashError) {
            setErrorMessage(`OAuth error: ${hashError}`);
            return;
          }
          // Ignore empty hash and continue with code flow.
        }

        const query = new URLSearchParams(search);
        const code = query.get("code");
        const flowType = query.get("type") || "";
        if (!code) {
          setErrorMessage("Missing authorization code.");
          return;
        }
        const codeKey = `df_oauth_code_${code}`;
        try {
          if (window.sessionStorage.getItem(codeKey)) {
            setErrorMessage("This sign-in attempt has already been processed. Please try again.");
            return;
          }
          window.sessionStorage.setItem(codeKey, "1");
        } catch {
          // ignore storage errors
        }

        const { data, error } = await oauthClientRef.current.auth.exchangeCodeForSession(code);
        if (error) {
          setErrorMessage(`Exchange failed: ${error.message || "unknown error"}`);
          return;
        }
        const exchangedSession = data?.session ?? null;
        if (exchangedSession?.access_token && exchangedSession?.refresh_token) {
          const { error: cookieError } = await supabaseRef.current.auth.setSession({
            access_token: exchangedSession.access_token,
            refresh_token: exchangedSession.refresh_token,
          });
          if (cookieError) {
            setErrorMessage(`Cookie session error: ${cookieError.message || "unknown error"}`);
            return;
          }
        }
        if (!exchangedSession) {
          setErrorMessage("No session returned from OAuth exchange.");
          return;
        }
        if (flowType === "recovery") {
          redirectTo("/update-password");
          return;
        }
        redirectTo("/account");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown callback error.";
        setErrorMessage(msg);
      }
    };

    fallbackTimer = setTimeout(() => {
      setMessage("Still working... please keep this tab open.");
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
      {errorMessage ? (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {errorMessage}
          <div className="mt-3">
            <button
              type="button"
              onClick={goLogin}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-rose-500"
            >
              Return to login
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
