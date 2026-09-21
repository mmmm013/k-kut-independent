-- ─────────────────────────────────────────────────────────────────────────────
-- KUT SSOT — public.k_kuts
--
-- The single source of truth HUG delivery (/api/hug/[id]) and the bot moments
-- feed (/api/bot/moments) read. It unions all four KUT Family unit types into
-- one shape and applies the silo gate in the database: a unit that has not
-- passed audio QC is not in the SSOT at all, so it cannot be delivered even if
-- an application gate were bypassed.
--
-- Columns are chosen to match what the routes read:
--   id / kut_id / slug / public_id / uuid   HUG id resolution
--   delivery_unit_type                      authoritative, never guessed
--   delivery_audio_url                      approved render only
--   title / description                     bot search (ilike)
--   keenness_score / emotion_level          bot ranking
--
-- Replacing a view whose column list changes requires a DROP first.
-- ─────────────────────────────────────────────────────────────────────────────

drop view if exists public.k_kuts;

create view public.k_kuts
with (security_invoker = true)
as
  -- ── K-KUT ──────────────────────────────────────────────────────────────────
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
    a.kut_audio_url                                       as delivery_audio_url,
    a.audio_qc_status                                     as audio_qc_status,
    a.approved_for_hug                                    as approved_for_hug,
    a.duration_ms                                         as duration_ms,
    coalesce(a.public_label, 'K-KUT · ' || coalesce(a.structure_tag, 'section')) as public_label,
    coalesce(a.public_label, 'K-KUT · ' || coalesce(a.structure_tag, 'section')) as title,
    'KUT-authorized delivery'::text                       as description,
    'KUT-authorized delivery'::text                       as delivery_note,
    a.keenness_score                                      as keenness_score,
    a.emotion_level                                       as emotion_level
  from public.k_kut_assets a
  where a.audio_qc_status = 'pass'

  union all

  -- ── mini-KUT ───────────────────────────────────────────────────────────────
  select
    m.id::text,
    m.id::text,
    m.slug,
    coalesce(m.slug, m.id::text),
    m.id::text,
    'mK'::text,
    m.pix_pck_id,
    m.structure_tag,
    null::text,
    m.mk_audio_url,
    m.audio_qc_status,
    m.approved_for_hug,
    null::integer,
    coalesce(m.public_label, m.mk_type),
    coalesce(m.public_label, m.mk_type),
    'KUT-authorized delivery'::text,
    'KUT-authorized delivery'::text,
    m.keenness_score,
    m.emotion_level
  from public.m_kut_assets m
  where m.audio_qc_status = 'pass'

  union all

  -- ── LineFeel ───────────────────────────────────────────────────────────────
  select
    l.id::text,
    l.id::text,
    l.slug,
    coalesce(l.slug, l.id::text),
    l.id::text,
    'LLF'::text,
    l.pix_pck_id,
    l.structure_tag,
    l.variant,
    l.llf_audio_url,
    l.audio_qc_status,
    l.approved_for_hug,
    l.duration_ms,
    coalesce(l.public_label, 'LineFeel'),
    coalesce(l.public_label, 'LineFeel'),
    'KUT-authorized delivery'::text,
    'KUT-authorized delivery'::text,
    l.keenness_score,
    l.emotion_level
  from public.llf_assets l
  where l.audio_qc_status = 'pass'

  union all

  -- ── K-kUpId ────────────────────────────────────────────────────────────────
  select
    k.id::text,
    k.id::text,
    k.slug,
    coalesce(k.slug, k.id::text),
    k.id::text,
    'KUPID'::text,
    k.pix_pck_id,
    k.structure_tag,
    k.variant,
    k.kupid_audio_url,
    k.audio_qc_status,
    k.approved_for_hug,
    k.duration_ms,
    coalesce(k.public_label, 'K-kUpId · ' || k.level_code),
    coalesce(k.public_label, 'K-kUpId · ' || k.level_code),
    'KUT-authorized delivery'::text,
    'KUT-authorized delivery'::text,
    k.keenness_score,
    k.emotion_level
  from public.kupid_assets k
  where k.audio_qc_status = 'pass';

comment on view public.k_kuts is
  'KUT SSOT. All four KUT Family unit types, QC-passed only. Read by HUG delivery and the bot moments feed.';
