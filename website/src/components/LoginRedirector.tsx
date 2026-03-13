"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export default function LoginRedirector() {
  const router = useRouter();
  const supabaseRef = useRef(createSupabaseBrowserClient());

  useEffect(() => {
    let isActive = true;
    const supabase = supabaseRef.current;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isActive || !data.session) return;
      const { error } = await supabase.auth.getUser();
      if (error) {
        await supabase.auth.signOut({ scope: "local" });
        return;
      }
      if (isActive) {
        router.replace("/account");
      }
    });

    return () => {
      isActive = false;
    };
  }, [router]);

  return null;
}
