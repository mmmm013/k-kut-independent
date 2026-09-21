-- ─────────────────────────────────────────────────────────────────────────────
-- KUT Family (KF) — Row Level Security
--
-- Posture:
--   • The catalog is public to read. /pix/[id] and /kf deliberately list units
--     that have NOT passed QC so operators can see what is still held at the
--     gate — hiding them would make the inventory look complete when it is not.
--   • Nothing in the KUT Family is publicly writable. No INSERT/UPDATE/DELETE
--     policy exists, so only the service role (which bypasses RLS) can write.
--   • Redemption codes are visible only while active, so redeemed and inactive
--     codes cannot be enumerated.
--
-- The audio gate is enforced in three independent places, not by RLS:
--   1. Write time — the kf_is_forbidden_source_url CHECK constraints.
--   2. Delivery   — public.k_kuts contains QC-passed units only.
--   3. Render     — the app gate in lib/kf/classify.ts + lib/kf/inventory.ts.
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.pix_pck      enable row level security;
alter table public.k_kut_assets enable row level security;
alter table public.k_kut_codes  enable row level security;
alter table public.m_kut_assets enable row level security;
alter table public.kupid_assets enable row level security;

-- ── Public read policies ─────────────────────────────────────────────────────

drop policy if exists "pix_pck public read" on public.pix_pck;
create policy "pix_pck public read"
  on public.pix_pck for select
  to anon, authenticated
  using (true);

drop policy if exists "k_kut_assets public read" on public.k_kut_assets;
create policy "k_kut_assets public read"
  on public.k_kut_assets for select
  to anon, authenticated
  using (true);

drop policy if exists "m_kut_assets public read" on public.m_kut_assets;
create policy "m_kut_assets public read"
  on public.m_kut_assets for select
  to anon, authenticated
  using (true);

-- Guarded: migration 600 turns llf_assets into a VIEW over sk_assets, and a
-- view takes neither RLS nor a policy. Skipped once that has run; sk_assets
-- carries the policy from then on.
do $$
begin
  if (select table_type from information_schema.tables
      where table_schema = 'public' and table_name = 'llf_assets') = 'BASE TABLE' then
    execute $stmt$alter table public.llf_assets enable row level security$stmt$;
    execute $stmt$drop policy if exists "llf_assets public read" on public.llf_assets$stmt$;
    execute $stmt$create policy "llf_assets public read" on public.llf_assets for select to anon, authenticated using (true)$stmt$;
  end if;
end
$$;

drop policy if exists "kupid_assets public read" on public.kupid_assets;
create policy "kupid_assets public read"
  on public.kupid_assets for select
  to anon, authenticated
  using (true);

-- Active codes only: a redeemed or inactive code must not be discoverable.
drop policy if exists "k_kut_codes active read" on public.k_kut_codes;
create policy "k_kut_codes active read"
  on public.k_kut_codes for select
  to anon, authenticated
  using (status = 'active');

-- ── Grants ───────────────────────────────────────────────────────────────────
-- Supabase's default privileges usually cover these; stated explicitly so the
-- migration is self-contained on a project whose defaults were changed.

grant usage on schema public to anon, authenticated;

grant select on
  public.pix_pck,
  public.k_kut_assets,
  public.k_kut_codes,
  public.m_kut_assets,
  public.llf_assets,
  public.kupid_assets,
  public.k_kuts
to anon, authenticated;

grant execute on function public.kf_is_forbidden_source_url(text) to anon, authenticated;
