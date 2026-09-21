-- ─────────────────────────────────────────────────────────────────────────────
-- KUT Family — local development seed
--
-- Sample data only. NOT applied by `supabase db push`; it runs on
-- `supabase db reset`, which is a local-only command. Never run this against
-- production.
--
-- Seeds every one of the seven themes into every container, so all seven read
-- as SATISFIED on /kf, plus a handful of units deliberately held at the gate
-- so both states are visible.
--
-- Ids are derived with md5(...)::uuid, so re-running the seed updates the same
-- rows instead of duplicating them.
-- ─────────────────────────────────────────────────────────────────────────────

-- One transaction: the temporary theme matrix below is ON COMMIT DROP, and
-- psql autocommits each statement otherwise, which would drop it immediately.
begin;

insert into public.pix_pck (id, title, artist)
values ('demo-solace', 'Solace', 'KLEIGH')
on conflict (id) do nothing;

-- ── The theme matrix ─────────────────────────────────────────────────────────
-- One canonical section per theme, so the K-KUT uniqueness constraint
-- (pix_pck_id, structure_tag, variant) holds across all seven.
create temporary table kf_seed_themes (
  theme         public.kf_theme primary key,
  structure_tag text not null,
  line_text     text not null,
  hook          text not null,
  romance_level smallint not null,
  level_code    text not null
) on commit drop;

insert into kf_seed_themes values
  ('love',      'Ch1',   'and the light came back',      'love renews',      3, 'LUV'),
  ('apology',   'V1',    'I got it wrong and I know it', 'open hands',       1, 'INT'),
  ('gratitude', 'Pre1',  'you stayed when it was hard',  'steady thanks',    2, 'DAT'),
  ('energy',    'V2',    'up on my feet again',          'high energy',      4, 'SEX'),
  ('hurt',      'Pre2',  'it still aches in the quiet',  'wounded willing',  1, 'INT'),
  ('hope',      'Ch2',   'there is a morning after',     'morning after',    2, 'DAT'),
  ('peace',     'Intro', 'nothing left to prove',        'melancholy blues', 5, 'FVR');

-- ── K-KUT, one playable unit per theme ───────────────────────────────────────
insert into public.k_kut_assets
  (id, pix_pck_id, structure_tag, variant, theme, kut_audio_url,
   audio_qc_status, duration_ms, approved_for_hug, public_label, keenness_score)
select
  md5('kut-' || t.theme::text)::uuid,
  'demo-solace',
  t.structure_tag,
  'VOCAL_MUSIC',
  t.theme,
  'https://example.supabase.co/storage/v1/object/public/kut-renders/solace-'
    || t.theme::text || '-kut.mp3',
  'pass',
  21000,
  true,
  'K-KUT · ' || t.structure_tag,
  80
from kf_seed_themes t
on conflict (id) do update set
  theme = excluded.theme,
  kut_audio_url = excluded.kut_audio_url,
  audio_qc_status = excluded.audio_qc_status;

-- Each playable K-KUT gets exactly one live code.
insert into public.k_kut_codes (id, k_kut_asset_id, item_type, status)
select md5('code-' || t.theme::text)::uuid, md5('kut-' || t.theme::text)::uuid, 'STI', 'active'
from kf_seed_themes t
on conflict (id) do nothing;

-- ── mini-KUT, one playable unit per theme ────────────────────────────────────
insert into public.m_kut_assets
  (id, pix_pck_id, k_kut_asset_id, mk_type, content, structure_tag, theme,
   mk_audio_url, audio_qc_status, keenness_score)
select
  md5('mk-' || t.theme::text)::uuid,
  'demo-solace',
  md5('kut-' || t.theme::text)::uuid,
  'mK-hook',
  t.hook,
  t.structure_tag,
  t.theme,
  'https://example.supabase.co/storage/v1/object/public/kut-renders/solace-'
    || t.theme::text || '-hook.mp3',
  'pass',
  75
from kf_seed_themes t
on conflict (id) do update set
  theme = excluded.theme,
  audio_qc_status = excluded.audio_qc_status;

-- ── LineFeel, one playable unit per theme ────────────────────────────────────
insert into public.llf_assets
  (id, pix_pck_id, k_kut_asset_id, structure_tag, variant, line_text, theme,
   llf_audio_url, audio_qc_status, duration_ms, keenness_score)
select
  md5('llf-' || t.theme::text)::uuid,
  'demo-solace',
  md5('kut-' || t.theme::text)::uuid,
  t.structure_tag,
  'VOCAL_MUSIC',
  t.line_text,
  t.theme,
  'https://example.supabase.co/storage/v1/object/public/kut-renders/solace-'
    || t.theme::text || '-line.mp3',
  'pass',
  4200,
  70
from kf_seed_themes t
on conflict (id) do update set
  theme = excluded.theme,
  audio_qc_status = excluded.audio_qc_status;

-- ── K-kUpId, one playable unit per theme ─────────────────────────────────────
insert into public.kupid_assets
  (id, pix_pck_id, k_kut_asset_id, structure_tag, variant, romance_level,
   level_code, theme, kupid_audio_url, audio_qc_status, duration_ms, keenness_score)
select
  md5('kupid-' || t.theme::text)::uuid,
  'demo-solace',
  md5('kut-' || t.theme::text)::uuid,
  t.structure_tag,
  'VOCAL_MUSIC',
  t.romance_level,
  t.level_code,
  t.theme,
  'https://example.supabase.co/storage/v1/object/public/kut-renders/solace-'
    || t.theme::text || '-kupid.mp3',
  'pass',
  21000,
  65
from kf_seed_themes t
on conflict (id) do update set
  theme = excluded.theme,
  audio_qc_status = excluded.audio_qc_status;

-- ── Units deliberately held at the gate ──────────────────────────────────────
-- So /kf and /pix/[id] can be seen rendering the unplayable state too.

-- Still in QC.
insert into public.k_kut_assets
  (id, pix_pck_id, structure_tag, variant, theme, kut_audio_url,
   audio_qc_status, duration_ms, approved_for_hug, public_label)
values
  (md5('kut-held-qc')::uuid, 'demo-solace', 'BR', 'MUSIC_ONLY', 'hope',
   'https://example.supabase.co/storage/v1/object/public/kut-renders/solace-br.mp3',
   'pending', 33000, false, 'K-KUT · BR')
on conflict (id) do nothing;

-- QC passed, but no live code, so still not redeemable.
insert into public.k_kut_assets
  (id, pix_pck_id, structure_tag, variant, theme, kut_audio_url,
   audio_qc_status, duration_ms, approved_for_hug, public_label)
values
  (md5('kut-held-code')::uuid, 'demo-solace', 'Ch3', 'MUSIC_ONLY', 'love',
   'https://example.supabase.co/storage/v1/object/public/kut-renders/solace-ch3.mp3',
   'pass', 24000, false, 'K-KUT · Ch3')
on conflict (id) do nothing;

-- A mini-KUT with no audio yet.
insert into public.m_kut_assets
  (id, pix_pck_id, k_kut_asset_id, mk_type, content, structure_tag, theme,
   mk_audio_url, audio_qc_status)
values
  (md5('mk-held')::uuid, 'demo-solace', md5('kut-love')::uuid, 'mK-noun',
   'solace', 'Ch1', 'peace', null, 'pending')
on conflict (id) do nothing;

commit;
