-- DeepFocus CMS Admin schema
-- Run after trial_workflow.sql

begin;

create table if not exists public.cms_admins (
  user_id uuid primary key,
  email text,
  role text not null default 'admin',
  created_at timestamptz not null default now()
);

create or replace function public.is_cms_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.cms_admins
    where user_id = auth.uid()
  );
$$;

create table if not exists public.cms_pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text,
  status text not null default 'draft',
  seo_title text,
  seo_description text,
  og_image_url text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  excerpt text,
  content text,
  status text not null default 'draft',
  tags text[],
  categories text[],
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_home_sections (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  title text,
  subtitle text,
  cta_label text,
  cta_href text,
  image_url text,
  is_enabled boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_menus (
  id uuid primary key default gen_random_uuid(),
  location text not null unique,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_faq (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_changelog (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  release_date date,
  items jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_roadmap (
  id uuid primary key default gen_random_uuid(),
  stage text not null,
  points jsonb not null default '[]'::jsonb,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cms_site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.cms_admins enable row level security;
alter table public.cms_pages enable row level security;
alter table public.cms_posts enable row level security;
alter table public.cms_home_sections enable row level security;
alter table public.cms_menus enable row level security;
alter table public.cms_faq enable row level security;
alter table public.cms_changelog enable row level security;
alter table public.cms_roadmap enable row level security;
alter table public.cms_site_settings enable row level security;

create policy "cms_admins_select" on public.cms_admins
  for select using (public.is_cms_admin());
create policy "cms_admins_insert" on public.cms_admins
  for insert with check (public.is_cms_admin());
create policy "cms_admins_update" on public.cms_admins
  for update using (public.is_cms_admin());
create policy "cms_admins_delete" on public.cms_admins
  for delete using (public.is_cms_admin());

create policy "cms_pages_select" on public.cms_pages
  for select using (public.is_cms_admin());
create policy "cms_pages_insert" on public.cms_pages
  for insert with check (public.is_cms_admin());
create policy "cms_pages_update" on public.cms_pages
  for update using (public.is_cms_admin());
create policy "cms_pages_delete" on public.cms_pages
  for delete using (public.is_cms_admin());

create policy "cms_posts_select" on public.cms_posts
  for select using (public.is_cms_admin());
create policy "cms_posts_insert" on public.cms_posts
  for insert with check (public.is_cms_admin());
create policy "cms_posts_update" on public.cms_posts
  for update using (public.is_cms_admin());
create policy "cms_posts_delete" on public.cms_posts
  for delete using (public.is_cms_admin());

create policy "cms_home_sections_select" on public.cms_home_sections
  for select using (public.is_cms_admin());
create policy "cms_home_sections_insert" on public.cms_home_sections
  for insert with check (public.is_cms_admin());
create policy "cms_home_sections_update" on public.cms_home_sections
  for update using (public.is_cms_admin());
create policy "cms_home_sections_delete" on public.cms_home_sections
  for delete using (public.is_cms_admin());

create policy "cms_menus_select" on public.cms_menus
  for select using (public.is_cms_admin());
create policy "cms_menus_insert" on public.cms_menus
  for insert with check (public.is_cms_admin());
create policy "cms_menus_update" on public.cms_menus
  for update using (public.is_cms_admin());
create policy "cms_menus_delete" on public.cms_menus
  for delete using (public.is_cms_admin());

create policy "cms_faq_select" on public.cms_faq
  for select using (public.is_cms_admin());
create policy "cms_faq_insert" on public.cms_faq
  for insert with check (public.is_cms_admin());
create policy "cms_faq_update" on public.cms_faq
  for update using (public.is_cms_admin());
create policy "cms_faq_delete" on public.cms_faq
  for delete using (public.is_cms_admin());

create policy "cms_changelog_select" on public.cms_changelog
  for select using (public.is_cms_admin());
create policy "cms_changelog_insert" on public.cms_changelog
  for insert with check (public.is_cms_admin());
create policy "cms_changelog_update" on public.cms_changelog
  for update using (public.is_cms_admin());
create policy "cms_changelog_delete" on public.cms_changelog
  for delete using (public.is_cms_admin());

create policy "cms_roadmap_select" on public.cms_roadmap
  for select using (public.is_cms_admin());
create policy "cms_roadmap_insert" on public.cms_roadmap
  for insert with check (public.is_cms_admin());
create policy "cms_roadmap_update" on public.cms_roadmap
  for update using (public.is_cms_admin());
create policy "cms_roadmap_delete" on public.cms_roadmap
  for delete using (public.is_cms_admin());

create policy "cms_site_settings_select" on public.cms_site_settings
  for select using (public.is_cms_admin());
create policy "cms_site_settings_insert" on public.cms_site_settings
  for insert with check (public.is_cms_admin());
create policy "cms_site_settings_update" on public.cms_site_settings
  for update using (public.is_cms_admin());
create policy "cms_site_settings_delete" on public.cms_site_settings
  for delete using (public.is_cms_admin());

commit;
