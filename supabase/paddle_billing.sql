-- DeepFocus Time Paddle billing support
-- Run after trial_workflow.sql

begin;

alter table if exists public.profiles
  add column if not exists paddle_customer_id text;

alter table if exists public.profiles
  add column if not exists paddle_subscription_id text;

alter table if exists public.profiles
  add column if not exists paddle_status text;

create table if not exists public.paddle_webhook_events (
  event_id text primary key,
  event_type text not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

create or replace function public.apply_paddle_billing_by_email(
  p_email text,
  p_plan text,
  p_premium_until timestamptz,
  p_paddle_subscription_id text,
  p_paddle_customer_id text,
  p_paddle_status text
)
returns table (success boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
  uid uuid;
begin
  normalized_email := lower(trim(coalesce(p_email, '')));
  if normalized_email = '' then
    return query select false;
    return;
  end if;

  select u.id into uid
  from auth.users u
  where lower(u.email) = normalized_email
  order by u.created_at desc
  limit 1;

  if uid is null then
    return query select false;
    return;
  end if;

  insert into public.profiles (
    id,
    email,
    plan,
    premium_until,
    trial_used,
    paddle_subscription_id,
    paddle_customer_id,
    paddle_status,
    updated_at
  )
  values (
    uid,
    normalized_email,
    coalesce(nullif(p_plan, ''), 'free'),
    p_premium_until,
    false,
    p_paddle_subscription_id,
    p_paddle_customer_id,
    p_paddle_status,
    now()
  )
  on conflict (id) do update
  set email = excluded.email,
      plan = excluded.plan,
      premium_until = excluded.premium_until,
      paddle_subscription_id = excluded.paddle_subscription_id,
      paddle_customer_id = excluded.paddle_customer_id,
      paddle_status = excluded.paddle_status,
      updated_at = now();

  return query select true;
end;
$$;

create or replace function public.apply_paddle_billing_by_user_id(
  p_user_id uuid,
  p_email text,
  p_plan text,
  p_premium_until timestamptz,
  p_paddle_subscription_id text,
  p_paddle_customer_id text,
  p_paddle_status text
)
returns table (success boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text;
begin
  if p_user_id is null then
    return query select false;
    return;
  end if;

  normalized_email := lower(trim(coalesce(p_email, '')));
  if normalized_email = '' then
    select lower(u.email) into normalized_email
    from auth.users u
    where u.id = p_user_id
    limit 1;
  end if;

  insert into public.profiles (
    id,
    email,
    plan,
    premium_until,
    trial_used,
    paddle_subscription_id,
    paddle_customer_id,
    paddle_status,
    updated_at
  )
  values (
    p_user_id,
    nullif(normalized_email, ''),
    coalesce(nullif(p_plan, ''), 'free'),
    p_premium_until,
    false,
    p_paddle_subscription_id,
    p_paddle_customer_id,
    p_paddle_status,
    now()
  )
  on conflict (id) do update
  set email = coalesce(excluded.email, public.profiles.email),
      plan = excluded.plan,
      premium_until = excluded.premium_until,
      paddle_subscription_id = excluded.paddle_subscription_id,
      paddle_customer_id = excluded.paddle_customer_id,
      paddle_status = excluded.paddle_status,
      updated_at = now();

  return query select true;
end;
$$;

revoke all on function public.apply_paddle_billing_by_email(text, text, timestamptz, text, text, text) from public;
grant execute on function public.apply_paddle_billing_by_email(text, text, timestamptz, text, text, text) to service_role;
revoke all on function public.apply_paddle_billing_by_user_id(uuid, text, text, timestamptz, text, text, text) from public;
grant execute on function public.apply_paddle_billing_by_user_id(uuid, text, text, timestamptz, text, text, text) to service_role;

create or replace function public.paddle_billing_health()
returns table (ok boolean, version text)
language sql
security definer
set search_path = public
as $$
  select true as ok, '2026-03-13'::text as version;
$$;

revoke all on function public.paddle_billing_health() from public;
grant execute on function public.paddle_billing_health() to service_role;

-- Ensure plan values stay aligned with current product plans.
update public.profiles
  set plan = 'premium_monthly'
  where plan = 'premium';

alter table public.profiles
  drop constraint if exists profiles_plan_check;

alter table public.profiles
  add constraint profiles_plan_check
  check (plan in ('free','trial','premium_monthly','premium_yearly'));

commit;
