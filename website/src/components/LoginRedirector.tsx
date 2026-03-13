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

      const params = new URLSearchParams(window.location.search);
      const extRedirect = params.get("ext_redirect");
      if (extRedirect && /^https:\/\/[a-z0-9]{32}\.chromiumapp\.org(\/.*)?$/i.test(extRedirect)) {
        const session = data.session;
        const hash = new URLSearchParams({
          access_token: session.access_token,
          refresh_token: session.refresh_token,
          token_type: session.token_type || "bearer",
          expires_in: String(session.expires_in || 0),
          expires_at: String(session.expires_at || 0)
        });
        window.location.replace(`${extRedirect}#${hash.toString()}`);
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
