"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const error = params.get("error_description") || params.get("error");
    const hasToken = Boolean(params.get("access_token"));

    // Remove sensitive auth hash from the current URL.
    window.history.replaceState({}, "", "/auth/callback");

    if (error) {
      router.replace(`/?auth=error&message=${encodeURIComponent(error)}`);
      return;
    }

    router.replace(hasToken ? "/?auth=confirmed" : "/?auth=ok");
  }, [router]);

  return (
    <section className="max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 text-slate-700">
      Completing authentication...
    </section>
  );
}
