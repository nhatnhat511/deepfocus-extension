-- DeepFocus Time trial + entitlement workflow
-- Run this in Supabase SQL Editor (production project).

begin;

alter table if exists public.profiles
  add column if not exists trial_started_at timestamptz;

alter table if exists public.profiles
  add column if not exists trial_used boolean;

update public.profiles
set trial_used = false
where trial_used is null;

alter table public.profiles
  alter column trial_used set default false;

alter table public.profiles
  alter column trial_used set not null;

alter table if exists public.profiles
  add column if not exists plan text;

update public.profiles
set plan = 'free'
where plan is null;

alter table public.profiles
  alter column plan set default 'free';

create or replace function public.ensure_profile_for_user()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  user_email text;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  select u.email into user_email
  from auth.users u
  where u.id = uid;

  insert into public.profiles (id, email, plan, trial_used, updated_at)
  values (uid, user_email, 'free', false, now())
  on conflict (id) do update
  set email = excluded.email,
      updated_at = now();
end;
$$;

create or replace function public.get_account_entitlement()
returns table (
  id uuid,
  email text,
  plan text,
  premium_until timestamptz,
  trial_used boolean,
  trial_started_at timestamptz,
  is_premium_active boolean,
  is_trial_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  perform public.ensure_profile_for_user();

  update public.profiles
  set plan = 'free',
      premium_until = null,
      updated_at = now()
  where id = uid
    and plan in ('trial', 'premium', 'premium_monthly', 'premium_yearly')
    and premium_until is not null
    and premium_until <= now();

  return query
  select
    p.id,
    p.email,
    coalesce(p.plan, 'free') as plan,
    p.premium_until,
    coalesce(p.trial_used, false) as trial_used,
    p.trial_started_at,
    (
      coalesce(p.plan, 'free') in ('trial', 'premium', 'premium_monthly', 'premium_yearly')
      and p.premium_until is not null
      and p.premium_until > now()
    ) as is_premium_active,
    (
      coalesce(p.plan, 'free') = 'trial'
      and p.premium_until is not null
      and p.premium_until > now()
    ) as is_trial_active
  from public.profiles p
  where p.id = uid
  limit 1;
end;
$$;

create or replace function public.start_free_trial()
returns table (
  id uuid,
  email text,
  plan text,
  premium_until timestamptz,
  trial_used boolean,
  trial_started_at timestamptz,
  is_premium_active boolean,
  is_trial_active boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
  p public.profiles%rowtype;
begin
  uid := auth.uid();
  if uid is null then
    raise exception 'UNAUTHENTICATED';
  end if;

  perform public.ensure_profile_for_user();

  select * into p
  from public.profiles
  where id = uid
  for update;

  if p.plan in ('trial', 'premium', 'premium_monthly', 'premium_yearly')
     and p.premium_until is not null
     and p.premium_until > now() then
    return query
    select
      p.id,
      p.email,
      p.plan,
      p.premium_until,
      coalesce(p.trial_used, false),
      p.trial_started_at,
      true,
      p.plan = 'trial';
    return;
  end if;

  if coalesce(p.trial_used, false) then
    raise exception 'TRIAL_ALREADY_USED';
  end if;

  update public.profiles
  set plan = 'trial',
      trial_used = true,
      trial_started_at = coalesce(trial_started_at, now()),
      premium_until = now() + interval '7 days',
      updated_at = now()
  where id = uid
  returning * into p;

  return query
  select
    p.id,
    p.email,
    p.plan,
    p.premium_until,
    coalesce(p.trial_used, false),
    p.trial_started_at,
    true,
    true;
end;
$$;

revoke all on function public.ensure_profile_for_user() from public;
grant execute on function public.get_account_entitlement() to authenticated;
grant execute on function public.start_free_trial() to authenticated;

commit;
