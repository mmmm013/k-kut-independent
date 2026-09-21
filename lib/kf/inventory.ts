/**
 * KUT Family (KF) — inventory builder.
 *
 * Reads every KUT Family table and normalizes the rows into one
 * `KfInventoryItem[]`, applying the same gate to all four unit types:
 *
 *   1. Audio QC must be `pass` (the silo gate).
 *   2. The resolved audio URL must not point at PIX / source / full-track audio.
 *   3. KUT units additionally need an active redeemable code.
 *
 * Every table read is best-effort: a table that does not exist yet, or that RLS
 * hides from this client, is reported in `unavailable` rather than failing the
 * whole inventory. Partial inventory is useful; a 500 is not.
 */

import {
  KF_THEMES,
  KF_UNIT_TYPES,
  KfFamilyCount,
  KfInventoryItem,
  KfInventoryResponse,
  KfTheme,
  KfThemeCoverage,
  KfUnitType,
  THEME_META,
} from './types';
import {
  classifyUnitType,
  isForbiddenSourceUrl,
  normalizeQc,
  resolveAudioUrl,
  resolveTheme,
  unitHref,
  unitLabel,
} from './classify';

/** Minimal structural type so this works with both browser and server clients. */
interface QueryableClient {
  from(table: string): any;
}

type Row = Record<string, any>;

const MAX_ROWS_PER_TABLE = 500;

async function readTable(
  supabase: QueryableClient,
  table: string,
  columns: string,
  pixPckId: string | null,
): Promise<{ rows: Row[]; available: boolean }> {
  try {
    let query = supabase.from(table).select(columns).limit(MAX_ROWS_PER_TABLE);
    if (pixPckId) query = query.eq('pix_pck_id', pixPckId);

    const { data, error } = await query;
    if (error) return { rows: [], available: false };

    return { rows: (data ?? []) as Row[], available: true };
  } catch {
    return { rows: [], available: false };
  }
}

/** Shared gate: QC pass and an approved, non-source audio URL. */
function gate(row: Row, requireAudio: boolean): string | null {
  if (normalizeQc(row.audio_qc_status) !== 'pass') {
    return 'Audio QC has not passed';
  }

  const audioUrl = resolveAudioUrl(row);

  if (!audioUrl) {
    return requireAudio ? 'No approved audio URL' : null;
  }

  if (isForbiddenSourceUrl(audioUrl)) {
    return 'Blocked: PIX/source audio is not a delivery unit';
  }

  return null;
}

function activeCodeId(row: Row): string | null {
  const codes = Array.isArray(row.k_kut_codes) ? row.k_kut_codes : [];
  const active = codes.find((code: Row) => code?.status === 'active');
  return active?.id ? String(active.id) : null;
}

function mapKut(row: Row): KfInventoryItem {
  const codeId = activeCodeId(row);
  const blocked = gate(row, false) ?? (codeId ? null : 'No active redemption code');
  const id = String(row.id ?? '');

  return {
    id,
    unit_type: 'KUT',
    pix_pck_id: row.pix_pck_id ? String(row.pix_pck_id) : null,
    structure_tag: row.structure_tag ? String(row.structure_tag) : null,
    variant: row.variant ? String(row.variant) : null,
    theme: resolveTheme(row),
    audio_qc_status: normalizeQc(row.audio_qc_status),
    duration_ms: typeof row.duration_ms === 'number' ? row.duration_ms : null,
    label: row.structure_tag ? `K-KUT · ${row.structure_tag}` : 'K-KUT',
    href: blocked ? null : unitHref('KUT', codeId ?? id),
    playable: !blocked,
    blocked_reason: blocked,
  };
}

function mapMiniKut(row: Row): KfInventoryItem {
  const blocked = gate(row, false);
  const id = String(row.id ?? '');

  return {
    id,
    unit_type: 'mK',
    pix_pck_id: row.pix_pck_id ? String(row.pix_pck_id) : null,
    structure_tag: row.structure_tag ? String(row.structure_tag) : null,
    variant: null,
    theme: resolveTheme(row),
    audio_qc_status: normalizeQc(row.audio_qc_status),
    duration_ms: null,
    label: row.mk_type ? String(row.mk_type) : 'mini-KUT',
    href: blocked ? null : unitHref('mK', id),
    playable: !blocked,
    blocked_reason: blocked,
  };
}

function mapLineFeel(row: Row): KfInventoryItem {
  const blocked = gate(row, true);
  const id = String(row.id ?? '');

  return {
    id,
    unit_type: 'LLF',
    pix_pck_id: row.pix_pck_id ? String(row.pix_pck_id) : null,
    structure_tag: row.structure_tag ? String(row.structure_tag) : null,
    variant: row.variant ? String(row.variant) : null,
    theme: resolveTheme(row),
    audio_qc_status: normalizeQc(row.audio_qc_status),
    duration_ms: typeof row.duration_ms === 'number' ? row.duration_ms : null,
    label: row.line_text ? String(row.line_text) : 'LineFeel',
    href: blocked ? null : unitHref('LLF', id),
    playable: !blocked,
    blocked_reason: blocked,
  };
}

function mapKupid(row: Row): KfInventoryItem {
  const blocked = gate(row, true);
  const id = String(row.id ?? '');
  const level = typeof row.romance_level === 'number' ? row.romance_level : null;

  return {
    id,
    unit_type: 'KUPID',
    pix_pck_id: row.pix_pck_id ? String(row.pix_pck_id) : null,
    structure_tag: row.structure_tag ? String(row.structure_tag) : null,
    variant: row.variant ? String(row.variant) : null,
    theme: resolveTheme(row),
    audio_qc_status: normalizeQc(row.audio_qc_status),
    duration_ms: typeof row.duration_ms === 'number' ? row.duration_ms : null,
    label: row.level_code
      ? `K-kUpId · ${row.level_code}`
      : level
        ? `K-kUpId · Level ${level}`
        : 'K-kUpId',
    href: blocked ? null : unitHref('KUPID', id),
    playable: !blocked,
    blocked_reason: blocked,
  };
}

/**
 * Theme coverage: for each of the seven themes, how many PLAYABLE units exist
 * in each container. Counting playable units rather than rows is the point —
 * a theme backed only by units held at the QC gate is not satisfied, and
 * reporting it as such would hide exactly the work that remains.
 *
 * Every theme is always returned, including ones with no inventory at all, so
 * a gap shows as a zero rather than as a missing row.
 */
function themeCoverage(items: KfInventoryItem[]): KfThemeCoverage[] {
  return KF_THEMES.map((theme: KfTheme) => {
    const containers = Object.fromEntries(
      KF_UNIT_TYPES.map((unit) => [
        unit,
        items.filter(
          (item) => item.theme === theme && item.unit_type === unit && item.playable,
        ).length,
      ]),
    ) as Record<KfUnitType, number>;

    const missing = KF_UNIT_TYPES.filter((unit) => containers[unit] === 0);

    return {
      theme,
      label: THEME_META[theme].label,
      containers,
      missing,
      satisfied: missing.length === 0,
    };
  });
}

function rollup(items: KfInventoryItem[]): KfFamilyCount[] {
  return KF_UNIT_TYPES.map((unit: KfUnitType) => {
    const scoped = items.filter((item) => item.unit_type === unit);
    return {
      unit_type: unit,
      total: scoped.length,
      qc_pass: scoped.filter((item) => item.audio_qc_status === 'pass').length,
      playable: scoped.filter((item) => item.playable).length,
    };
  });
}

/**
 * Totals and per-family counts for a given set of items.
 *
 * Exported so a caller that narrows `items` can recompute the counts to match
 * what it is actually returning. Handing back a filtered item list alongside
 * counts for the unfiltered set describes two different things in one payload.
 */
export function summarize(items: KfInventoryItem[]): {
  totals: { total: number; qc_pass: number; playable: number };
  families: KfFamilyCount[];
} {
  return {
    totals: {
      total: items.length,
      qc_pass: items.filter((item) => item.audio_qc_status === 'pass').length,
      playable: items.filter((item) => item.playable).length,
    },
    families: rollup(items),
  };
}

/**
 * Build the KUT Family inventory, optionally scoped to one PIX.
 * Items come back grouped by unit type in canonical family order.
 */
export async function buildKfInventory(
  supabase: QueryableClient,
  pixPckId: string | null = null,
): Promise<KfInventoryResponse> {
  const unavailable: string[] = [];
  const items: KfInventoryItem[] = [];

  const [kut, mk, llf, kupid] = await Promise.all([
    readTable(
      supabase,
      'k_kut_assets',
      'id, pix_pck_id, structure_tag, variant, theme, audio_qc_status, duration_ms, k_kut_codes(id, item_type, status)',
      pixPckId,
    ),
    readTable(
      supabase,
      'm_kut_assets',
      'id, pix_pck_id, mk_type, content, structure_tag, theme, audio_qc_status',
      pixPckId,
    ),
    readTable(
      supabase,
      'llf_assets',
      'id, pix_pck_id, structure_tag, variant, line_text, theme, audio_qc_status, duration_ms, llf_audio_url',
      pixPckId,
    ),
    readTable(
      supabase,
      'kupid_assets',
      'id, pix_pck_id, structure_tag, variant, romance_level, level_code, theme, audio_qc_status, duration_ms, kupid_audio_url',
      pixPckId,
    ),
  ]);

  if (kut.available) items.push(...kut.rows.map(mapKut));
  else unavailable.push('k_kut_assets');

  if (mk.available) items.push(...mk.rows.map(mapMiniKut));
  else unavailable.push('m_kut_assets');

  if (llf.available) items.push(...llf.rows.map(mapLineFeel));
  else unavailable.push('llf_assets');

  if (kupid.available) items.push(...kupid.rows.map(mapKupid));
  else unavailable.push('kupid_assets');

  const order = new Map<KfUnitType, number>(
    KF_UNIT_TYPES.map((unit, index) => [unit, index]),
  );

  items.sort((a, b) => {
    const byFamily = (order.get(a.unit_type) ?? 0) - (order.get(b.unit_type) ?? 0);
    if (byFamily !== 0) return byFamily;
    return (a.structure_tag ?? '').localeCompare(b.structure_tag ?? '');
  });

  const coverage = themeCoverage(items);
  const summary = summarize(items);

  return {
    ok: true,
    pix_pck_id: pixPckId,
    totals: summary.totals,
    families: summary.families,
    coverage,
    satisfied_themes: coverage.filter((row) => row.satisfied).map((row) => row.theme),
    items,
    unavailable,
  };
}

/** Re-exported so callers only ever need to import from `lib/kf/inventory`. */
export { classifyUnitType, unitLabel };
