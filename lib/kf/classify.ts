/**
 * KUT Family (KF) — classification and gating helpers.
 *
 * Single source of truth for "what kind of unit is this row, and may it play?".
 * The HUG delivery route, the bot moments feed and the KF inventory all call
 * these so a unit can never be classified one way on one surface and another
 * way somewhere else.
 */

import {
  KfUnitType,
  QcStatus,
  SECTION_ORDER,
  Variant,
} from './types';

/** Columns a unit-type guess may be drawn from, most specific first. */
const TYPE_HINT_COLUMNS = [
  'delivery_unit_type',
  'unit_type',
  'kut_type',
  'type',
  'asset_type',
  'title',
  'description',
] as const;

/** Columns that may hold an approved, public-safe audio URL, most specific first. */
const AUDIO_URL_COLUMNS = [
  'delivery_audio_url',
  'kut_audio_url',
  'mk_audio_url',
  'llf_audio_url',
  'kupid_audio_url',
  'approved_audio_url',
] as const;

/** Columns that may hold a stable public identifier, most specific first. */
const ID_COLUMNS = ['id', 'kut_id', 'slug', 'key', 'uuid', 'public_id'] as const;

type Row = Record<string, unknown>;

function hintText(row: Row): string {
  return TYPE_HINT_COLUMNS
    .map((column) => row[column])
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

/** Exact-match lookup for a row that already states its unit type. */
const EXPLICIT_UNIT_TYPES: Record<string, KfUnitType> = {
  kut: 'KUT',
  'k-kut': 'KUT',
  mk: 'mK',
  'm-kut': 'mK',
  'mini-kut': 'mK',
  llf: 'LLF',
  linefeel: 'LLF',
  kupid: 'KUPID',
  'k-kupid': 'KUPID',
};

/**
 * Classify a KUT SSOT row into one of the four KUT Family unit types.
 *
 * An explicit `delivery_unit_type` / `unit_type` / `kut_type` wins outright —
 * a row that states what it is is never reclassified by a substring in its
 * title. Only when no column states it do we fall back to matching hints.
 * Falls back to `KUT`, the broadest unit, when nothing matches at all.
 */
export function classifyUnitType(row: Row): KfUnitType {
  for (const column of ['delivery_unit_type', 'unit_type', 'kut_type'] as const) {
    const declared = String(row[column] ?? '').toLowerCase().trim();
    const explicit = EXPLICIT_UNIT_TYPES[declared];
    if (explicit) return explicit;
  }

  const raw = hintText(row);

  if (raw.includes('llf') || raw.includes('linefeel') || raw.includes('line feel')) {
    return 'LLF';
  }

  if (raw.includes('kupid') || raw.includes('k-kupid') || raw.includes('kkupid')) {
    return 'KUPID';
  }

  if (raw.includes('mk') || raw.includes('mini')) {
    return 'mK';
  }

  return 'KUT';
}

/** Fan-facing name for a unit type. Never reveals the underlying source track. */
export function publicPhrase(unit: KfUnitType): string {
  switch (unit) {
    case 'LLF':
      return 'LineFeel option';
    case 'KUPID':
      return 'K-kUpId option';
    case 'mK':
      return 'Mini KUT option';
    default:
      return 'KUT option';
  }
}

/** Short display label for a unit type, for chips and table headers. */
export function unitLabel(unit: KfUnitType): string {
  switch (unit) {
    case 'LLF':
      return 'LineFeel';
    case 'KUPID':
      return 'K-kUpId';
    case 'mK':
      return 'mini-KUT';
    default:
      return 'K-KUT';
  }
}

/** Accent colour per unit type, matching the palette used across the app. */
export function unitColor(unit: KfUnitType): string {
  switch (unit) {
    case 'LLF':
      return '#8B5CF6';
    case 'KUPID':
      return '#E07B54';
    case 'mK':
      return '#C8A882';
    default:
      return '#D4A017';
  }
}

/** Playback route for a unit, or null when the unit type has no player. */
export function unitHref(unit: KfUnitType, id: string): string | null {
  if (!id) return null;

  switch (unit) {
    case 'LLF':
      return `/llf/${encodeURIComponent(id)}`;
    case 'KUPID':
      return `/kupid/${encodeURIComponent(id)}`;
    case 'mK':
      return `/mkut/${encodeURIComponent(id)}`;
    default:
      return `/k/${encodeURIComponent(id)}`;
  }
}

/** First non-empty public identifier on a row, or null. */
export function safeId(row: Row): string | null {
  for (const column of ID_COLUMNS) {
    const value = row[column];
    if (value) return String(value);
  }
  return null;
}

/** First non-empty approved audio URL on a row, or an empty string. */
export function resolveAudioUrl(row: Row): string {
  for (const column of AUDIO_URL_COLUMNS) {
    const value = row[column];
    if (typeof value === 'string' && value) return value;
  }
  return '';
}

/**
 * Reject any URL that points at PIX / source / full-track audio.
 *
 * This is the KUT SSOT safety gate: delivery units may only ever play approved
 * KUT, mK, LLF or K-kUpId renders. A non-string is rejected outright so a
 * missing or malformed column can never fall through as "allowed".
 */
export function isForbiddenSourceUrl(value: unknown): boolean {
  if (typeof value !== 'string') return true;

  const lower = value.toLowerCase();

  return (
    lower.includes('/tracks/') ||
    lower.includes('pix') ||
    lower.includes('gpmc') ||
    lower.includes('source') ||
    lower.includes('flagship') ||
    lower.includes('full') ||
    lower.includes('a%20love%20like%20that') ||
    lower.includes('a love like that')
  );
}

/** Normalize any QC column value to the three states the silo gate recognizes. */
export function normalizeQc(value: unknown): QcStatus {
  const raw = String(value ?? '').toLowerCase().trim();

  if (raw === 'pass' || raw === 'passed' || raw === 'ok') return 'pass';
  if (raw === 'fail' || raw === 'failed') return 'fail';
  return 'pending';
}

/**
 * Explicit disapproval check. Only a literal `false` blocks — a missing column
 * means "not yet decided", which the QC gate handles separately.
 */
export function isDisapprovedForHug(row: Row): boolean {
  return (
    row.approved_for_hug === false ||
    row.hug_approved === false ||
    row.approved === false
  );
}

/** Public-safe delivery note for a HUG, never falling back to internal text. */
export function safeDeliveryNote(row: Row): string {
  if (row.public_label) return String(row.public_label);
  if (row.public_phrase) return String(row.public_phrase);
  if (row.delivery_note) return String(row.delivery_note);
  if (row.description) return 'KUT-authorized delivery';
  return 'KUT-authorized HUG delivery';
}

// ── Section / variant display ────────────────────────────────────────────────

const VARIANT_LABEL: Record<string, string> = {
  VOCAL_MUSIC: 'Vocal + Music',
  MUSIC_ONLY: 'Music Only',
  vocal_music: 'Vocal + Music',
  music_only: 'Music Only',
  vocal: 'Vocal + Music',
  instrumental: 'Music Only',
};

export function variantLabel(variant: string | null | undefined): string {
  if (!variant) return '—';
  return VARIANT_LABEL[variant] ?? variant;
}

export function isVocalVariant(variant: string | null | undefined): boolean {
  return String(variant ?? '').toLowerCase().includes('vocal');
}

export const VARIANTS: Variant[] = ['VOCAL_MUSIC', 'MUSIC_ONLY'];

/**
 * Sort key for a structure_tag, by its earliest canonical section.
 * Delimiters seen in the wild: space, arrow, hyphen. Unknown tags sort last.
 */
export function sectionSortKey(tag: string): number {
  const parts = tag.split(/[\s→\-]+/);
  for (const part of parts) {
    const idx = (SECTION_ORDER as readonly string[]).indexOf(part.trim());
    if (idx !== -1) return idx;
  }
  return SECTION_ORDER.length;
}

/** mm:ss from a millisecond duration. */
export function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
