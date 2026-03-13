"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CheckoutSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      const payload = { plan: "checkout", startedAt: Date.now() };
      window.localStorage.setItem("df_pending_checkout", JSON.stringify(payload));
    } catch {
      // ignore storage failures
    }
    router.replace("/account");
  }, [router]);

  return null;
}
