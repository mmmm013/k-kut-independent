/**
 * Meants — the KKr working-copy catalog of every GPM Element Type.
 *
 * "Meant" is the owner's collective term for every Element. This file is a
 * STRICT clone: every Element Type, attribute, constraint and enum value found
 * in this repository is copied here verbatim, with the file it came from.
 * Nothing is renamed, dropped or "fixed" in the clone. Where upstream is known
 * to be wrong (GOVERNANCE.md, reference/NOT-DEPLOYED/README.md) the attribute
 * is still cloned and carries an `upstreamFlag` saying so.
 *
 * This is types and rules only. It creates no rows, touches no database and
 * originates nothing: GPMC stays the write authority. The BLK/KK
 * text-generation freeze holds nothing (owner, 2026-10-23: the only hold is
 * Halloween, until Nov 2).
 */

import { KUPID_LEVELS, MK_TYPES, SECTION_ORDER, SK_SUBTYPES } from '../types';

const SCHEMA = 'reference/NOT-DEPLOYED/kf-schema';
const CORE = `${SCHEMA}/20260921000100_kut_family_schema.sql`;
const THEMES = `${SCHEMA}/20260921000400_kut_family_themes.sql`;
const LINEAGE = `${SCHEMA}/20260921000500_kf_governed_lineage.sql`;
const SK_TAX = `${SCHEMA}/20260921000600_sk_taxonomy.sql`;

// ── Attributes ───────────────────────────────────────────────────────────────

export type AttributeKind =
  | 'text' | 'uuid' | 'integer' | 'smallint' | 'numeric' | 'boolean'
  | 'timestamptz' | 'enum';

export interface MeantAttribute {
  name: string;
  kind: AttributeKind;
  required: boolean;
  /** Allowed values, verbatim, when the source constrains them. */
  values?: readonly string[];
  /** The source constraint, verbatim or as close as SQL allows. */
  constraint?: string;
  /** File the attribute was cloned from. */
  source: string;
  /** Set when upstream documents this attribute as wrong. Cloned anyway. */
  upstreamFlag?: string;
}

const attr = (
  name: string,
  kind: AttributeKind,
  source: string,
  extra: Partial<MeantAttribute> = {},
): MeantAttribute => ({ name, kind, required: false, source, ...extra });

const QC = ['pass', 'fail', 'pending'] as const;
const VARIANTS = ['VOCAL_MUSIC', 'MUSIC_ONLY'] as const;
const SHA256 = "source_audio_sha256 ~ '^[0-9a-f]{64}$'";
const BOUNDS = 'start_seconds >= 0 and end_seconds > start_seconds (or both null)';
const NOT_SOURCE = 'not kf_is_forbidden_source_url(url)';

/** id, slug, label, created_at — on every table. */
const identity = (source: string): MeantAttribute[] => [
  attr('id', 'uuid', source, { required: true, constraint: 'primary key default gen_random_uuid()' }),
  attr('slug', 'text', source, { constraint: 'unique' }),
  attr('public_label', 'text', source),
  attr('created_at', 'timestamptz', source, { required: true, constraint: 'default now()' }),
];

/** The silo gate columns — identical on every container. */
const gates = (audioColumn: string, source: string): MeantAttribute[] => [
  attr(audioColumn, 'text', source, { constraint: NOT_SOURCE }),
  attr('audio_qc_status', 'enum', source, { required: true, values: QC, constraint: "default 'pending'" }),
  attr('approved_for_hug', 'boolean', source, {
    required: true,
    constraint: "default false; approved_for_hug = false or audio_qc_status = 'pass'",
    upstreamFlag: 'Audio boundary pass is not approval (GOVERNANCE.md §5b).',
  }),
];

const duration = (source: string) =>
  attr('duration_ms', 'integer', source, { constraint: 'duration_ms is null or duration_ms > 0' });

/** keenness_score and emotion_level, cloned with their upstream defects. */
const legacyScoring = (source: string): MeantAttribute[] => [
  attr('keenness_score', 'smallint', source, {
    constraint: 'keenness_score between 0 and 100',
    upstreamFlag: 'Numeric-only shortcut that MGS forbids.',
  }),
  attr('emotion_level', 'text', source, {
    upstreamFlag: 'Collapses sentiment, emotion, mood and presentation into one field.',
  }),
];

const theme = (source: string) =>
  attr('theme', 'enum', source, {
    values: ['love', 'apology', 'gratitude', 'energy', 'hurt', 'hope', 'peace'],
    upstreamFlag: 'Theme as a column conflates theme with identity; 7 modelled vs 38 Themes live.',
  });

/** Lineage identity, added to every object by the governed-lineage migration. */
const lineage = (source: string): MeantAttribute[] => [
  attr('lt_pix_id', 'text', source),
  attr('authority_src_id', 'text', source),
  attr('source_audio_path', 'text', source),
  attr('source_audio_sha256', 'text', source, { constraint: SHA256 }),
];

const bounds = (source: string): MeantAttribute[] => [
  attr('start_seconds', 'numeric', source, { constraint: BOUNDS }),
  attr('end_seconds', 'numeric', source, { constraint: BOUNDS }),
];

const structureTag = (source: string, required = false) =>
  attr('structure_tag', 'text', source, {
    required,
    constraint: 'one or more contiguous sections in canonical order',
  });

const variant = (source: string, required = false) =>
  attr('variant', 'enum', source, {
    required,
    values: VARIANTS,
    constraint: required ? "default 'VOCAL_MUSIC'" : undefined,
  });

const pixParent = (source: string, required = true) =>
  attr('pix_pck_id', 'text', source, { required, constraint: 'references pix_pck(id)' });

// ── Strategy granularity: from 1-word up to Song Section ─────────────────────

/** The levels a KKr strategy can be written at, smallest first. */
export const STRATEGY_GRANULARITIES = [
  'WORD', 'TERM', 'PHRASE', 'LINE', 'LINE_SET', 'SONG_SECTION',
] as const;

export type StrategyGranularity = (typeof STRATEGY_GRANULARITIES)[number];

// ── Product Tiers: a Meant IS a HUG, a TUG or a BUG ──────────────────────────

export const PRODUCT_TIERS = ['HUG', 'TUG', 'BUG'] as const;

export type ProductTier = (typeof PRODUCT_TIERS)[number];

/**
 * The BUG forms (owner, 2026-10-20): TRM (one word), PHRZ (fewer than 4
 * words), XCLM and VSND. Everything else below a section is a TUG.
 */
export const BUG_FORMS = ['TRM', 'PHRZ', 'XCLM', 'VSND'] as const;

/** A phrase of this many words or fewer is a BUG; one word longer is a TUG. */
export const BUG_PHRASE_MAX_WORDS = 3;

/** Tier of a phrase-sized cut by its word count. One word is a TRM, a BUG. */
export function phraseTier(words: number): 'BUG' | 'TUG' {
  return words <= BUG_PHRASE_MAX_WORDS ? 'BUG' : 'TUG';
}

// ── Element Types ────────────────────────────────────────────────────────────

/** Every Element Type, cloned. LT-PIX is the SSOT source, not a Meant. */
export const MEANT_TYPE_CODES = ['KK', 'DKK', 'NKK', 'NAKED_SK', 'SK', 'MK', 'KUPID'] as const;

export type MeantTypeCode = (typeof MEANT_TYPE_CODES)[number];

export type CloneStatus =
  /** Type and attributes cloned from a schema in this repo. */
  | 'CLONED'
  /** Type is evidenced upstream but no schema exists here; only lineage identity is cloned. */
  | 'CLONED_IDENTITY_ONLY'
  /** Type exists but its place in the lineage is unresolved upstream. */
  | 'CLONED_PARENT_UNRESOLVED';

export interface MeantSubtype {
  code: string;
  label?: string;
  granularity: StrategyGranularity | null;
  upstreamFlag?: string;
}

export interface MeantType {
  code: MeantTypeCode;
  /** The KKr working-copy code. */
  kkrCode: `KKr-${MeantTypeCode}`;
  name: string;
  /** Lineage parent under the capture-room LOCK, or null when unresolved. */
  parent: MeantTypeCode | 'LT-PIX' | null;
  /** Source table, or null when no schema exists in this repo. */
  table: string | null;
  status: CloneStatus;
  /** Granularities this type's strategies may be written at. */
  granularities: readonly StrategyGranularity[];
  attributes: readonly MeantAttribute[];
  subtypes: readonly MeantSubtype[];
  /**
   * The Product Tier this type is, when it is a Meant: KK = HUG, sK = TUG,
   * mK = BUG (owner, 2026-10-20; matches gpmc_sk_form_factor_ee "sK/TUG
   * layer; never mK/BUG"). Null = a lineage layer that is never delivered
   * itself, or (K-kUpId) a kind whose tier is not settled.
   */
  tier: ProductTier | null;
  evidence: string;
  upstreamFlag?: string;
}

/** sK subtype → strategy granularity. Default chosen here; upstream gives none. */
const SK_GRANULARITY: Record<(typeof SK_SUBTYPES)[number], StrategyGranularity | null> = {
  TWST: 'LINE', HOOK: 'LINE', MTa4: 'PHRASE', PHRZ: 'PHRASE', PHRZ_LNG: 'PHRASE',
  SAYING: 'PHRASE', ALTR: 'PHRASE', '1LNR': 'LINE', CNTRST: 'LINE_SET', OXY: 'TERM',
  CLSHA: 'PHRASE', LNTRIO: 'LINE_SET', LNPR: 'LINE_SET', '3RHYM': 'LINE_SET',
  '4RHYM': 'LINE_SET', TRM: 'TERM', TERM_CUT: 'TERM', WORD_CUT: 'WORD', XCLM: 'WORD',
  OTHER: null,
};

/** Upstream says these are mK forms, not sK forms. Kept in sK, flagged. */
const MK_FORMS_IN_SK = new Set(['TRM', 'TERM_CUT', 'XCLM']);

const MK_GRANULARITY: Record<(typeof MK_TYPES)[number], StrategyGranularity> = {
  'mK-verb': 'WORD', 'mK-noun': 'WORD', 'mK-adj': 'WORD', 'mK-adv': 'WORD',
  'mK-pron': 'WORD', 'mK-cmpnd': 'TERM', 'mK-phrase': 'PHRASE', 'mK-hook': 'LINE',
};

const KK_ATTRIBUTES: MeantAttribute[] = [
  ...identity(CORE),
  pixParent(CORE),
  structureTag(CORE, true),
  variant(CORE, true),
  attr('storage_path', 'text', CORE),
  ...gates('kut_audio_url', CORE),
  duration(CORE),
  ...legacyScoring(CORE),
  theme(THEMES),
  ...lineage(LINEAGE),
  ...bounds(LINEAGE),
];

const NKK_ATTRIBUTES: MeantAttribute[] = [
  ...identity(LINEAGE),
  attr('k_kut_asset_id', 'uuid', LINEAGE, {
    required: true,
    constraint: 'references k_kut_assets(id)',
    upstreamFlag: 'Hangs NKK off KK; the LOCK puts DKK between them.',
  }),
  pixParent(LINEAGE, false),
  ...lineage(LINEAGE),
  structureTag(LINEAGE),
  variant(LINEAGE),
  theme(LINEAGE),
  ...bounds(LINEAGE),
  ...gates('nkk_audio_url', LINEAGE),
  duration(LINEAGE),
  ...legacyScoring(LINEAGE),
];

const SK_ATTRIBUTES: MeantAttribute[] = [
  ...identity(SK_TAX),
  pixParent(SK_TAX),
  attr('nkk_asset_id', 'uuid', SK_TAX, { constraint: 'references nkk_assets(id)' }),
  attr('k_kut_asset_id', 'uuid', SK_TAX, { constraint: 'references k_kut_assets(id); provenance only' }),
  attr('sk_subtype', 'enum', SK_TAX, { required: true, values: SK_SUBTYPES, constraint: "default 'OTHER'" }),
  structureTag(SK_TAX),
  variant(SK_TAX),
  theme(SK_TAX),
  attr('line_text', 'text', SK_TAX),
  ...bounds(SK_TAX),
  ...lineage(SK_TAX),
  ...gates('sk_audio_url', SK_TAX),
  duration(SK_TAX),
  ...legacyScoring(SK_TAX),
  attr('text_loop_run_id', 'text', SK_TAX),
];

const MK_ATTRIBUTES: MeantAttribute[] = [
  ...identity(CORE),
  pixParent(CORE),
  attr('k_kut_asset_id', 'uuid', CORE, { constraint: 'references k_kut_assets(id); provenance only' }),
  attr('nkk_asset_id', 'uuid', LINEAGE, {
    constraint: 'references nkk_assets(id)',
    upstreamFlag: 'The LOCK says mK derives from naked sK, which has no table.',
  }),
  attr('mk_type', 'enum', CORE, { required: true, values: MK_TYPES }),
  attr('content', 'text', CORE),
  structureTag(CORE),
  ...gates('mk_audio_url', CORE),
  ...legacyScoring(CORE),
  theme(THEMES),
  ...lineage(LINEAGE),
];

const KUPID_ATTRIBUTES: MeantAttribute[] = [
  ...identity(CORE),
  pixParent(CORE),
  attr('k_kut_asset_id', 'uuid', CORE, { constraint: 'references k_kut_assets(id)' }),
  structureTag(CORE),
  variant(CORE),
  attr('romance_level', 'smallint', CORE, { required: true, constraint: 'romance_level between 1 and 5' }),
  attr('level_code', 'enum', CORE, {
    required: true,
    values: KUPID_LEVELS.map((l) => l.code),
    constraint: 'level and code are two spellings of the same thing; they may not disagree',
  }),
  attr('gift_note', 'text', CORE),
  attr('gifted_by', 'text', CORE),
  attr('signature', 'text', CORE),
  ...gates('kupid_audio_url', CORE),
  duration(CORE),
  ...legacyScoring(CORE),
  theme(THEMES),
  ...lineage(LINEAGE),
];

/** Objects with no schema here carry the lineage identity every object must have. */
const IDENTITY_ONLY: MeantAttribute[] = [
  attr('id', 'text', 'GOVERNANCE.md §2', { required: true }),
  ...lineage('GOVERNANCE.md §3').map((a) => ({ ...a, required: true })),
  ...bounds('GOVERNANCE.md §2'),
];

export const MEANT_TYPES: Record<MeantTypeCode, MeantType> = {
  KK: {
    code: 'KK',
    tier: 'HUG',
    kkrCode: 'KKr-KK',
    name: 'K-KUT',
    parent: 'LT-PIX',
    table: 'k_kut_assets',
    status: 'CLONED',
    granularities: ['SONG_SECTION'],
    attributes: KK_ATTRIBUTES,
    subtypes: SECTION_ORDER.map((code) => ({ code, granularity: 'SONG_SECTION' as const })),
    evidence: `${CORE}; ${LINEAGE}; GOVERNANCE.md §2, §6`,
  },
  DKK: {
    code: 'DKK',
    tier: null,
    kkrCode: 'KKr-DKK',
    name: 'DKK',
    parent: 'KK',
    table: null,
    status: 'CLONED_IDENTITY_ONLY',
    granularities: ['SONG_SECTION'],
    attributes: IDENTITY_ONLY,
    subtypes: [],
    evidence: 'GOVERNANCE.md §2 — e.g. DKK_KK_PARENT_AWAKE_BLK1_1dd6609ea3aa794a',
  },
  NKK: {
    code: 'NKK',
    tier: null,
    kkrCode: 'KKr-NKK',
    name: 'NKK',
    parent: 'DKK',
    table: 'nkk_assets',
    status: 'CLONED',
    granularities: ['SONG_SECTION', 'LINE_SET', 'LINE'],
    attributes: NKK_ATTRIBUTES,
    subtypes: [],
    evidence: `${LINEAGE}; GOVERNANCE.md §2 — e.g. NKK_000001`,
  },
  NAKED_SK: {
    code: 'NAKED_SK',
    tier: null,
    kkrCode: 'KKr-NAKED_SK',
    name: 'naked sK',
    parent: 'NKK',
    table: null,
    status: 'CLONED_IDENTITY_ONLY',
    granularities: ['LINE_SET', 'LINE', 'PHRASE', 'TERM', 'WORD'],
    attributes: IDENTITY_ONLY,
    subtypes: [],
    evidence: 'GOVERNANCE.md §2 — e.g. NAKED_sK_000001',
  },
  SK: {
    code: 'SK',
    tier: 'TUG',
    kkrCode: 'KKr-SK',
    name: 'TUG',
    parent: 'NKK',
    table: 'sk_assets',
    status: 'CLONED',
    granularities: ['LINE_SET', 'LINE', 'PHRASE', 'TERM', 'WORD'],
    attributes: SK_ATTRIBUTES,
    subtypes: [
      ...SK_SUBTYPES.map((code) => ({
        code,
        label: code === '1LNR' ? 'one-liner (LineFeel / LLF)' : undefined,
        granularity: SK_GRANULARITY[code],
        upstreamFlag: MK_FORMS_IN_SK.has(code)
          ? 'Upstream calls this an mK form, not an sK form.'
          : code === 'PHRZ'
            ? `Under ${BUG_PHRASE_MAX_WORDS + 1} words a phrase is a BUG (mK PHRZ), not a TUG.`
            : undefined,
      })),
      // Live gpmc_sk_form_factor_ee forms the reference schema never had.
      { code: 'IDIOM', label: 'idiom', granularity: 'PHRASE' as const },
    ],
    evidence: `${SK_TAX}; GOVERNANCE.md §5`,
  },
  MK: {
    code: 'MK',
    tier: 'BUG',
    kkrCode: 'KKr-MK',
    name: 'mini-KUT',
    parent: 'NAKED_SK',
    table: 'm_kut_assets',
    status: 'CLONED',
    granularities: ['LINE', 'PHRASE', 'TERM', 'WORD'],
    attributes: MK_ATTRIBUTES,
    subtypes: [
      ...MK_TYPES.map((code) => ({ code, granularity: MK_GRANULARITY[code] })),
      // Live gpmc_mk_form_factor_ee forms (the tinyKUT TRMZ / EXCLM / SNDS classes).
      { code: 'TRM', label: 'term', granularity: 'TERM' as const },
      { code: 'XCLM', label: 'exclamation', granularity: 'WORD' as const },
      { code: 'VSND', label: 'vocal sound', granularity: 'WORD' as const },
      // Owner, 2026-10-20: a phrase of fewer than 4 words is a BUG.
      { code: 'PHRZ', label: 'phrase, fewer than 4 words', granularity: 'PHRASE' as const },
    ],
    evidence: `${CORE}; GOVERNANCE.md §2 LOCK`,
  },
  KUPID: {
    code: 'KUPID',
    tier: null,
    kkrCode: 'KKr-KUPID',
    name: 'K-kUpId',
    parent: null,
    table: 'kupid_assets',
    status: 'CLONED_PARENT_UNRESOLVED',
    granularities: ['SONG_SECTION', 'LINE_SET', 'LINE'],
    attributes: KUPID_ATTRIBUTES,
    subtypes: KUPID_LEVELS.map((l) => ({ code: l.code, label: l.label, granularity: null })),
    evidence: `${CORE}; GOVERNANCE.md §5`,
    upstreamFlag: 'Whether K-kUpId is a KK or an sK is unresolved upstream; not guessed.',
  },
};

/** Legacy spellings that resolve to a cloned type, never a separate one. */
export const MEANT_TYPE_ALIASES: Record<string, { type: MeantTypeCode; subtype?: string }> = {
  LLF: { type: 'SK', subtype: '1LNR' },
  LINEFEEL: { type: 'SK', subtype: '1LNR' },
  KUT: { type: 'KK' },
  'K-KUT': { type: 'KK' },
  'S-KUT': { type: 'SK' },
  'SHORT-KUT': { type: 'SK' },
  SHORTKUT: { type: 'SK' },
  // The public names. Tier follows kind, so each tier names exactly one type.
  HUG: { type: 'KK' },
  TUG: { type: 'SK' },
  BUG: { type: 'MK' },
  'M-KUT': { type: 'MK' },
  'MICRO-KUT': { type: 'MK' },
  'MINI-KUT': { type: 'MK' },
  'MINI KUT': { type: 'MK' },
  'MINI-K': { type: 'MK' },
  'LINE FEEL': { type: 'SK', subtype: '1LNR' },
  'K-KUPID': { type: 'KUPID' },
  KKUPID: { type: 'KUPID' },
  // Live slds_kut_type_registry codes.
  // Owner, 2026-10-20: the live MINI_KUT type (once labelled ShortKUT) is a
  // TUG at 4.99. Single-word cuts are TRMs, which are BUGs.
  MINI_KUT: { type: 'SK' },
  LFL: { type: 'SK', subtype: '1LNR' },
  LINEPAIR: { type: 'SK', subtype: 'LNPR' },
  LPR: { type: 'SK', subtype: 'LNPR' },
  // Live PHRZ is the BUG phrase. A phrase of 4+ words is a TUG (SK PHRZ_LNG).
  PHRZ: { type: 'MK', subtype: 'PHRZ' },
  RIME: { type: 'SK' },
  TRMZ: { type: 'MK', subtype: 'TRM' },
  EXCLM: { type: 'MK', subtype: 'XCLM' },
  SNDS: { type: 'MK', subtype: 'VSND' },
  TINYKUT: { type: 'MK' },
};

/** A Meant's Product Tier from its type. Null = not a deliverable Meant. */
export function tierOf(code: MeantTypeCode): ProductTier | null {
  return MEANT_TYPES[code].tier;
}

/** Resolve a code or legacy spelling to its cloned type. */
export function resolveMeantType(code: string): { type: MeantTypeCode; subtype?: string } | null {
  const upper = code.trim().toUpperCase().replace(/^KKR-/, '');
  if ((MEANT_TYPE_CODES as readonly string[]).includes(upper)) return { type: upper as MeantTypeCode };
  return MEANT_TYPE_ALIASES[upper] ?? null;
}

/** Walk a type's lineage up to LT-PIX. Stops at an unresolved parent. */
export function lineageOf(code: MeantTypeCode): Array<MeantTypeCode | 'LT-PIX'> {
  const chain: Array<MeantTypeCode | 'LT-PIX'> = [];
  let parent = MEANT_TYPES[code].parent;
  while (parent) {
    chain.push(parent);
    if (parent === 'LT-PIX') break;
    parent = MEANT_TYPES[parent].parent;
  }
  return chain;
}
