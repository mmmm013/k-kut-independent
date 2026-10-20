-- ─────────────────────────────────────────────────────────────────────────────
-- Meants — catalog tables (DRAFT, NOT DEPLOYED)
--
-- Where every Meant and every Element Type is cataloged, mirroring
-- lib/kf/meants/. Kept under reference/NOT-DEPLOYED on purpose: nothing here
-- may be applied while the BLK/KK text-generation freeze is ACTIVE, and this
-- Supabase project is a publication mirror of GPMC, not an authority
-- (GOVERNANCE.md §1). Apply only on the owner's explicit go-ahead.
--
-- Additive and standalone: new tables only, no changes to anything existing,
-- no seed of Meant rows. The only rows inserted are the seven Element Types.
-- Depends on public.kf_is_forbidden_source_url() from
-- reference/NOT-DEPLOYED/kf-schema/20260921000100_kut_family_schema.sql.
--
--   meant_types             one row per Element Type, DKK and naked sK included
--   meants                  one row per Meant working copy, of any type
--   meant_tiers             HUG, TUG, BUG per Meant (all three required by
--                           validateMeant(); a table CHECK cannot count rows)
--   meant_tier_strategies   KKr strategies per tier, 1-word up to Song Section
--   meant_text_loops        Text Loop runs each Meant has been through
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Element Types ────────────────────────────────────────────────────────────
create table if not exists public.meant_types (
  code          text primary key
                  check (code in ('KK', 'DKK', 'NKK', 'NAKED_SK', 'SK', 'MK', 'KUPID')),
  kkr_code      text not null unique check (kkr_code = 'KKr-' || code),
  name          text not null,
  -- Lineage parent under the capture-room LOCK. Null = unresolved (K-kUpId).
  parent_code   text check (parent_code is null or parent_code = 'LT-PIX'
                            or parent_code in ('KK', 'DKK', 'NKK', 'NAKED_SK', 'SK', 'MK', 'KUPID')),
  -- Source asset table, or null when no schema exists (DKK, naked sK).
  source_table  text,
  clone_status  text not null
                  check (clone_status in ('CLONED', 'CLONED_IDENTITY_ONLY', 'CLONED_PARENT_UNRESOLVED')),
  granularities text[] not null
                  check (granularities <@ array['WORD', 'TERM', 'PHRASE', 'LINE', 'LINE_SET', 'SONG_SECTION']
                         and cardinality(granularities) > 0)
);

insert into public.meant_types (code, kkr_code, name, parent_code, source_table, clone_status, granularities) values
  ('KK',       'KKr-KK',       'K-KUT',      'LT-PIX',   'k_kut_assets', 'CLONED',                   array['SONG_SECTION']),
  ('DKK',      'KKr-DKK',      'DKK',        'KK',       null,           'CLONED_IDENTITY_ONLY',     array['SONG_SECTION']),
  ('NKK',      'KKr-NKK',      'NKK',        'DKK',      'nkk_assets',   'CLONED',                   array['SONG_SECTION', 'LINE_SET', 'LINE']),
  ('NAKED_SK', 'KKr-NAKED_SK', 'naked sK',   'NKK',      null,           'CLONED_IDENTITY_ONLY',     array['LINE_SET', 'LINE', 'PHRASE', 'TERM', 'WORD']),
  ('SK',       'KKr-SK',       'short-KUT',  'NKK',      'sk_assets',    'CLONED',                   array['LINE_SET', 'LINE', 'PHRASE', 'TERM', 'WORD']),
  ('MK',       'KKr-MK',       'mini-KUT',   'NAKED_SK', 'm_kut_assets', 'CLONED',                   array['LINE', 'PHRASE', 'TERM', 'WORD']),
  ('KUPID',    'KKr-KUPID',    'K-kUpId',    null,       'kupid_assets', 'CLONED_PARENT_UNRESOLVED', array['SONG_SECTION', 'LINE_SET', 'LINE'])
on conflict (code) do nothing;

comment on table public.meant_types is
  'Every GPM Element Type as a KKr working-copy type. Mirrors MEANT_TYPES in lib/kf/meants/catalog.ts.';

-- ── Meants ───────────────────────────────────────────────────────────────────
create table if not exists public.meants (
  meant_id            text primary key,
  type_code           text not null references public.meant_types(code),
  subtype             text,
  -- A KKr working copy never carries approval.
  authority           text not null default 'KKR_WORKING_COPY'
                        check (authority = 'KKR_WORKING_COPY'),

  -- SSOT origin: by object id and SHA-256, never by title.
  ssot_clone_id       text not null,
  ssot_clone_sha256   text not null check (ssot_clone_sha256 ~ '^[0-9a-f]{64}$'),
  lt_pix_id           text not null,
  authority_src_id    text not null,
  parent_id           text,
  parent_sha256       text not null check (parent_sha256 ~ '^[0-9a-f]{64}$'),
  matched_by          text not null default 'object_id_and_sha256'
                        check (matched_by = 'object_id_and_sha256'),

  -- Full audio: vocals and instrumentals both, always. Never the master.
  has_vocals          boolean not null check (has_vocals),
  has_instrumentals   boolean not null check (has_instrumentals),
  variant             text not null default 'VOCAL_MUSIC' check (variant = 'VOCAL_MUSIC'),
  audio_url           text check (audio_url is null or not public.kf_is_forbidden_source_url(audio_url)),

  -- TPs: InTP is the original boundary, VTP the verified one inside it.
  intp_start_seconds  numeric not null,
  intp_end_seconds    numeric not null,
  vtp_start_seconds   numeric,
  vtp_end_seconds     numeric,
  -- The parent's bounds. A Meant may never escape them.
  parent_start_seconds numeric,
  parent_end_seconds   numeric,

  humanizing          text not null default 'RAW'
                        check (humanizing in ('RAW', 'LOOPING', 'HUMANIZED')),
  created_at          timestamptz not null default now(),

  constraint meants_intp_ordered
    check (intp_start_seconds >= 0 and intp_end_seconds > intp_start_seconds),
  constraint meants_vtp_ordered_and_inside_intp
    check ((vtp_start_seconds is null and vtp_end_seconds is null)
           or (vtp_start_seconds is not null and vtp_end_seconds is not null
               and vtp_end_seconds > vtp_start_seconds
               and vtp_start_seconds >= intp_start_seconds
               and vtp_end_seconds <= intp_end_seconds)),
  constraint meants_inside_parent_bounds
    check ((parent_start_seconds is null and parent_end_seconds is null)
           or (parent_start_seconds is not null and parent_end_seconds is not null
               and intp_start_seconds >= parent_start_seconds
               and intp_end_seconds <= parent_end_seconds))
);

create index if not exists meants_type_idx   on public.meants (type_code);
create index if not exists meants_ltpix_idx  on public.meants (lt_pix_id);
create index if not exists meants_ssot_idx   on public.meants (ssot_clone_id, ssot_clone_sha256);

comment on table public.meants is
  'One row per Meant working copy, any Element Type. Mirrors MeantClone in lib/kf/meants/meant.ts.';

-- ── Text Loops ───────────────────────────────────────────────────────────────
create table if not exists public.meant_text_loops (
  meant_id          text not null references public.meants(meant_id) on delete cascade,
  text_loop_run_id  text not null,
  seq               integer not null check (seq >= 1),
  ran_at            timestamptz not null default now(),
  primary key (meant_id, text_loop_run_id),
  unique (meant_id, seq)
);

-- HUMANIZED needs at least 2 Text Loop runs (MIN_TEXT_LOOPS). Cross-table, so a trigger.
create or replace function public.meants_assert_text_loops()
returns trigger
language plpgsql
as $$
begin
  if new.humanizing = 'HUMANIZED'
     and (select count(*) from public.meant_text_loops l where l.meant_id = new.meant_id) < 2 then
    raise exception 'Meant % is HUMANIZED with fewer than 2 Text Loop runs', new.meant_id
      using errcode = 'check_violation';
  end if;
  return new;
end
$$;

drop trigger if exists meants_text_loops_gate on public.meants;
create trigger meants_text_loops_gate
  before insert or update of humanizing on public.meants
  for each row execute function public.meants_assert_text_loops();

-- ── Product Tiers ────────────────────────────────────────────────────────────
create table if not exists public.meant_tiers (
  meant_id   text not null references public.meants(meant_id) on delete cascade,
  tier       text not null check (tier in ('HUG', 'TUG', 'BUG')),
  rank       smallint not null,
  -- Three separate fields: sentiment, emotion and scenario stay independently inspectable.
  themes     text[] not null default '{}',
  emotions   text[] not null default '{}',
  scenarios  text[] not null default '{}',
  -- BUGs arrive ON DEMAND ONLY.
  allowed_triggers text[] not null,
  primary key (meant_id, tier),

  constraint meant_tiers_rank
    check ((tier = 'HUG' and rank = 1) or (tier = 'TUG' and rank = 2) or (tier = 'BUG' and rank = 3)),
  -- BUGs never carry Themes, Emotions or Scenarios.
  constraint meant_tiers_bug_no_sentiment
    check (tier <> 'BUG' or (cardinality(themes) = 0 and cardinality(emotions) = 0 and cardinality(scenarios) = 0)),
  -- HUGs and TUGs work with Themes, Emotions, Scenarios.
  constraint meant_tiers_hug_tug_sentiment
    check (tier = 'BUG' or cardinality(themes) + cardinality(emotions) + cardinality(scenarios) > 0),
  constraint meant_tiers_triggers
    check (allowed_triggers <@ array['user_request', 'platform_suggestion', 'follow_up', 'scheduled']
           and (tier <> 'BUG' or allowed_triggers = array['user_request']))
);

comment on table public.meant_tiers is
  'Exactly three tiers per Meant: HUG, TUG, BUG. Mirrors TIER_RULES in lib/kf/meants/meant.ts.';

create table if not exists public.meant_tier_strategies (
  id           uuid primary key default gen_random_uuid(),
  meant_id     text not null,
  tier         text not null,
  granularity  text not null
                 check (granularity in ('WORD', 'TERM', 'PHRASE', 'LINE', 'LINE_SET', 'SONG_SECTION')),
  strategy     text not null check (btrim(strategy) <> ''),
  created_at   timestamptz not null default now(),
  foreign key (meant_id, tier) references public.meant_tiers(meant_id, tier) on delete cascade
);

create index if not exists meant_tier_strategies_idx on public.meant_tier_strategies (meant_id, tier);

-- ── RLS: server-only, like first_free_signups. No client policy. ─────────────
alter table public.meant_types            enable row level security;
alter table public.meants                 enable row level security;
alter table public.meant_text_loops       enable row level security;
alter table public.meant_tiers            enable row level security;
alter table public.meant_tier_strategies  enable row level security;
