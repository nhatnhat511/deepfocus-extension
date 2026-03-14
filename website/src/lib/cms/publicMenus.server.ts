import "server-only";

import {
  defaultFooterMenu,
  defaultHeaderMenu,
  sanitizeMenu,
  type PublicMenuItem,
} from "@/lib/cms/publicMenus";

type MenuRow = {
  items: PublicMenuItem[] | null;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr";

async function getPublicMenu(location: string, fallback: PublicMenuItem[]) {
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/cms_menus?select=items&location=eq.${encodeURIComponent(location)}&limit=1`,
    {
      headers: {
        apikey: SUPABASE_ANON_KEY,
        authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
      next: { revalidate: 5 },
    }
  );

  if (!response.ok) {
    return fallback;
  }

  const data = (await response.json()) as MenuRow[];
  return sanitizeMenu(data[0]?.items, fallback);
}

export async function getPublicMenus() {
  const [headerMenu, footerMenu] = await Promise.all([
    getPublicMenu("header", defaultHeaderMenu),
    getPublicMenu("footer", defaultFooterMenu),
  ]);

  return { headerMenu, footerMenu };
}
