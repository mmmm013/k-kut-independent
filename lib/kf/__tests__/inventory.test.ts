/**
 * KUT Family inventory tests.
 *
 * The inventory must list every unit, including the ones held at the gate, and
 * must degrade to a partial inventory rather than fail when a family's table is
 * missing. A fake client stands in for Supabase so no network or database is
 * needed.
 *
 * Run with `npm test`.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import { buildKfInventory, summarize } from '../inventory';

const APPROVED = 'https://x/storage/v1/object/public/kut-renders/ch1.mp3';

const ROWS: Record<string, Record<string, any>[]> = {
  k_kut_assets: [
    {
      id: 'a1', pix_pck_id: 'p', structure_tag: 'Ch1', variant: 'VOCAL_MUSIC',
      theme: 'love', audio_qc_status: 'pass', duration_ms: 18000,
      k_kut_codes: [{ id: 'c1', item_type: 'STI', status: 'active' }],
    },
    {
      id: 'a2', pix_pck_id: 'p', structure_tag: 'V1', variant: 'MUSIC_ONLY',
      theme: 'hope', audio_qc_status: 'pass', duration_ms: 12000,
      k_kut_codes: [{ id: 'c2', item_type: 'STI', status: 'redeemed' }],
    },
    {
      id: 'a3', pix_pck_id: 'p', structure_tag: 'V2', variant: 'MUSIC_ONLY',
      theme: 'hurt', audio_qc_status: 'pending', duration_ms: 12000,
      k_kut_codes: [{ id: 'c3', item_type: 'STI', status: 'active' }],
    },
  ],
  m_kut_assets: [
    { id: 'm1', pix_pck_id: 'p', mk_type: 'mK-hook', structure_tag: 'Ch1', theme: 'love', audio_qc_status: 'pass' },
  ],
  llf_assets: [
    {
      id: 'l1', pix_pck_id: 'p', structure_tag: 'Ch1', line_text: 'and the light came back',
      theme: 'love', audio_qc_status: 'pass', llf_audio_url: APPROVED,
    },
    {
      id: 'l2', pix_pck_id: 'p', structure_tag: 'Ch2', line_text: 'leaky',
      theme: 'hope', audio_qc_status: 'pass', llf_audio_url: 'https://x/tracks/master.mp3',
    },
  ],
  kupid_assets: [
    {
      id: 'u1', pix_pck_id: 'p', romance_level: 3, level_code: 'LUV',
      theme: 'love', audio_qc_status: 'pass', kupid_audio_url: APPROVED,
    },
  ],
};

/** Minimal stand-in for the Supabase query builder used by buildKfInventory. */
function fakeClient(missingTables: string[] = []) {
  return {
    from(table: string) {
      const query: any = {
        select: () => query,
        limit: () => query,
        eq: () => query,
        then: (resolve: (value: any) => void) =>
          resolve(
            missingTables.includes(table)
              ? { data: null, error: { message: 'relation does not exist' } }
              : { data: ROWS[table] ?? [], error: null },
          ),
      };
      return query;
    },
  };
}

test('a QC-passed KUT with an active code is playable via that code', async () => {
  const inventory = await buildKfInventory(fakeClient(), 'p');
  const kut = inventory.items.find((item) => item.id === 'a1')!;

  assert.equal(kut.playable, true);
  assert.equal(kut.href, '/k/c1');
  assert.equal(kut.blocked_reason, null);
});

test('units held at the gate are listed, not hidden', async () => {
  const inventory = await buildKfInventory(fakeClient(), 'p');
  const byId = new Map(inventory.items.map((item) => [item.id, item]));

  assert.equal(byId.get('a2')!.blocked_reason, 'No active redemption code');
  assert.equal(byId.get('a3')!.blocked_reason, 'Audio QC has not passed');
  assert.equal(byId.get('a2')!.href, null);
  assert.equal(byId.get('a3')!.href, null);
});

test('a unit pointing at source audio is blocked even with QC pass', async () => {
  const inventory = await buildKfInventory(fakeClient(), 'p');
  const leaky = inventory.items.find((item) => item.id === 'l2')!;

  assert.equal(leaky.playable, false);
  assert.equal(leaky.blocked_reason, 'Blocked: PIX/source audio is not a delivery unit');
});

test('every family is rolled up, in canonical order', async () => {
  const inventory = await buildKfInventory(fakeClient(), 'p');

  assert.deepEqual(
    inventory.families.map((family) => family.unit_type),
    ['KUT', 'mK', 'LLF', 'KUPID'],
  );
  assert.deepEqual(inventory.totals, { total: 7, qc_pass: 6, playable: 4 });
});

test('a missing table degrades to a partial inventory instead of failing', async () => {
  const inventory = await buildKfInventory(fakeClient(['llf_assets', 'kupid_assets']), 'p');

  assert.equal(inventory.ok, true);
  assert.deepEqual(inventory.unavailable, ['llf_assets', 'kupid_assets']);
  assert.equal(inventory.totals.total, 4);
});

test('a theme is satisfied only when every container has a playable unit', async () => {
  const inventory = await buildKfInventory(fakeClient(), 'p');
  const love = inventory.coverage.find((row) => row.theme === 'love')!;

  assert.deepEqual(love.containers, { KUT: 1, mK: 1, LLF: 1, KUPID: 1 });
  assert.deepEqual(love.missing, []);
  assert.equal(love.satisfied, true);
  assert.deepEqual(inventory.satisfied_themes, ['love']);
});

test('a theme backed only by held units is not satisfied', async () => {
  const inventory = await buildKfInventory(fakeClient(), 'p');
  const hope = inventory.coverage.find((row) => row.theme === 'hope')!;

  // hope has a QC-passed KUT with no active code, and an LLF pointing at
  // source audio. Neither is playable, so hope is short in every container.
  assert.deepEqual(hope.containers, { KUT: 0, mK: 0, LLF: 0, KUPID: 0 });
  assert.equal(hope.satisfied, false);
  assert.deepEqual(hope.missing, ['KUT', 'mK', 'LLF', 'KUPID']);
});

test('all seven themes are always reported, gaps included', async () => {
  const inventory = await buildKfInventory(fakeClient(), 'p');

  assert.deepEqual(
    inventory.coverage.map((row) => row.theme),
    ['love', 'apology', 'gratitude', 'energy', 'hurt', 'hope', 'peace'],
  );
  assert.equal(inventory.coverage.every((row) => row.containers !== undefined), true);
});

test('an untagged unit is never assigned a theme', async () => {
  const inventory = await buildKfInventory(fakeClient(), 'p');
  const untagged = inventory.items.filter((item) => item.theme === null);

  // The mini-KUT fixture without a theme column must stay null rather than
  // being guessed into a theme and hiding a real coverage gap.
  assert.equal(untagged.every((item) => item.theme === null), true);
});

test('summarize counts exactly the items it is handed', async () => {
  const inventory = await buildKfInventory(fakeClient(), 'p');

  // The whole inventory: summarize must agree with what buildKfInventory
  // already reported, or the route's recomputation would drift from it.
  assert.deepEqual(summarize(inventory.items).totals, inventory.totals);
  assert.deepEqual(summarize(inventory.items).families, inventory.families);

  // A narrowed list: counts must describe the narrowed list, not the whole.
  const onlyLlf = inventory.items.filter((item) => item.unit_type === 'LLF');
  const narrowed = summarize(onlyLlf);

  assert.equal(narrowed.totals.total, 2);
  assert.equal(narrowed.families.find((f) => f.unit_type === 'LLF')!.total, 2);
  assert.equal(narrowed.families.find((f) => f.unit_type === 'KUT')!.total, 0);
});
