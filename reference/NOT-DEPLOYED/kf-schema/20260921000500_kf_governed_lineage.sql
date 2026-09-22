-- ─────────────────────────────────────────────────────────────────────────────
-- KUT Family — governed lineage, identity and minimums
--
-- Brings this database into line with the GPMC / GPMCC / Elevator Editor
-- control model. Three corrections, all of them load-bearing:
--
-- 1. LINEAGE. The governed chain is
--        LT-PIX -> KK -> NKK -> N-sK -> N-mK
--    and "no direct KK-to-sK or KK/NKK-to-mK shortcut is authoritative."
--    Migrations 100-400 pointed m_kut_assets, llf_assets and kupid_assets
--    straight at k_kut_assets, which is precisely that forbidden shortcut.
--    This adds the missing NKK layer and re-parents the children onto it.
--
-- 2. IDENTITY. Objects resolve "by object ID and SHA-256, never by title."
--    Nothing here carried an LT-PIX id, an authority SRC id or a parent audio
--    SHA-256, so nothing stored could be lineage-verified at all.
--
-- 3. AUTHORITY. This database is NOT the source of truth. GPMC is the
--    canonical write authority for every LT-PIX object; GPMCC is its
--    hash-verified clone; every create/edit/approve/hold/reject routes through
--    EE to GPMC and replicates to GPMCC. Everything here is a downstream
--    PUBLICATION MIRROR of decisions frozen upstream. Nothing in this schema
--    may originate a delivery object.
--
-- Additive and idempotent. Columns are nullable so existing rows stay valid;
-- an unverified row reads as unverified rather than being assumed good.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Lineage identity, on every object ────────────────────────────────────────
-- lt_pix_id       the governing LT-PIX (master) this object descends from
-- authority_src_id the authority SRC id carried from GPMC
-- source_audio_sha256  SHA-256 of the PARENT audio, the identity anchor

do $$
declare
  target text;
begin
  foreach target in array array[
    'k_kut_assets', 'm_kut_assets', 'llf_assets', 'kupid_assets'
  ]
  loop
    -- Skip llf_assets once migration 600 has turned it into a view.
    continue when (select table_type from information_schema.tables
                   where table_schema = 'public' and table_name = target)
                  is distinct from 'BASE TABLE';
    execute format(
      'alter table public.%I
         add column if not exists lt_pix_id text,
         add column if not exists authority_src_id text,
         add column if not exists source_audio_sha256 text,
         add column if not exists source_audio_path text', target);

    -- A SHA that is present must be a real SHA-256. Mirrors the
    -- MISSING_OR_INVALID_PARENT_SHA256 check in freeze_lineage_failures().
    if not exists (
      select 1 from pg_constraint
      where conname = target || '_sha256_format'
    ) then
      execute format(
        'alter table public.%I add constraint %I
           check (source_audio_sha256 is null
                  or source_audio_sha256 ~ ''^[0-9a-f]{64}$'')',
        target, target || '_sha256_format');
    end if;
  end loop;
end
$$;

-- ── KK boundaries ────────────────────────────────────────────────────────────
-- A KK is a time range into its LT-PIX parent, not merely a rendered file.
-- Upstream carries start/end seconds; without them no child can be checked
-- for containment.
alter table public.k_kut_assets
  add column if not exists start_seconds numeric,
  add column if not exists end_seconds   numeric;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'k_kut_assets_bounds_ordered'
  ) then
    alter table public.k_kut_assets add constraint k_kut_assets_bounds_ordered
      check (
        (start_seconds is null and end_seconds is null)
        or (start_seconds >= 0 and end_seconds > start_seconds)
      );
  end if;
end
$$;

-- ── NKK — the missing layer between KK and its children ──────────────────────
create table if not exists public.nkk_assets (
  id                  uuid primary key default gen_random_uuid(),
  k_kut_asset_id      uuid not null references public.k_kut_assets(id) on delete cascade,
  pix_pck_id          text references public.pix_pck(id) on delete cascade,
  lt_pix_id           text,
  authority_src_id    text,
  source_audio_path   text,
  source_audio_sha256 text,
  structure_tag       text,
  variant             text check (variant is null or variant in ('VOCAL_MUSIC', 'MUSIC_ONLY')),
  theme               public.kf_theme,
  start_seconds       numeric,
  end_seconds         numeric,
  nkk_audio_url       text,
  audio_qc_status     text not null default 'pending'
                        check (audio_qc_status in ('pass', 'fail', 'pending')),
  duration_ms         integer check (duration_ms is null or duration_ms > 0),
  approved_for_hug    boolean not null default false,
  slug                text unique,
  public_label        text,
  keenness_score      smallint check (keenness_score is null or keenness_score between 0 and 100),
  emotion_level       text,
  created_at          timestamptz not null default now(),

  constraint nkk_assets_sha256_format
    check (source_audio_sha256 is null or source_audio_sha256 ~ '^[0-9a-f]{64}$'),
  constraint nkk_assets_bounds_ordered
    check (
      (start_seconds is null and end_seconds is null)
      or (start_seconds >= 0 and end_seconds > start_seconds)
    ),
  constraint nkk_assets_audio_not_source
    check (nkk_audio_url is null or not public.kf_is_forbidden_source_url(nkk_audio_url)),
  constraint nkk_assets_hug_requires_qc
    check (approved_for_hug = false or audio_qc_status = 'pass')
);

create index if not exists nkk_assets_kk_idx    on public.nkk_assets (k_kut_asset_id);
create index if not exists nkk_assets_pix_idx   on public.nkk_assets (pix_pck_id);
create index if not exists nkk_assets_theme_idx on public.nkk_assets (theme);

comment on table public.nkk_assets is
  'NKK — the governed layer between a KK and its sK/mK children. Required by the LT-PIX -> KK -> NKK -> N-sK -> N-mK chain.';

-- ── Re-parent the children onto NKK ──────────────────────────────────────────
-- k_kut_asset_id is kept for provenance but is no longer the authoritative
-- parent: a child must hang off an NKK.
alter table public.m_kut_assets add column if not exists nkk_asset_id uuid
  references public.nkk_assets(id) on delete cascade;
-- Guarded: migration 600 turns llf_assets into a VIEW over sk_assets, and a
-- view takes neither indexes, RLS, nor new columns. Skipped once that has run.
do $$
begin
  if (select table_type from information_schema.tables
      where table_schema = 'public' and table_name = 'llf_assets') = 'BASE TABLE' then
    execute $stmt$alter table public.llf_assets add column if not exists nkk_asset_id uuid references public.nkk_assets(id) on delete cascade$stmt$;
  end if;
end
$$;


create index if not exists m_kut_assets_nkk_idx on public.m_kut_assets (nkk_asset_id);
-- Guarded: migration 600 turns llf_assets into a VIEW over sk_assets, and a
-- view takes neither indexes, RLS, nor new columns. Skipped once that has run.
do $$
begin
  if (select table_type from information_schema.tables
      where table_schema = 'public' and table_name = 'llf_assets') = 'BASE TABLE' then
    execute $stmt$create index if not exists llf_assets_nkk_idx on public.llf_assets (nkk_asset_id)$stmt$;
  end if;
end
$$;


-- ── Containment: a child may never escape its parent's bounds ────────────────
-- Mirrors APPROVED_BOUNDARY_OUTSIDE_SOURCE_KK and the lineage rule
-- MK_MUST_RETAIN_LTPIX_SRC_KK_PATH_SHA_AND_MAY_NOT_ESCAPE_SOURCE_KK_BOUNDS.
-- A cross-table rule cannot be a CHECK, so it is a trigger.
create or replace function public.kf_assert_within_parent_kk()
returns trigger
language plpgsql
as $$
declare
  parent_start numeric;
  parent_end   numeric;
begin
  if new.start_seconds is null or new.end_seconds is null then
    return new;
  end if;

  select k.start_seconds, k.end_seconds
    into parent_start, parent_end
  from public.k_kut_assets k
  where k.id = new.k_kut_asset_id;

  if parent_start is null or parent_end is null then
    return new;
  end if;

  if new.start_seconds < parent_start or new.end_seconds > parent_end then
    raise exception
      'NKK % escapes its source KK bounds (% to %, parent % to %)',
      coalesce(new.id::text, 'new'),
      new.start_seconds, new.end_seconds, parent_start, parent_end
      using errcode = 'check_violation';
  end if;

  return new;
end
$$;

drop trigger if exists nkk_assets_within_parent on public.nkk_assets;
create trigger nkk_assets_within_parent
  before insert or update on public.nkk_assets
  for each row execute function public.kf_assert_within_parent_kk();

-- ── Minimums as data, not as a constant ──────────────────────────────────────
-- A hardcoded number would have to be redeployed to change; a table does not.
--
-- The 13-per-theme floor was issued and then withdrawn by GD. Only KK carries
-- a floor: 3 per theme, with typical yield 5-7 and any number of contiguous
-- KKs permitted. sK's floor was withdrawn outright. mK can never carry a
-- per-theme floor, because mKs do not work with Themes.
--
-- Holidays, Anniversary and Birthday are exempt from KUT minimums entirely.
-- They are simply absent from this table, and a theme with no row reports as
-- unmeasured -- never as satisfied.
create table if not exists public.kf_theme_minimums (
  theme      public.kf_theme not null,
  unit_type  text not null check (unit_type in ('KUT', 'NKK', 'sK', 'mK', 'LLF', 'KUPID')),
  minimum    integer not null check (minimum >= 0),
  updated_at timestamptz not null default now(),
  primary key (theme, unit_type)
);

comment on table public.kf_theme_minimums is
  'Required playable units per theme per container. Raise a row to raise the floor; no code change needed.';

insert into public.kf_theme_minimums (theme, unit_type, minimum)
select t.theme, 'KUT', 3
from unnest(enum_range(null::public.kf_theme)) as t(theme)
on conflict (theme, unit_type) do nothing;

-- ── Coverage, measured against the floor ─────────────────────────────────────
drop view if exists public.kf_theme_satisfaction;
drop view if exists public.kf_theme_coverage;

create view public.kf_theme_coverage
with (security_invoker = true)
as
  with playable as (
    select a.theme, 'KUT' as unit
    from public.k_kut_assets a
    join public.k_kut_codes c
      on c.k_kut_asset_id = a.id and c.status = 'active'
    where a.audio_qc_status = 'pass'
      and a.theme is not null
      and not public.kf_is_forbidden_source_url(a.kut_audio_url)

    union all

    select m.theme, 'mK'
    from public.m_kut_assets m
    where m.audio_qc_status = 'pass' and m.theme is not null

    union all

    -- LineFeel is a one-liner (1LNR), which is an sK: everything that is
    -- neither a KK nor an mK is an sK.
    select l.theme, 'sK'
    from public.llf_assets l
    where l.audio_qc_status = 'pass'
      and l.theme is not null
      and not public.kf_is_forbidden_source_url(l.llf_audio_url)
  )
  select
    m.theme,
    m.unit_type,
    count(p.unit)                                   as current,
    m.minimum                                       as required,
    greatest(m.minimum - count(p.unit), 0)          as shortfall,
    (count(p.unit) >= m.minimum)                    as met
  from public.kf_theme_minimums m
  left join playable p
    on p.theme = m.theme and p.unit = m.unit_type
  group by m.theme, m.unit_type, m.minimum
  order by m.theme, m.unit_type;

comment on view public.kf_theme_coverage is
  'Per theme and container: current playable units, the required floor, and the shortfall. Measured against kf_theme_minimums, never a hardcoded number.';

-- A theme is satisfied only when every container it has a floor for meets it.
create or replace view public.kf_theme_satisfaction
with (security_invoker = true)
as
  select
    theme,
    sum(current)                          as current_total,
    sum(required)                         as required_total,
    sum(shortfall)                        as shortfall_total,
    bool_and(met)                         as satisfied,
    string_agg(
      case when not met then unit_type || ' needs ' || shortfall end,
      ', ' order by unit_type
    )                                     as still_needed
  from public.kf_theme_coverage
  group by theme
  order by theme;

comment on view public.kf_theme_satisfaction is
  'One row per theme: satisfied only when every container with a floor meets it. still_needed is the work queue.';

grant select on public.kf_theme_coverage, public.kf_theme_satisfaction,
                public.kf_theme_minimums, public.nkk_assets
to anon, authenticated;

alter table public.nkk_assets        enable row level security;
alter table public.kf_theme_minimums enable row level security;

drop policy if exists "nkk_assets public read" on public.nkk_assets;
create policy "nkk_assets public read"
  on public.nkk_assets for select to anon, authenticated using (true);

drop policy if exists "kf_theme_minimums public read" on public.kf_theme_minimums;
create policy "kf_theme_minimums public read"
  on public.kf_theme_minimums for select to anon, authenticated using (true);
