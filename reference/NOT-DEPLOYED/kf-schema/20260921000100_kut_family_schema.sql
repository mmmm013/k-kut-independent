-- ─────────────────────────────────────────────────────────────────────────────
-- KUT Family (KF) — core schema
--
-- One table per unit type in the KUT Family, all hanging off a PIX (master
-- track). Every table carries the same three gate columns so the silo rule is
-- expressible identically everywhere:
--
--   audio_qc_status   'pass' before anything leaves the silo
--   *_audio_url       an approved delivery render, never PIX/source audio
--   approved_for_hug  explicit sign-off for HUG delivery
--
-- Backward-compatible by design: everything is CREATE ... IF NOT EXISTS and
-- ADD COLUMN IF NOT EXISTS, so this can be applied ahead of the deploy that
-- needs it (see README → Database migrations).
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ── Source-audio guard ───────────────────────────────────────────────────────
-- Mirrors isForbiddenSourceUrl() in lib/kf/classify.ts. A delivery unit may
-- never point at PIX, source or full-track audio. Kept IMMUTABLE so it can back
-- CHECK constraints; strpos is used rather than LIKE so the needles stay literal.
create or replace function public.kf_is_forbidden_source_url(url text)
returns boolean
language sql
immutable
as $$
  select case
    when url is null or btrim(url) = '' then true
    else (
      strpos(lower(url), '/tracks/')                > 0 or
      strpos(lower(url), 'pix')                     > 0 or
      strpos(lower(url), 'gpmc')                    > 0 or
      strpos(lower(url), 'source')                  > 0 or
      strpos(lower(url), 'flagship')                > 0 or
      strpos(lower(url), 'full')                    > 0 or
      strpos(lower(url), 'a%20love%20like%20that')  > 0 or
      strpos(lower(url), 'a love like that')        > 0
    )
  end;
$$;

comment on function public.kf_is_forbidden_source_url(text) is
  'True when a URL looks like PIX/source/full-track audio. Delivery units must never use one.';

-- ── PIX (master track) ───────────────────────────────────────────────────────
create table if not exists public.pix_pck (
  id          text primary key,
  title       text,
  artist      text,
  created_at  timestamptz not null default now()
);

comment on table public.pix_pck is 'PIX — a master track. Every KUT Family unit is cut from one.';

-- ── K-KUT: exact contiguous section audio ────────────────────────────────────
create table if not exists public.k_kut_assets (
  id               uuid primary key default gen_random_uuid(),
  pix_pck_id       text not null references public.pix_pck(id) on delete cascade,
  -- One or more contiguous sections in canonical order, e.g. 'Ch1' or 'V1 → Pre1'.
  structure_tag    text not null,
  variant          text not null default 'VOCAL_MUSIC'
                     check (variant in ('VOCAL_MUSIC', 'MUSIC_ONLY')),
  storage_path     text,
  kut_audio_url    text,
  audio_qc_status  text not null default 'pending'
                     check (audio_qc_status in ('pass', 'fail', 'pending')),
  duration_ms      integer check (duration_ms is null or duration_ms > 0),
  approved_for_hug boolean not null default false,
  slug             text unique,
  public_label     text,
  keenness_score   smallint check (keenness_score is null or keenness_score between 0 and 100),
  emotion_level    text,
  created_at       timestamptz not null default now(),

  constraint k_kut_assets_unique_cut unique (pix_pck_id, structure_tag, variant),
  constraint k_kut_assets_audio_not_source
    check (kut_audio_url is null or not public.kf_is_forbidden_source_url(kut_audio_url)),
  -- Nothing is HUG-approved until audio QC has passed.
  constraint k_kut_assets_hug_requires_qc
    check (approved_for_hug = false or audio_qc_status = 'pass')
);

create index if not exists k_kut_assets_pix_idx on public.k_kut_assets (pix_pck_id);
create index if not exists k_kut_assets_qc_idx  on public.k_kut_assets (audio_qc_status);

-- ── K-KUT redemption codes ───────────────────────────────────────────────────
create table if not exists public.k_kut_codes (
  id              uuid primary key default gen_random_uuid(),
  k_kut_asset_id  uuid not null references public.k_kut_assets(id) on delete cascade,
  item_type       text not null check (item_type in ('STI', 'BTI', 'FP')),
  status          text not null default 'inactive'
                    check (status in ('active', 'inactive', 'redeemed')),
  redeemed_at     timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists k_kut_codes_asset_idx  on public.k_kut_codes (k_kut_asset_id);
create index if not exists k_kut_codes_status_idx on public.k_kut_codes (status);

-- Only one live code per asset, so /pix/[id] never has to choose between two.
create unique index if not exists k_kut_codes_one_active_per_asset
  on public.k_kut_codes (k_kut_asset_id)
  where status = 'active';

-- ── mini-KUT: text micro-assets (audio resolved from the parent K-KUT) ───────
create table if not exists public.m_kut_assets (
  id               uuid primary key default gen_random_uuid(),
  pix_pck_id       text not null references public.pix_pck(id) on delete cascade,
  k_kut_asset_id   uuid references public.k_kut_assets(id) on delete set null,
  mk_type          text not null check (mk_type in (
                     'mK-verb', 'mK-noun', 'mK-adj', 'mK-adv',
                     'mK-pron', 'mK-cmpnd', 'mK-phrase', 'mK-hook')),
  content          text,
  structure_tag    text,
  mk_audio_url     text,
  audio_qc_status  text not null default 'pending'
                     check (audio_qc_status in ('pass', 'fail', 'pending')),
  approved_for_hug boolean not null default false,
  slug             text unique,
  public_label     text,
  keenness_score   smallint check (keenness_score is null or keenness_score between 0 and 100),
  emotion_level    text,
  created_at       timestamptz not null default now(),

  constraint m_kut_assets_audio_not_source
    check (mk_audio_url is null or not public.kf_is_forbidden_source_url(mk_audio_url)),
  constraint m_kut_assets_hug_requires_qc
    check (approved_for_hug = false or audio_qc_status = 'pass')
);

create index if not exists m_kut_assets_pix_idx  on public.m_kut_assets (pix_pck_id);
create index if not exists m_kut_assets_kut_idx  on public.m_kut_assets (k_kut_asset_id);

-- ── LineFeel (LLF): a single lyric line delivered as audio ───────────────────
create table if not exists public.llf_assets (
  id               uuid primary key default gen_random_uuid(),
  pix_pck_id       text not null references public.pix_pck(id) on delete cascade,
  k_kut_asset_id   uuid references public.k_kut_assets(id) on delete set null,
  structure_tag    text,
  variant          text check (variant is null or variant in ('VOCAL_MUSIC', 'MUSIC_ONLY')),
  line_text        text,
  llf_audio_url    text,
  audio_qc_status  text not null default 'pending'
                     check (audio_qc_status in ('pass', 'fail', 'pending')),
  duration_ms      integer check (duration_ms is null or duration_ms > 0),
  approved_for_hug boolean not null default false,
  slug             text unique,
  public_label     text,
  keenness_score   smallint check (keenness_score is null or keenness_score between 0 and 100),
  emotion_level    text,
  created_at       timestamptz not null default now(),

  constraint llf_assets_audio_not_source
    check (llf_audio_url is null or not public.kf_is_forbidden_source_url(llf_audio_url)),
  constraint llf_assets_hug_requires_qc
    check (approved_for_hug = false or audio_qc_status = 'pass')
);

-- Guarded: migration 600 turns llf_assets into a VIEW over sk_assets, and a
-- view takes neither indexes, RLS, nor new columns. Skipped once that has run.
do $$
begin
  if (select table_type from information_schema.tables
      where table_schema = 'public' and table_name = 'llf_assets') = 'BASE TABLE' then
    execute $stmt$create index if not exists llf_assets_pix_idx on public.llf_assets (pix_pck_id)$stmt$;
  end if;
end
$$;


-- ── K-kUpId: a K-KUT curated and signed for a romance level ──────────────────
create table if not exists public.kupid_assets (
  id               uuid primary key default gen_random_uuid(),
  pix_pck_id       text not null references public.pix_pck(id) on delete cascade,
  k_kut_asset_id   uuid references public.k_kut_assets(id) on delete set null,
  structure_tag    text,
  variant          text check (variant is null or variant in ('VOCAL_MUSIC', 'MUSIC_ONLY')),
  romance_level    smallint not null check (romance_level between 1 and 5),
  level_code       text not null check (level_code in ('INT', 'DAT', 'LUV', 'SEX', 'FVR')),
  gift_note        text,
  gifted_by        text,
  signature        text,
  kupid_audio_url  text,
  audio_qc_status  text not null default 'pending'
                     check (audio_qc_status in ('pass', 'fail', 'pending')),
  duration_ms      integer check (duration_ms is null or duration_ms > 0),
  approved_for_hug boolean not null default false,
  slug             text unique,
  public_label     text,
  keenness_score   smallint check (keenness_score is null or keenness_score between 0 and 100),
  emotion_level    text,
  created_at       timestamptz not null default now(),

  -- Level and code are two spellings of the same thing; they may not disagree.
  constraint kupid_assets_level_matches_code check (
    (romance_level = 1 and level_code = 'INT') or
    (romance_level = 2 and level_code = 'DAT') or
    (romance_level = 3 and level_code = 'LUV') or
    (romance_level = 4 and level_code = 'SEX') or
    (romance_level = 5 and level_code = 'FVR')
  ),
  constraint kupid_assets_audio_not_source
    check (kupid_audio_url is null or not public.kf_is_forbidden_source_url(kupid_audio_url)),
  constraint kupid_assets_hug_requires_qc
    check (approved_for_hug = false or audio_qc_status = 'pass')
);

create index if not exists kupid_assets_pix_idx   on public.kupid_assets (pix_pck_id);
create index if not exists kupid_assets_level_idx on public.kupid_assets (romance_level);
