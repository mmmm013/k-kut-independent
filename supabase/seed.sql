-- ─────────────────────────────────────────────────────────────────────────────
-- KUT Family — local development seed
--
-- Sample data only. NOT applied by `supabase db push`; it runs on
-- `supabase db reset`, which is a local-only command. Never run this against
-- production.
--
-- Gives one PIX with at least one unit of every KUT Family type, including
-- units deliberately held at the gate so /kf and /pix/[id] can be seen
-- rendering both states.
-- ─────────────────────────────────────────────────────────────────────────────

insert into public.pix_pck (id, title, artist)
values ('demo-solace', 'Solace', 'KLEIGH')
on conflict (id) do nothing;

-- ── K-KUT: one playable, one still in QC ─────────────────────────────────────
insert into public.k_kut_assets
  (id, pix_pck_id, structure_tag, variant, kut_audio_url, audio_qc_status, duration_ms, approved_for_hug, public_label)
values
  ('00000000-0000-4000-8000-0000000000a1', 'demo-solace', 'Ch1', 'VOCAL_MUSIC',
   'https://example.supabase.co/storage/v1/object/public/kut-renders/solace-ch1.mp3',
   'pass', 21000, true, 'K-KUT · Ch1'),
  ('00000000-0000-4000-8000-0000000000a2', 'demo-solace', 'V1 → Pre1', 'MUSIC_ONLY',
   'https://example.supabase.co/storage/v1/object/public/kut-renders/solace-v1-pre1.mp3',
   'pending', 33000, false, 'K-KUT · V1 → Pre1')
on conflict (id) do nothing;

-- Only the QC-passed asset gets a live code, so the other stays unplayable.
insert into public.k_kut_codes (id, k_kut_asset_id, item_type, status)
values ('00000000-0000-4000-8000-00000000bc01', '00000000-0000-4000-8000-0000000000a1', 'STI', 'active')
on conflict (id) do nothing;

-- ── mini-KUT ─────────────────────────────────────────────────────────────────
insert into public.m_kut_assets
  (id, pix_pck_id, k_kut_asset_id, mk_type, content, structure_tag, mk_audio_url, audio_qc_status)
values
  ('00000000-0000-4000-8000-00000000ab01', 'demo-solace', '00000000-0000-4000-8000-0000000000a1',
   'mK-hook', 'love renews', 'Ch1',
   'https://example.supabase.co/storage/v1/object/public/kut-renders/solace-hook.mp3', 'pass'),
  ('00000000-0000-4000-8000-00000000ab02', 'demo-solace', '00000000-0000-4000-8000-0000000000a1',
   'mK-noun', 'solace', 'Ch1',
   null, 'pending')
on conflict (id) do nothing;

-- ── LineFeel ─────────────────────────────────────────────────────────────────
insert into public.llf_assets
  (id, pix_pck_id, k_kut_asset_id, structure_tag, variant, line_text, llf_audio_url, audio_qc_status, duration_ms)
values
  ('00000000-0000-4000-8000-00000000cd01', 'demo-solace', '00000000-0000-4000-8000-0000000000a1',
   'Ch1', 'VOCAL_MUSIC',
   'and the light came back',
   'https://example.supabase.co/storage/v1/object/public/kut-renders/solace-line-01.mp3',
   'pass', 4200)
on conflict (id) do nothing;

-- ── K-kUpId ──────────────────────────────────────────────────────────────────
insert into public.kupid_assets
  (id, pix_pck_id, k_kut_asset_id, structure_tag, variant, romance_level, level_code, kupid_audio_url, audio_qc_status, duration_ms)
values
  ('00000000-0000-4000-8000-00000000ef01', 'demo-solace', '00000000-0000-4000-8000-0000000000a1',
   'Ch1', 'VOCAL_MUSIC', 3, 'LUV',
   'https://example.supabase.co/storage/v1/object/public/kut-renders/solace-luv.mp3',
   'pass', 21000)
on conflict (id) do nothing;
