"use client";

import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

export type PublicMenuItem = {
  href: string;
  label: string;
};

type MenuRow = {
  items: PublicMenuItem[] | null;
};

export const defaultHeaderMenu: PublicMenuItem[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/account", label: "Account" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
  { href: "/support", label: "Support" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export const defaultFooterMenu: PublicMenuItem[] = [
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/blog", label: "Blog" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/refund", label: "Refund" },
  { href: "/support", label: "Support" },
  { href: "/changelog", label: "Changelog" },
  { href: "/roadmap", label: "Roadmap" },
  { href: "/contact", label: "Contact" },
];

function sanitizeMenu(items: PublicMenuItem[] | null | undefined, fallback: PublicMenuItem[]) {
  const cleaned = (items || []).filter((item) => item?.href?.trim() && item?.label?.trim());
  return cleaned.length ? cleaned : fallback;
}

export function usePublicMenu(location: string, fallback: PublicMenuItem[]) {
  const supabaseRef = useRef(createSupabaseBrowserClient());
  const [menu, setMenu] = useState<PublicMenuItem[]>(fallback);

  useEffect(() => {
    let mounted = true;

    async function loadMenu() {
      const supabase = supabaseRef.current;
      const { data, error } = await supabase.from("cms_menus").select("items").eq("location", location).maybeSingle();

      if (!mounted) return;

      if (error) {
        setMenu(fallback);
        return;
      }

      setMenu(sanitizeMenu((data as MenuRow | null)?.items, fallback));
    }

    void loadMenu();

    return () => {
      mounted = false;
    };
  }, [fallback, location]);

  return menu;
}
