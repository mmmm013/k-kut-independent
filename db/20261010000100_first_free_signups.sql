-- First One Free follow-up list for the home-page funnel (app/page.tsx step 5).
--
-- Additive and standalone: one new table, no changes to anything existing.
-- This is a marketing contact list, not a KUT Family delivery object, so it
-- sits outside the GPMC authority chain described in GOVERNANCE.md.
--
-- Kept out of supabase/migrations on purpose (see reference/NOT-DEPLOYED/README.md):
-- apply it by hand, once, to project vwlzubxshjjonabpeagd.
--
-- Server-only: RLS on and no client policy. Writes come through
-- app/api/first-free with the service-role key.

create table if not exists public.first_free_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null check (email = lower(email) and length(email) <= 254),
  item_id text not null check (item_id ~ '^(mk|kkut)-[a-z0-9-]{1,60}$'),
  item_format text not null check (item_format in ('mk', 'kkut')),
  promised_return boolean not null check (promised_return),
  follow_ups_sent smallint not null default 0 check (follow_ups_sent between 0 and 3),
  last_follow_up_at timestamptz,
  created_at timestamptz not null default now(),
  unique (email, item_id)
);

alter table public.first_free_signups enable row level security;

comment on table public.first_free_signups is
  'First One Free promises from the K-KUT home page: the visitor gets one item free and agrees to up to 3 follow-ups across 3 weeks. Server-only: RLS enabled and no client policy granted. Writes come through app/api/first-free.';
