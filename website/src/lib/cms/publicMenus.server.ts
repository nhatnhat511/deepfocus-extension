import "server-only";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  defaultFooterMenu,
  defaultHeaderMenu,
  sanitizeMenu,
  type PublicMenuItem,
} from "@/lib/cms/publicMenus";

type MenuRow = {
  items: PublicMenuItem[] | null;
};

async function getPublicMenu(location: string, fallback: PublicMenuItem[]) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.from("cms_menus").select("items").eq("location", location).maybeSingle();

  if (error) {
    return fallback;
  }

  return sanitizeMenu((data as MenuRow | null)?.items, fallback);
}

export async function getPublicMenus() {
  const [headerMenu, footerMenu] = await Promise.all([
    getPublicMenu("header", defaultHeaderMenu),
    getPublicMenu("footer", defaultFooterMenu),
  ]);

  return { headerMenu, footerMenu };
}
