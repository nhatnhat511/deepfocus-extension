"use client";

import { useEffect } from "react";

export default function AuthHashRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { hash, pathname, search } = window.location;
    const isAuthCallback =
      pathname === "/account" ||
      pathname === "/update-password" ||
      pathname.startsWith("/auth/confirm") ||
      pathname.startsWith("/auth/callback");

    if (hash && hash.includes("access_token")) {
      if (isAuthCallback) return;
      const params = new URLSearchParams(hash.replace(/^#/, ""));
      const flowType = params.get("type") || "";
      const target = flowType === "recovery" ? `/update-password${hash}` : `/auth/callback${hash}`;
      window.location.replace(target);
      return;
    }

    if (!isAuthCallback && (pathname === "/login" || pathname === "/signup")) {
      const query = new URLSearchParams(search);
      if (query.get("code")) {
        window.location.replace(`/auth/callback${search}`);
      }
    }
  }, []);

  return null;
}
