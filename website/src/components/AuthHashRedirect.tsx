"use client";

import { useEffect } from "react";

export default function AuthHashRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { hash, pathname } = window.location;
    if (!hash || !hash.includes("access_token")) return;
    if (
      pathname === "/account" ||
      pathname === "/update-password" ||
      pathname.startsWith("/auth/confirm") ||
      pathname.startsWith("/auth/callback")
    )
      return;

    const params = new URLSearchParams(hash.replace(/^#/, ""));
    const flowType = params.get("type") || "";
    const target = flowType === "recovery" ? `/update-password${hash}` : `/auth/callback${hash}`;
    window.location.replace(target);
  }, []);

  return null;
}
