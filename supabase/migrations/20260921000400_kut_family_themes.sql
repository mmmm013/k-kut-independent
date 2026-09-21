-- ─────────────────────────────────────────────────────────────────────────────
-- KUT Family (KF) — themes
--
-- Adds the seven themes to every container. A theme is the feeling a fan
-- arrives with; the home page already routes them through these seven, but
-- until now the theme never reached the database, so the inventory could not
-- answer "is this feeling covered in every container?".
--
-- A theme is SATISFIED when it has at least one playable unit in every
-- container (KUT, mK, LLF, KUPID). Coverage is computed in lib/kf/inventory.ts
-- and shown on /kf.
--
-- Additive and idempotent: the column is nullable, so existing rows stay valid
-- and an untagged unit reads as a real gap rather than being guessed at.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Shared domain ────────────────────────────────────────────────────────────
do $$
begin
  if not exists (select 1 from pg_type where typname = 'kf_theme') then
    create type public.kf_theme as enum (
      'love', 'apology', 'gratitude', 'energy', 'hurt', 'hope', 'peace'
    );
  end if;
end
$$;

comment on type public.kf_theme is
  'The seven themes a KUT Family unit can carry. Mirrors KF_THEMES in lib/kf/types.ts.';

-- ── Add the column to every container ────────────────────────────────────────
alter table public.k_kut_assets add column if not exists theme public.kf_theme;
alter table public.m_kut_assets add column if not exists theme public.kf_theme;
-- Guarded: migration 600 turns llf_assets into a VIEW over sk_assets, and a
-- view takes neither indexes, RLS, nor new columns. Skipped once that has run.
do $$
begin
  if (select table_type from information_schema.tables
      where table_schema = 'public' and table_name = 'llf_assets') = 'BASE TABLE' then
    execute $stmt$alter table public.llf_assets add column if not exists theme public.kf_theme$stmt$;
  end if;
end
$$;

alter table public.kupid_assets add column if not exists theme public.kf_theme;

create index if not exists k_kut_assets_theme_idx on public.k_kut_assets (theme);
create index if not exists m_kut_assets_theme_idx on public.m_kut_assets (theme);
-- Guarded: migration 600 turns llf_assets into a VIEW over sk_assets, and a
-- view takes neither indexes, RLS, nor new columns. Skipped once that has run.
do $$
begin
  if (select table_type from information_schema.tables
      where table_schema = 'public' and table_name = 'llf_assets') = 'BASE TABLE' then
    execute $stmt$create index if not exists llf_assets_theme_idx on public.llf_assets (theme)$stmt$;
  end if;
end
$$;

create index if not exists kupid_assets_theme_idx on public.kupid_assets (theme);

-- ── Republish the SSOT with the theme column ─────────────────────────────────
-- Same contract as 20260921000200, plus `theme`. Recreated rather than edited
-- in place so a project that already applied the earlier migration converges.
--
-- kf_theme_coverage is dropped first: an earlier revision of this migration
-- built it on top of k_kuts, and that dependency would block the drop below on
-- re-run. It is recreated at the end of this file, independent of k_kuts.
drop view if exists public.kf_theme_satisfaction;
drop view if exists public.kf_theme_coverage;
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
    m.pix_pck_id, m.structure_tag, null::text, m.theme::text,
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
    l.id::text, l.id::text, l.slug, coalesce(l.slug, l.id::text), l.id::text,
    'LLF'::text,
    l.pix_pck_id, l.structure_tag, l.variant, l.theme::text,
    l.llf_audio_url, l.audio_qc_status, l.approved_for_hug, l.duration_ms,
    coalesce(l.public_label, 'LineFeel'),
    coalesce(l.public_label, 'LineFeel'),
    'KUT-authorized delivery'::text,
    'KUT-authorized delivery'::text,
    l.keenness_score,
    coalesce(l.emotion_level, l.theme::text)
  from public.llf_assets l
  where l.audio_qc_status = 'pass'

  union all

  select
    k.id::text, k.id::text, k.slug, coalesce(k.slug, k.id::text), k.id::text,
    'KUPID'::text,
    k.pix_pck_id, k.structure_tag, k.variant, k.theme::text,
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
  'KUT SSOT. All four KUT Family unit types with their theme, QC-passed only. Read by HUG delivery and the bot moments feed.';

grant select on public.k_kuts to anon, authenticated;

-- ── Theme coverage, straight from the database ───────────────────────────────
-- The same question /kf answers, and to the same definition: a theme is
-- satisfied when every container has at least one PLAYABLE unit. Playable
-- means QC-passed with delivery audio, and for a K-KUT also an active code —
-- counting QC-passed rows alone would report a theme as satisfied while no
-- fan could actually redeem it.
create or replace view public.kf_theme_coverage
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

    select l.theme, 'LLF'
    from public.llf_assets l
    where l.audio_qc_status = 'pass'
      and l.theme is not null
      and not public.kf_is_forbidden_source_url(l.llf_audio_url)

    union all

    select k.theme, 'KUPID'
    from public.kupid_assets k
    where k.audio_qc_status = 'pass'
      and k.theme is not null
      and not public.kf_is_forbidden_source_url(k.kupid_audio_url)
  )
  select
    t.theme,
    count(*) filter (where p.unit = 'KUT')   as kut,
    count(*) filter (where p.unit = 'mK')    as mk,
    count(*) filter (where p.unit = 'LLF')   as llf,
    count(*) filter (where p.unit = 'KUPID') as kupid,
    (count(*) filter (where p.unit = 'KUT')   > 0 and
     count(*) filter (where p.unit = 'mK')    > 0 and
     count(*) filter (where p.unit = 'LLF')   > 0 and
     count(*) filter (where p.unit = 'KUPID') > 0) as satisfied
  from unnest(enum_range(null::public.kf_theme)) as t(theme)
  left join playable p on p.theme = t.theme
  group by t.theme
  order by t.theme;

comment on view public.kf_theme_coverage is
  'Per-theme container coverage. satisfied = at least one PLAYABLE unit in every container (QC pass, approved audio, and an active code for K-KUT).';

grant select on public.kf_theme_coverage to anon, authenticated;
