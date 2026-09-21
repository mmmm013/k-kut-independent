-- ─────────────────────────────────────────────────────────────────────────────
-- sK — short-KUT, and its subtypes
--
-- An sK is everything that is neither a KK nor an mK. Its subtypes are the
-- pattern classes found in TEXT Loop Runs over the lyric, plus the small-item
-- codes already recognized upstream by is_explicit_small_kut().
--
-- LineFeel (LLF) is a one-liner, which is a 1LNR, which is an sK. It was
-- modelled as a peer container in migrations 100-400; that was wrong. This
-- folds llf_assets into sk_assets and leaves `llf_assets` behind as a
-- compatibility VIEW so the existing /llf/[id] route keeps working unchanged
-- while the app catches up.
--
-- Idempotent and non-destructive: no row is dropped, and re-running converges.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Subtype vocabulary ───────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'sk_subtype') then
    create type public.sk_subtype as enum (
      -- found in TEXT Loop Runs
      'TWST',      -- twist
      'HOOK',      -- hook
      'MTa4',      -- metaphor
      'PHRZ',      -- phrase
      'PHRZ_LNG',  -- common longer phrase
      'SAYING',    -- common saying
      'ALTR',      -- alliteration
      '1LNR',      -- one-liner   (LineFeel lands here)
      'CNTRST',    -- compare & contrast
      'OXY',       -- oxymoron
      'CLSHA',     -- cliche
      'LNTRIO',    -- line trio
      'LNPR',      -- line pair
      '3RHYM',     -- three-rhyme
      '4RHYM',     -- four-rhyme
      -- small-item codes already recognized upstream
      'TRM',       -- term cut
      'TERM_CUT',
      'WORD_CUT',
      'XCLM',      -- exclamation
      'OTHER'      -- found in a TEXT Loop Run, not yet classified
    );
  end if;
end
$$;

comment on type public.sk_subtype is
  'sK pattern classes. Everything that is neither a KK nor an mK is an sK; this says which kind.';

-- ── sk_assets ────────────────────────────────────────────────────────────────
create table if not exists public.sk_assets (
  id                  uuid primary key default gen_random_uuid(),
  pix_pck_id          text not null references public.pix_pck(id) on delete cascade,
  nkk_asset_id        uuid references public.nkk_assets(id) on delete cascade,
  k_kut_asset_id      uuid references public.k_kut_assets(id) on delete set null,
  sk_subtype          public.sk_subtype not null default 'OTHER',
  structure_tag       text,
  variant             text check (variant is null or variant in ('VOCAL_MUSIC', 'MUSIC_ONLY')),
  theme               public.kf_theme,
  line_text           text,
  sk_audio_url        text,
  start_seconds       numeric,
  end_seconds         numeric,
  lt_pix_id           text,
  authority_src_id    text,
  source_audio_path   text,
  source_audio_sha256 text,
  audio_qc_status     text not null default 'pending'
                        check (audio_qc_status in ('pass', 'fail', 'pending')),
  duration_ms         integer check (duration_ms is null or duration_ms > 0),
  approved_for_hug    boolean not null default false,
  slug                text unique,
  public_label        text,
  keenness_score      smallint check (keenness_score is null or keenness_score between 0 and 100),
  emotion_level       text,
  -- Which TEXT Loop Run surfaced this sK, for DMAIC measurement.
  text_loop_run_id    text,
  created_at          timestamptz not null default now(),

  constraint sk_assets_sha256_format
    check (source_audio_sha256 is null or source_audio_sha256 ~ '^[0-9a-f]{64}$'),
  constraint sk_assets_bounds_ordered
    check (
      (start_seconds is null and end_seconds is null)
      or (start_seconds >= 0 and end_seconds > start_seconds)
    ),
  constraint sk_assets_audio_not_source
    check (sk_audio_url is null or not public.kf_is_forbidden_source_url(sk_audio_url)),
  constraint sk_assets_hug_requires_qc
    check (approved_for_hug = false or audio_qc_status = 'pass')
);

create index if not exists sk_assets_pix_idx     on public.sk_assets (pix_pck_id);
create index if not exists sk_assets_nkk_idx     on public.sk_assets (nkk_asset_id);
create index if not exists sk_assets_theme_idx   on public.sk_assets (theme);
create index if not exists sk_assets_subtype_idx on public.sk_assets (sk_subtype);
create index if not exists sk_assets_run_idx     on public.sk_assets (text_loop_run_id);

comment on table public.sk_assets is
  'sK — short-KUT. Everything that is neither a KK nor an mK, classified by sk_subtype.';

-- ── Migrate LineFeel rows in, then replace the table with a view ─────────────
do $$
begin
  -- Only act while llf_assets is still a real table.
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'llf_assets'
      and table_type = 'BASE TABLE'
  ) then
    insert into public.sk_assets (
      id, pix_pck_id, nkk_asset_id, k_kut_asset_id, sk_subtype, structure_tag,
      variant, theme, line_text, sk_audio_url, lt_pix_id, authority_src_id,
      source_audio_path, source_audio_sha256, audio_qc_status, duration_ms,
      approved_for_hug, slug, public_label, keenness_score, emotion_level,
      created_at
    )
    select
      l.id, l.pix_pck_id, l.nkk_asset_id, l.k_kut_asset_id, '1LNR', l.structure_tag,
      l.variant, l.theme, l.line_text, l.llf_audio_url, l.lt_pix_id, l.authority_src_id,
      l.source_audio_path, l.source_audio_sha256, l.audio_qc_status, l.duration_ms,
      l.approved_for_hug, l.slug, l.public_label, l.keenness_score, l.emotion_level,
      l.created_at
    from public.llf_assets l
    on conflict (id) do nothing;

    drop table public.llf_assets cascade;
  end if;
end
$$;

-- Compatibility view: the app's existing /llf/[id] route reads this unchanged.
create or replace view public.llf_assets
with (security_invoker = true)
as
  select
    id, pix_pck_id, nkk_asset_id, k_kut_asset_id, structure_tag, variant, theme,
    line_text, sk_audio_url as llf_audio_url, start_seconds, end_seconds,
    lt_pix_id, authority_src_id, source_audio_path, source_audio_sha256,
    audio_qc_status, duration_ms, approved_for_hug, slug, public_label,
    keenness_score, emotion_level, created_at
  from public.sk_assets
  where sk_subtype = '1LNR';

comment on view public.llf_assets is
  'Compatibility view. LineFeel is a 1LNR, which is an sK — the rows live in sk_assets.';

-- ── Coverage now counts every sK subtype, not just one-liners ────────────────
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

    select s.theme, 'sK'
    from public.sk_assets s
    where s.audio_qc_status = 'pass'
      and s.theme is not null
      and not public.kf_is_forbidden_source_url(s.sk_audio_url)
  )
  select
    m.theme,
    m.unit_type,
    count(p.unit)                          as current,
    m.minimum                              as required,
    greatest(m.minimum - count(p.unit), 0) as shortfall,
    (count(p.unit) >= m.minimum)           as met
  from public.kf_theme_minimums m
  left join playable p
    on p.theme = m.theme and p.unit = m.unit_type
  group by m.theme, m.unit_type, m.minimum
  order by m.theme, m.unit_type;

comment on view public.kf_theme_coverage is
  'Per theme and container: current playable units, the required floor, and the shortfall.';

create view public.kf_theme_satisfaction
with (security_invoker = true)
as
  select
    theme,
    sum(current)   as current_total,
    sum(required)  as required_total,
    sum(shortfall) as shortfall_total,
    bool_and(met)  as satisfied,
    string_agg(
      case when not met then unit_type || ' needs ' || shortfall end,
      ', ' order by unit_type
    )              as still_needed
  from public.kf_theme_coverage
  group by theme
  order by theme;

comment on view public.kf_theme_satisfaction is
  'One row per theme. still_needed is the work queue, e.g. "sK needs 9".';

-- ── DMAIC measure: where is the sK supply actually coming from? ──────────────
create or replace view public.kf_sk_subtype_yield
with (security_invoker = true)
as
  select
    s.sk_subtype,
    s.theme,
    count(*)                                                as total,
    count(*) filter (where s.audio_qc_status = 'pass')       as qc_pass,
    count(*) filter (where s.audio_qc_status = 'fail')       as qc_fail,
    count(*) filter (where s.audio_qc_status = 'pending')    as qc_pending,
    round(
      100.0 * count(*) filter (where s.audio_qc_status = 'pass')
      / nullif(count(*), 0), 1
    )                                                        as pass_rate_pct,
    count(distinct s.text_loop_run_id)                       as text_loop_runs
  from public.sk_assets s
  group by s.sk_subtype, s.theme
  order by s.sk_subtype, s.theme;

comment on view public.kf_sk_subtype_yield is
  'DMAIC measure. Yield and QC pass rate per sK subtype per theme: which pattern classes actually produce sellable units.';

alter table public.sk_assets enable row level security;

drop policy if exists "sk_assets public read" on public.sk_assets;
create policy "sk_assets public read"
  on public.sk_assets for select to anon, authenticated using (true);

grant select on public.sk_assets, public.llf_assets, public.kf_theme_coverage,
                public.kf_theme_satisfaction, public.kf_sk_subtype_yield
to anon, authenticated;

-- ── Republish k_kuts ─────────────────────────────────────────────────────────
-- The `drop table public.llf_assets cascade` above also drops public.k_kuts,
-- which depended on it. HUG delivery (/api/hug/[id]) and the bot moments feed
-- both read that view, so it must be rebuilt here or this migration breaks
-- delivery. Rebuilt with sK sourced from sk_assets.
--
-- NOT the SSOT: GPMC is the canonical write authority. This is a downstream
-- publication mirror of decisions already frozen upstream, QC-passed only.
drop view if exists public.k_kuts;

create view public.k_kuts
with (security_invoker = true)
as
  select
    a.id::text                                            as id,
    a.id::text                                            as kut_id,
    a.slug                                                as slug,
    coalesce(a.slug, a.id::text)                          as public_id,
    a.id::text                                            as uuid,
    'KUT'::text                                           as delivery_unit_type,
    a.pix_pck_id                                          as pix_pck_id,
    a.lt_pix_id                                           as lt_pix_id,
    a.authority_src_id                                    as authority_src_id,
    a.source_audio_sha256                                 as source_audio_sha256,
    a.structure_tag                                       as structure_tag,
    a.variant                                             as variant,
    a.theme::text                                         as theme,
    a.kut_audio_url                                       as delivery_audio_url,
    a.audio_qc_status                                     as audio_qc_status,
    a.approved_for_hug                                    as approved_for_hug,
    a.duration_ms                                         as duration_ms,
    coalesce(a.public_label, 'K-KUT · ' || coalesce(a.structure_tag, 'section')) as public_label,
    coalesce(a.public_label, 'K-KUT · ' || coalesce(a.structure_tag, 'section')) as title,
    'KUT-authorized delivery'::text                       as description,
    'KUT-authorized delivery'::text                       as delivery_note,
    a.keenness_score                                      as keenness_score,
    coalesce(a.emotion_level, a.theme::text)              as emotion_level
  from public.k_kut_assets a
  where a.audio_qc_status = 'pass'

  union all

  select
    m.id::text, m.id::text, m.slug, coalesce(m.slug, m.id::text), m.id::text,
    'mK'::text,
    m.pix_pck_id, m.lt_pix_id, m.authority_src_id, m.source_audio_sha256,
    m.structure_tag, null::text, m.theme::text,
    m.mk_audio_url, m.audio_qc_status, m.approved_for_hug, null::integer,
    coalesce(m.public_label, m.mk_type),
    coalesce(m.public_label, m.mk_type),
    'KUT-authorized delivery'::text,
    'KUT-authorized delivery'::text,
    m.keenness_score,
    coalesce(m.emotion_level, m.theme::text)
  from public.m_kut_assets m
  where m.audio_qc_status = 'pass'

  union all

  select
    s.id::text, s.id::text, s.slug, coalesce(s.slug, s.id::text), s.id::text,
    'sK'::text,
    s.pix_pck_id, s.lt_pix_id, s.authority_src_id, s.source_audio_sha256,
    s.structure_tag, s.variant, s.theme::text,
    s.sk_audio_url, s.audio_qc_status, s.approved_for_hug, s.duration_ms,
    coalesce(s.public_label, s.sk_subtype::text),
    coalesce(s.public_label, s.sk_subtype::text),
    'KUT-authorized delivery'::text,
    'KUT-authorized delivery'::text,
    s.keenness_score,
    coalesce(s.emotion_level, s.theme::text)
  from public.sk_assets s
  where s.audio_qc_status = 'pass'

  union all

  select
    k.id::text, k.id::text, k.slug, coalesce(k.slug, k.id::text), k.id::text,
    'KUPID'::text,
    k.pix_pck_id, k.lt_pix_id, k.authority_src_id, k.source_audio_sha256,
    k.structure_tag, k.variant, k.theme::text,
    k.kupid_audio_url, k.audio_qc_status, k.approved_for_hug, k.duration_ms,
    coalesce(k.public_label, 'K-kUpId · ' || k.level_code),
    coalesce(k.public_label, 'K-kUpId · ' || k.level_code),
    'KUT-authorized delivery'::text,
    'KUT-authorized delivery'::text,
    k.keenness_score,
    coalesce(k.emotion_level, k.theme::text)
  from public.kupid_assets k
  where k.audio_qc_status = 'pass';

comment on view public.k_kuts is
  'Downstream publication mirror of GPMC-frozen delivery units, QC-passed only. NOT the SSOT — GPMC is the canonical write authority. Read by HUG delivery and the bot moments feed.';

grant select on public.k_kuts to anon, authenticated;
