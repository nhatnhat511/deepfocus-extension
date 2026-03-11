"use client";

import { useEffect, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function AuthCallbackPage() {
  const supabaseRef = useRef(createSupabaseBrowserClient());

  useEffect(() => {
    if (typeof window === "undefined") return;
    const run = async () => {
      const { hash, search } = window.location;
      if (hash) {
        const params = new URLSearchParams(hash.replace(/^#/, ""));
        const accessToken = params.get("access_token");
        const flowType = params.get("type");
        const refreshToken = params.get("refresh_token") || "";
        if (accessToken) {
          const { error } = await supabaseRef.current.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            window.location.replace("/login");
            return;
          }
        }
        if (flowType === "recovery") {
          window.location.replace("/update-password");
          return;
        }
        window.location.replace("/account");
        return;
      }

      const query = new URLSearchParams(search);
      const code = query.get("code");
      const flowType = query.get("type") || "";
      if (!code) {
        window.location.replace("/login");
        return;
      }

      const { error } = await supabaseRef.current.auth.exchangeCodeForSession(code);
      if (error) {
        window.location.replace("/login");
        return;
      }
      if (flowType === "recovery") {
        window.location.replace("/update-password");
        return;
      }
      window.location.replace("/account");
    };

    void run();
  }, []);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold text-slate-900">Completing sign-in...</h1>
      <p className="mt-2 text-sm text-slate-600">Please keep this tab open while we finish.</p>
    </div>
  );
}
