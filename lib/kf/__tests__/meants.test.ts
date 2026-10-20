/**
 * Meants tests.
 *
 * The catalog is a STRICT clone, so the first tests read the reference schema
 * itself and fail if any column of any Element Type is missing from the
 * clone. The rest cover the Meant gate, the tier rules and platform conduct.
 *
 * Run with `npm test`.
 */

import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

import {
  MEANT_TYPE_CODES,
  MEANT_TYPES,
  MeantClone,
  canDeliverTier,
  findSalesLanguage,
  honorUserVerdict,
  lineageOf,
  nextBestAction,
  resolveMeantType,
  validateMeant,
} from '../meants';
import { KUPID_LEVELS, MK_TYPES, SK_SUBTYPES } from '../types';

const ROOT = process.cwd();
const SCHEMA_DIR = join(ROOT, 'reference', 'NOT-DEPLOYED', 'kf-schema');
const sql = readdirSync(SCHEMA_DIR)
  .filter((f) => f.endsWith('.sql') && f !== 'seed.sql')
  .map((f) => readFileSync(join(SCHEMA_DIR, f), 'utf8'))
  .join('\n');

const COLUMN = /^\s+([a-z_0-9]+)\s+(text|uuid|integer|smallint|numeric|boolean|timestamptz|public\.[a-z_]+)\b/;

/** Every column the reference schema gives a table, from all migrations. */
function schemaColumns(table: string): Set<string> {
  const cols = new Set<string>();

  const create = new RegExp(`create table if not exists public\\.${table} \\(([\\s\\S]*?)\\n\\);`);
  const body = sql.match(create)?.[1] ?? '';
  for (const line of body.split('\n')) {
    const m = line.match(COLUMN);
    if (m && !line.trim().startsWith('constraint')) cols.add(m[1]);
  }

  const alter = new RegExp(`alter table public\\.${table}\\s+([\\s\\S]*?);`, 'g');
  for (const block of sql.matchAll(alter)) {
    for (const m of block[1].matchAll(/add column if not exists ([a-z_0-9]+)/g)) cols.add(m[1]);
  }

  // The governed-lineage loop adds the lineage identity to every listed table.
  const loop = sql.match(/foreach target in array array\[([\s\S]*?)\]([\s\S]*?)end loop/);
  if (loop && loop[1].includes(`'${table}'`)) {
    for (const m of loop[2].matchAll(/add column if not exists ([a-z_0-9]+)/g)) cols.add(m[1]);
  }

  return cols;
}

test('every schema-backed Element Type clones every one of its columns', () => {
  for (const code of MEANT_TYPE_CODES) {
    const type = MEANT_TYPES[code];
    if (!type.table) continue;

    const expected = schemaColumns(type.table);
    assert.ok(expected.size > 5, `${type.table}: schema not found`);

    const cloned = new Set(type.attributes.map((a) => a.name));
    for (const col of expected) {
      assert.ok(cloned.has(col), `${type.kkrCode} is missing ${type.table}.${col}`);
    }
    for (const col of cloned) {
      assert.ok(expected.has(col), `${type.kkrCode} invents ${col}, which ${type.table} lacks`);
    }
  }
});

test('attribute names are unique within each type', () => {
  for (const code of MEANT_TYPE_CODES) {
    const names = MEANT_TYPES[code].attributes.map((a) => a.name);
    assert.equal(new Set(names).size, names.length, code);
  }
});

test('every enum value is cloned verbatim', () => {
  assert.deepEqual(MEANT_TYPES.SK.subtypes.map((s) => s.code), [...SK_SUBTYPES]);
  assert.deepEqual(MEANT_TYPES.MK.subtypes.map((s) => s.code), [...MK_TYPES]);
  assert.deepEqual(MEANT_TYPES.KUPID.subtypes.map((s) => s.code), KUPID_LEVELS.map((l) => l.code));

  const variant = MEANT_TYPES.KK.attributes.find((a) => a.name === 'variant');
  assert.deepEqual(variant?.values, ['VOCAL_MUSIC', 'MUSIC_ONLY']);
});

test('known upstream defects are cloned, and flagged', () => {
  const kk = MEANT_TYPES.KK.attributes;
  assert.ok(kk.find((a) => a.name === 'keenness_score')?.upstreamFlag);
  assert.ok(kk.find((a) => a.name === 'theme')?.upstreamFlag);
  const trm = MEANT_TYPES.SK.subtypes.find((s) => s.code === 'TRM');
  assert.ok(trm?.upstreamFlag);
});

test('lineage follows the capture-room LOCK', () => {
  assert.deepEqual(lineageOf('MK'), ['NAKED_SK', 'NKK', 'DKK', 'KK', 'LT-PIX']);
  assert.deepEqual(lineageOf('SK'), ['NKK', 'DKK', 'KK', 'LT-PIX']);
  // Never LT-PIX -> sK or LT-PIX -> mK directly.
  assert.notEqual(MEANT_TYPES.SK.parent, 'LT-PIX');
  assert.notEqual(MEANT_TYPES.MK.parent, 'LT-PIX');
  assert.equal(MEANT_TYPES.KUPID.parent, null);
});

test('legacy spellings resolve to a cloned type, never a new one', () => {
  assert.deepEqual(resolveMeantType('LLF'), { type: 'SK', subtype: '1LNR' });
  assert.deepEqual(resolveMeantType('KKr-NKK'), { type: 'NKK' });
  assert.deepEqual(resolveMeantType('mini-kut'), { type: 'MK' });
  assert.equal(resolveMeantType('LT-PIX'), null);
});

test('every retired spelling in NAMING.md resolves to its one name', () => {
  const retired: Record<string, string> = {
    KUT: 'KK', 'k-kut': 'KK', sK: 'SK', 'S-KUT': 'SK', 'short-kut': 'SK', LLF: 'SK',
    linefeel: 'SK', 'line feel': 'SK', mK: 'MK', 'M-KUT': 'MK', 'MICRO-KUT': 'MK',
    'm-kut': 'MK', 'Mini KUT': 'MK', 'mini-K': 'MK', KUPID: 'KUPID', 'k-kupid': 'KUPID',
    kkupid: 'KUPID',
  };
  for (const [spelling, code] of Object.entries(retired)) {
    assert.equal(resolveMeantType(spelling)?.type, code, spelling);
  }
});

// ── The Meant gate ───────────────────────────────────────────────────────────

const SHA_A = 'a'.repeat(64);
const SHA_B = 'b'.repeat(64);

function meant(overrides: Partial<MeantClone> = {}): MeantClone {
  return {
    authority: 'KKR_WORKING_COPY',
    meant_id: 'MEANT_000001',
    type: 'SK',
    subtype: 'HOOK',
    ssot: {
      clone_id: 'GPMCC_sK_000001',
      clone_sha256: SHA_A,
      lt_pix_id: 'LT-PIX_0001',
      authority_src_id: 'SRC_0001',
      parent_id: 'NKK_000001',
      parent_sha256: SHA_B,
      matched_by: 'object_id_and_sha256',
    },
    audio: { vocals: true, instrumentals: true, variant: 'VOCAL_MUSIC', url: null },
    tps: {
      intp: { start_seconds: 30, end_seconds: 38 },
      vtp: { start_seconds: 31, end_seconds: 37 },
    },
    parent_bounds: { start_seconds: 20, end_seconds: 60 },
    text_loops: ['TLR_01', 'TLR_02'],
    humanizing: 'HUMANIZED',
    tiers: {
      HUG: {
        strategies: [{ granularity: 'LINE', text: 'Lead with the hook line.' }],
        themes: ['Thinking of You'], emotions: ['warmth'], scenarios: ['Long Week'],
      },
      TUG: {
        strategies: [{ granularity: 'WORD', text: 'Stay.' }],
        themes: ['Friends'], emotions: [], scenarios: [],
      },
      BUG: {
        strategies: [{ granularity: 'PHRASE', text: 'Plain phrase, no framing.' }],
        themes: [], emotions: [], scenarios: [],
      },
    },
    ...overrides,
  };
}

const codes = (m: MeantClone) => validateMeant(m).map((v) => v.code);

test('a complete Meant working copy passes', () => {
  assert.deepEqual(validateMeant(meant()), []);
});

test('vocals and instrumentals are never lost', () => {
  assert.ok(codes(meant({ audio: { vocals: false, instrumentals: true, variant: 'VOCAL_MUSIC', url: null } }))
    .includes('VOCALS_LOST'));
  assert.ok(codes(meant({ audio: { vocals: true, instrumentals: false, variant: 'VOCAL_MUSIC', url: null } }))
    .includes('INSTRUMENTALS_LOST'));
  assert.ok(codes(meant({ audio: { vocals: true, instrumentals: true, variant: 'MUSIC_ONLY', url: null } }))
    .includes('NOT_FULL_AUDIO'));
});

test('full audio is never the full master', () => {
  const url = 'https://x.supabase.co/storage/v1/object/public/tracks/song.mp3';
  assert.ok(codes(meant({ audio: { vocals: true, instrumentals: true, variant: 'VOCAL_MUSIC', url } }))
    .includes('FORBIDDEN_SOURCE_AUDIO'));
});

test('identity is by hash and object id, never by title', () => {
  const base = meant();
  assert.ok(codes({ ...base, ssot: { ...base.ssot, parent_sha256: 'nope' } })
    .includes('MISSING_OR_INVALID_PARENT_SHA256'));
  assert.ok(codes({ ...base, ssot: { ...base.ssot, matched_by: 'title' as never } })
    .includes('TITLE_MATCHED'));
});

test('TPs and boundaries: VTP inside InTP, InTP inside the parent', () => {
  assert.ok(codes(meant({
    tps: { intp: { start_seconds: 30, end_seconds: 38 }, vtp: { start_seconds: 29, end_seconds: 37 } },
  })).includes('APPROVED_BOUNDARY_OUTSIDE_SOURCE_KK'));
  assert.ok(codes(meant({ parent_bounds: { start_seconds: 32, end_seconds: 60 } }))
    .includes('ESCAPES_PARENT_BOUNDS'));
});

test('HUMANIZED needs multiple Text Loops', () => {
  assert.ok(codes(meant({ text_loops: ['TLR_01'] })).includes('TOO_FEW_TEXT_LOOPS'));
  assert.deepEqual(codes(meant({ text_loops: ['TLR_01'], humanizing: 'LOOPING' })), []);
});

test('BUGs never use Themes, Emotions or Scenarios', () => {
  const base = meant();
  const bug = { ...base.tiers.BUG, themes: ['Friends'], emotions: ['joy'], scenarios: ['New Baby'] };
  const got = codes({ ...base, tiers: { ...base.tiers, BUG: bug } });
  assert.ok(got.includes('BUG_HAS_THEMES'));
  assert.ok(got.includes('BUG_HAS_EMOTIONS'));
  assert.ok(got.includes('BUG_HAS_SCENARIOS'));
});

test('HUGs and TUGs work with Themes, Emotions or Scenarios', () => {
  const base = meant();
  const tug = { ...base.tiers.TUG, themes: [] };
  assert.ok(codes({ ...base, tiers: { ...base.tiers, TUG: tug } }).includes('NO_SENTIMENT'));
});

test('all three tiers are required, each with a strategy at a valid granularity', () => {
  const base = meant();
  const { HUG, TUG } = base.tiers;
  assert.ok(codes({ ...base, tiers: { HUG, TUG } as never }).includes('TIER_MISSING'));
  const hug = { ...HUG, strategies: [{ granularity: 'SONG_SECTION' as const, text: 'Whole chorus.' }] };
  assert.ok(codes({ ...base, tiers: { ...base.tiers, HUG: hug } }).includes('GRANULARITY_NOT_FOR_TYPE'));
});

test('BUGs arrive on demand only', () => {
  assert.equal(canDeliverTier('BUG', 'user_request'), true);
  assert.equal(canDeliverTier('BUG', 'platform_suggestion'), false);
  assert.equal(canDeliverTier('BUG', 'follow_up'), false);
  assert.equal(canDeliverTier('BUG', 'scheduled'), false);
  assert.equal(canDeliverTier('HUG', 'platform_suggestion'), true);
});

// ── Platform conduct ─────────────────────────────────────────────────────────

test('the platform never sells: no action is a sale', () => {
  assert.equal(nextBestAction({}), 'GUIDE');
  assert.equal(nextBestAction({ leery: true }), 'GIVE_FREE');
  assert.equal(nextBestAction({ leery: true, hadFreeAlready: true }), 'GIVE_FREE');
  assert.equal(nextBestAction({ reportedIssue: true }), 'REPLACE_FREE');
  assert.equal(nextBestAction({ reportedIssue: true, askedToStop: true }), 'STEP_BACK');
});

test('the User / Recipient is always right', () => {
  for (const v of ['LOVE_IT', 'NOT_QUITE', 'WRONG_THEME', 'AUDIO_ISSUE', 'DOES_NOT_SAY_WHAT_I_MEAN', 'NO_THANKS'] as const) {
    const r = honorUserVerdict(v);
    assert.equal(r.accepted, true);
    assert.equal(r.recordAsVoc, true);
  }
  assert.equal(honorUserVerdict('AUDIO_ISSUE').action, 'REPLACE_FREE');
  assert.equal(honorUserVerdict('NO_THANKS').action, 'STEP_BACK');
});

test('sales-rep language is caught; guiding language is not', () => {
  assert.deepEqual(findSalesLanguage('Hear it again, or take the first one free.'), []);
  assert.deepEqual(findSalesLanguage('Guide to Purchase'), []);
  assert.ok(findSalesLanguage('Buy now — only 3 left!').length >= 2);
});

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : path.endsWith('.tsx') ? [path] : [];
  });
}

test('no app page uses sales-rep language', () => {
  for (const file of walk(join(ROOT, 'app'))) {
    assert.deepEqual(findSalesLanguage(readFileSync(file, 'utf8')), [], file);
  }
});

// ── Draft catalog tables ─────────────────────────────────────────────────────

const MEANTS_SQL = readFileSync(
  join(ROOT, 'reference', 'NOT-DEPLOYED', 'meants-schema', '20261020000100_meants_catalog.sql'),
  'utf8',
);

test('meant_types seeds every Element Type exactly as the code catalog has it', () => {
  const rows = [...MEANTS_SQL.matchAll(
    /^\s+\('([A-Z_]+)',\s+'(KKr-[A-Z_]+)',\s+'([^']+)',\s+(null|'[^']+'),\s+(null|'[^']+'),\s+'([A-Z_]+)',\s+array\[([^\]]+)\]\)/gm,
  )];
  assert.equal(rows.length, MEANT_TYPE_CODES.length);

  for (const [, code, kkr, name, parent, table, status, grans] of rows) {
    const type = MEANT_TYPES[code as (typeof MEANT_TYPE_CODES)[number]];
    assert.ok(type, code);
    assert.equal(kkr, type.kkrCode);
    assert.equal(name, type.name);
    assert.equal(parent === 'null' ? null : parent.slice(1, -1), type.parent);
    assert.equal(table === 'null' ? null : table.slice(1, -1), type.table);
    assert.equal(status, type.status);
    assert.deepEqual(grans.split(',').map((g) => g.trim().slice(1, -1)), [...type.granularities]);
  }
});

test('the Meant tables enforce the tier and full-audio rules in SQL too', () => {
  for (const name of [
    'meant_tiers_bug_no_sentiment', 'meant_tiers_hug_tug_sentiment', 'meant_tiers_triggers',
    'meants_vtp_ordered_and_inside_intp', 'meants_inside_parent_bounds', 'meants_text_loops_gate',
  ]) {
    assert.ok(MEANTS_SQL.includes(name), name);
  }
  assert.match(MEANTS_SQL, /has_vocals\s+boolean not null check \(has_vocals\)/);
  assert.match(MEANTS_SQL, /has_instrumentals\s+boolean not null check \(has_instrumentals\)/);
  assert.match(MEANTS_SQL, /check \(variant = 'VOCAL_MUSIC'\)/);
  assert.match(MEANTS_SQL, /array\['user_request'\]\)/);
});
