"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const plan = params.get("plan") || "checkout";
      const payload = { plan, startedAt: Date.now() };
      window.localStorage.setItem("df_pending_checkout", JSON.stringify(payload));
    } catch {
      // ignore storage failures
    }
    router.replace("/account");
  }, [router]);

  return null;
}
