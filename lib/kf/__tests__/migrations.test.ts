/**
 * Reference-schema file sanity.
 *
 * These files are NOT deployed. They live under reference/NOT-DEPLOYED/ and
 * are kept as a reference implementation only — see that directory's README.
 * The tests still run because the content assertions are what caught a
 * zero-byte RLS migration, and that value does not depend on deployment.
 *
 * An empty .sql file applies to PostgreSQL without error, so "the migration
 * ran" proves nothing. A scripted edit once truncated the RLS migration to
 * zero bytes and every check still reported OK — every KUT Family table would
 * have shipped with no row-level security at all.
 *
 * These tests assert migrations by CONTENT, not by exit code.
 *
 * Run with `npm test`.
 */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

// Moved out of supabase/migrations in the containment commit: that path is the
// Supabase CLI's scan target, and leaving these files there kept a destructive
// `supabase db push` one command away. They are reference only.
const MIGRATIONS = path.join(process.cwd(), 'reference', 'NOT-DEPLOYED', 'kf-schema');

function read(file: string): string {
  return fs.readFileSync(path.join(MIGRATIONS, file), 'utf8');
}

function migrationFiles(): string[] {
  return fs
    .readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith('.sql') && f !== 'seed.sql')
    .sort();
}

test('every migration exists and carries real SQL', () => {
  const files = migrationFiles();
  assert.ok(files.length >= 6, `expected at least 6 migrations, found ${files.length}`);

  for (const file of files) {
    const body = read(file);
    assert.ok(body.trim().length > 0, `${file} is empty`);

    // Comments alone are not a migration.
    const statements = body
      .split('\n')
      .filter((line) => line.trim() && !line.trim().startsWith('--'));
    assert.ok(statements.length > 5, `${file} has no substantive statements`);
  }
});

test('RLS is enabled on every KUT Family table that holds rows', () => {
  const rls = read('20260921000300_kut_family_rls.sql');

  for (const table of [
    'pix_pck', 'k_kut_assets', 'k_kut_codes', 'm_kut_assets', 'kupid_assets',
  ]) {
    assert.match(
      rls,
      new RegExp(`alter table public\\.${table}\\s+enable row level security`),
      `RLS not enabled on ${table}`,
    );
    assert.ok(
      rls.includes(`on public.${table} for select`),
      `no read policy for ${table}`,
    );
  }

  // llf_assets becomes a view in migration 600, so its RLS is guarded rather
  // than unconditional — but it must still be there.
  assert.ok(
    rls.includes('alter table public.llf_assets enable row level security'),
    'llf_assets RLS statement missing',
  );
});

test('redeemed and inactive codes are never publicly readable', () => {
  const rls = read('20260921000300_kut_family_rls.sql');

  // An active code id IS the playback URL (/k/[code_id]), so exposing spent
  // codes would let anyone enumerate them.
  assert.match(rls, /k_kut_codes active read/);
  assert.match(rls, /using \(status = 'active'\)/);
  assert.ok(
    !/on public\.k_kut_codes for select\s+to anon, authenticated\s+using \(true\)/.test(rls),
    'k_kut_codes must not be readable without the active-status filter',
  );
});

test('nothing in the KUT Family is publicly writable', () => {
  const rls = read('20260921000300_kut_family_rls.sql');
  for (const verb of ['for insert', 'for update', 'for delete', 'for all']) {
    assert.ok(!rls.includes(verb), `public ${verb} policy found — writes are service-role only`);
  }
});

test('the source-audio gate is enforced at write time on every container', () => {
  const schema = read('20260921000100_kut_family_schema.sql');
  const lineage = read('20260921000500_kf_governed_lineage.sql');
  const sk = read('20260921000600_sk_taxonomy.sql');

  assert.ok(schema.includes('kf_is_forbidden_source_url'), 'gate function missing');
  for (const table of ['k_kut_assets', 'm_kut_assets', 'llf_assets', 'kupid_assets']) {
    assert.ok(
      schema.includes(`${table}_audio_not_source`),
      `${table} has no source-audio CHECK`,
    );
  }
  assert.ok(sk.includes('sk_assets_audio_not_source'), 'sk_assets has no source-audio CHECK');
  assert.ok(lineage.includes('nkk_assets_audio_not_source'), 'nkk_assets has no source-audio CHECK');
});

test('the governed lineage is expressed, not shortcut', () => {
  const lineage = read('20260921000500_kf_governed_lineage.sql');

  // LT-PIX -> KK -> NKK -> N-sK -> N-mK
  assert.ok(lineage.includes('create table if not exists public.nkk_assets'), 'no NKK layer');
  assert.ok(lineage.includes('kf_assert_within_parent_kk'), 'no containment trigger');
  assert.match(lineage, /source_audio_sha256 ~ ''\^\[0-9a-f\]\{64\}\$''/, 'no SHA-256 format check');
});

test('the reference schema stays out of the Supabase CLI scan path', () => {
  // supabase/migrations is what `supabase db push` reads. Nothing may live
  // there: the live project already holds the legacy corpus these files assume
  // is absent.
  assert.ok(
    !fs.existsSync(path.join(process.cwd(), 'supabase', 'migrations')),
    'supabase/migrations exists again — `supabase db push` would pick it up',
  );
  assert.ok(
    fs.existsSync(path.join(MIGRATIONS, 'SUPERSEDED_MANIFEST.json')),
    'breadcrumb manifest missing from the reference directory',
  );
});

test('every reference surface is off unless deliberately enabled', () => {
  const mode = fs.readFileSync(
    path.join(process.cwd(), 'lib', 'kf', 'reference-mode.ts'), 'utf8',
  );
  assert.match(mode, /NEXT_PUBLIC_KF_REFERENCE_UI === '1'/);

  for (const surface of [
    path.join('app', 'api', 'kf', 'inventory', 'route.ts'),
    path.join('app', 'kf', 'page.tsx'),
    path.join('app', 'llf', '[id]', 'page.tsx'),
    path.join('app', 'kupid', '[id]', 'page.tsx'),
  ]) {
    const body = fs.readFileSync(path.join(process.cwd(), surface), 'utf8');
    assert.ok(
      body.includes('KF_REFERENCE_UI_ENABLED'),
      `${surface} is not behind the reference kill switch`,
    );
  }
});
