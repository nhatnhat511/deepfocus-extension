"use client";

import { useEffect } from "react";

export default function AuthCallbackPage() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { hash } = window.location;
    if (!hash) {
      window.location.replace("/login");
      return;
    }
    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const accessToken = params.get("access_token");
    const flowType = params.get("type");
    if (accessToken && flowType === "recovery") {
      window.location.replace(`/update-password${hash}`);
      return;
    }
    window.location.replace(`/account${hash}`);
  }, []);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold text-slate-900">Completing sign-in...</h1>
      <p className="mt-2 text-sm text-slate-600">Please keep this tab open while we finish.</p>
    </div>
  );
}
