"use client";

import { useEffect } from "react";

export default function AuthHashRedirect() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const { hash, pathname } = window.location;
    if (!hash || !hash.includes("access_token")) return;
    if (pathname === "/account" || pathname.startsWith("/auth/confirm") || pathname.startsWith("/auth/callback")) return;

    const target = `/account${hash}`;
    window.location.replace(target);
  }, []);

  return null;
}
