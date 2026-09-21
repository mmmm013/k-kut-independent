/**
 * KUT Family (KF) — shared domain types.
 *
 * The KUT Family is the complete set of delivery units G Putnam Music issues
 * against a PIX (master track). Every surface in this app — the PIX inventory,
 * the family inventory, the HUG delivery gate and the bot moments feed — must
 * agree on these four unit types and on how they are gated.
 *
 *   KUT    — exact contiguous section audio (the K-KUT invention)
 *   mK     — mini-KUT text micro-assets, audio resolved from a parent KUT
 *   LLF    — LineFeel, a single lyric line delivered as audio
 *   KUPID  — K-kUpId, a KUT curated and signed for a romance level
 */

/** The four KUT Family unit types. Order here is the canonical display order. */
export const KF_UNIT_TYPES = ['KUT', 'mK', 'LLF', 'KUPID'] as const;

export type KfUnitType = (typeof KF_UNIT_TYPES)[number];

/** Canonical GPM section order. Sections may only be sold in this order (ASCAP rule). */
export const SECTION_ORDER = [
  'Intro', 'V1', 'Pre1', 'Ch1', 'V2', 'Pre2', 'Ch2', 'BR', 'Ch3', 'Outro',
] as const;

export type SectionTag = (typeof SECTION_ORDER)[number];

/** Audio QC verdict. Nothing leaves the silo until this is `pass`. */
export type QcStatus = 'pass' | 'fail' | 'pending';

/** Redeemable code kinds tracked in `k_kut_codes`. */
export type ItemType = 'STI' | 'BTI' | 'FP';

/** Audio variants a KUT section is rendered in. */
export type Variant = 'VOCAL_MUSIC' | 'MUSIC_ONLY';

/** The eight mini-KUT harvest types (8/12/20 rule). */
export const MK_TYPES = [
  'mK-verb', 'mK-noun', 'mK-adj', 'mK-adv',
  'mK-pron', 'mK-cmpnd', 'mK-phrase', 'mK-hook',
] as const;

export type MkType = (typeof MK_TYPES)[number];

/** K-kUpId romance levels, 1–5. */
export const KUPID_LEVELS = [
  { level: 1, label: 'Interest', code: 'INT', color: '#C8A882' },
  { level: 2, label: 'Date',     code: 'DAT', color: '#D4A017' },
  { level: 3, label: 'Love',     code: 'LUV', color: '#E07B54' },
  { level: 4, label: 'Sex',      code: 'SEX', color: '#C0392B' },
  { level: 5, label: 'Forever',  code: 'FVR', color: '#8B5CF6' },
] as const;

export type KupidLevel = (typeof KUPID_LEVELS)[number]['level'];

/**
 * One row of the KUT Family inventory, normalized across all four unit types.
 * This is the shape `/api/kf/inventory` returns and `/kf` renders.
 */
export interface KfInventoryItem {
  /** Stable id used to build the playback route. */
  id: string;
  unit_type: KfUnitType;
  /** PIX (master track) this unit was cut from, when known. */
  pix_pck_id: string | null;
  /** Section or section-combo this unit covers, e.g. "Ch1" or "V1 → Pre1". */
  structure_tag: string | null;
  variant: string | null;
  audio_qc_status: QcStatus;
  duration_ms: number | null;
  /** Public-safe label. Never leaks a source/PIX filename. */
  label: string;
  /** Route that plays this unit, or null when it is not playable. */
  href: string | null;
  /** True only when QC passed, audio resolves and nothing blocks delivery. */
  playable: boolean;
  /** Why an unplayable unit is unplayable — shown to operators, not fans. */
  blocked_reason: string | null;
}

/** Per-unit-type rollup for the family inventory header. */
export interface KfFamilyCount {
  unit_type: KfUnitType;
  total: number;
  qc_pass: number;
  playable: number;
}

/** Full `/api/kf/inventory` payload. */
export interface KfInventoryResponse {
  ok: boolean;
  /** PIX filter that was applied, or null for the whole family. */
  pix_pck_id: string | null;
  totals: {
    total: number;
    qc_pass: number;
    playable: number;
  };
  families: KfFamilyCount[];
  items: KfInventoryItem[];
  /** Tables that could not be read (missing or RLS-blocked). Never fatal. */
  unavailable: string[];
}
