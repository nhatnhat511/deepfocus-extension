import "server-only";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://jpgywjxztjkayynptjrs.supabase.co";
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_0mWntV8P8rGhGhdW5KtR6g_KOXXtHYr";

type HomeSection = {
  id: string;
  key: string;
  title: string | null;
  subtitle: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_url: string | null;
  is_enabled: boolean | null;
  sort_order: number | null;
};

type FaqEntry = {
  id: string;
  question: string;
  answer: string;
  sort_order: number | null;
  is_published: boolean | null;
};

type ChangelogEntry = {
  id: string;
  title: string;
  release_date: string | null;
  items: string[];
  sort_order: number | null;
  is_published: boolean | null;
};

type RoadmapEntry = {
  id: string;
  stage: string;
  points: string[];
  sort_order: number | null;
  is_published: boolean | null;
};

type SiteSettingEntry = {
  key: string;
  value: unknown;
};

type PublicPost = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  status: string;
  categories: string[] | null;
  published_at: string | null;
  updated_at: string | null;
};

async function fetchCmsRows<T>(path: string) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    next: { revalidate: 5 },
  });

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as T[];
}

export async function getPublicHomeSections() {
  return (await fetchCmsRows<HomeSection>(
    "cms_home_sections?select=*&is_enabled=eq.true&order=sort_order.asc"
  )) ?? [];
}

export async function getPublicFaq() {
  return (await fetchCmsRows<FaqEntry>("cms_faq?select=*&is_published=eq.true&order=sort_order.asc")) ?? [];
}

export async function getPublicChangelog() {
  return (
    (await fetchCmsRows<ChangelogEntry>(
      "cms_changelog?select=*&is_published=eq.true&order=sort_order.asc,release_date.desc"
    )) ?? []
  );
}

export async function getPublicRoadmap() {
  return (await fetchCmsRows<RoadmapEntry>("cms_roadmap?select=*&is_published=eq.true&order=sort_order.asc")) ?? [];
}

export async function getPublicPosts() {
  return (
    (await fetchCmsRows<PublicPost>(
      "cms_posts?select=*&status=eq.published&order=published_at.desc,updated_at.desc"
    )) ?? []
  );
}

export async function getPublicPostBySlug(slug: string) {
  const rows =
    (await fetchCmsRows<PublicPost>(
      `cms_posts?select=*&status=eq.published&slug=eq.${encodeURIComponent(slug)}&limit=1`
    )) ?? [];
  return rows[0] ?? null;
}

export async function getPublicPostByCategorySlug(categorySlug: string, slug: string) {
  const rows =
    (await fetchCmsRows<PublicPost>(
      `cms_posts?select=*&status=eq.published&slug=eq.${encodeURIComponent(slug)}&categories=cs.{${encodeURIComponent(
        categorySlug
      )}}&limit=1`
    )) ?? [];
  return rows[0] ?? null;
}

export async function getPublicSiteSetting(settingKey: string) {
  const rows =
    (await fetchCmsRows<SiteSettingEntry>(
      `cms_site_settings?select=key,value&key=eq.${encodeURIComponent(settingKey)}`
    )) ?? [];
  const entry = rows[0];
  if (!entry || entry.value == null) return "";

  if (typeof entry.value === "string") {
    return entry.value;
  }

  if (typeof entry.value === "object" && "allowlist" in (entry.value as Record<string, unknown>)) {
    const allowlist = (entry.value as { allowlist?: string }).allowlist;
    return allowlist ?? "";
  }

  return "";
}
