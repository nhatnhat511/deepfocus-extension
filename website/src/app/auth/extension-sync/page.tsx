"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function ExtensionSyncPage() {
  const router = useRouter();
  const [message, setMessage] = useState("Syncing your session...");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const accessToken = hash.get("access_token");
    const refreshToken = hash.get("refresh_token");

    if (!accessToken || !refreshToken) {
      setMessage("Missing session data. Please return to the extension and try again.");
      return;
    }

    supabase.auth
      .setSession({ access_token: accessToken, refresh_token: refreshToken })
      .then(({ error }) => {
        if (error) {
          setMessage("Unable to sync session. Please try again.");
          return;
        }
        router.replace("/account");
      });
  }, [router]);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold text-slate-900">Completing sign-in</h1>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
    </div>
  );
}
