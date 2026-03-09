"use client";

import { useEffect, useState } from "react";

function isValidExtensionRedirect(url: string) {
  return /^https:\/\/[a-z0-9]{32}\.chromiumapp\.org(\/.*)?$/i.test(url);
}

export default function ExtensionAuthCallbackPage() {
  const [message, setMessage] = useState("Completing sign-in...");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const run = () => {
      const current = new URL(window.location.href);
      const extRedirect = current.searchParams.get("ext_redirect") || "";

      if (!isValidExtensionRedirect(extRedirect)) {
        setMessage("Missing or invalid extension redirect. Please return to the extension popup and try again.");
        return;
      }

      const hashParams = new URLSearchParams(current.hash.replace(/^#/, ""));
      const queryParams = new URLSearchParams(current.search);
      queryParams.delete("ext_redirect");

      const payload = new URLSearchParams();
      hashParams.forEach((value, key) => payload.set(key, value));
      queryParams.forEach((value, key) => {
        if (!payload.has(key)) payload.set(key, value);
      });

      const finalUrl = payload.toString() ? `${extRedirect}#${payload.toString()}` : extRedirect;
      window.location.replace(finalUrl);
    };

    run();
  }, []);

  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-slate-200 bg-white p-6">
      <h1 className="text-xl font-semibold text-slate-900">Extension Sign-in</h1>
      <p className="mt-2 text-sm text-slate-600">{message}</p>
    </div>
  );
}
