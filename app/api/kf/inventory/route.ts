import { NextResponse } from "next/server";

import { createClient } from "../../../../lib/supabase/server";
import { buildKfInventory, summarize } from "../../../../lib/kf/inventory";
import {
  KF_REFERENCE_NOTICE,
  KF_REFERENCE_UI_ENABLED,
} from "../../../../lib/kf/reference-mode";
import { KF_THEMES, KF_UNIT_TYPES, KfTheme, KfUnitType } from "../../../../lib/kf/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/kf/inventory
 *
 * The complete KUT Family inventory — K-KUT, mini-KUT, LineFeel and K-kUpId —
 * normalized into one list with a single gate applied across all four.
 *
 * Query params:
 *   ?pix=<pix_pck_id>        scope to one master track (default: whole family)
 *   ?type=KUT|mK|LLF|KUPID   scope to one unit type
 *   ?theme=love|apology|…    scope to one of the seven themes
 *   ?playable=1              return only units that pass the gate
 *
 * Two different things are being described, so the payload says which is which:
 *
 *   totals / families    count exactly the `items` returned. When a narrowing
 *                        filter is applied they are recomputed from the
 *                        filtered list, so the counts and the list always
 *                        agree. `counts_describe` says so explicitly.
 *   coverage /           always describe the FULL PIX scope, never the
 *   satisfied_themes     filtered slice — recomputing theme coverage from,
 *                        say, ?type=KUT would report every theme as missing
 *                        mK, LLF and KUPID, which is a false gap rather than
 *                        a real one. `coverage_scope` names what they cover.
 *
 * `filters` echoes what was applied, so a caller never has to infer it.
 *
 * Uses the anon key, so Row Level Security decides what is visible. Nothing
 * here can widen access beyond what the browser could already read.
 */
export async function GET(req: Request) {
  // Reference surface, off by default. See lib/kf/reference-mode.ts — this
  // endpoint bypasses the governed publication bridge and must not serve.
  if (!KF_REFERENCE_UI_ENABLED) {
    return NextResponse.json({ ok: false, ...KF_REFERENCE_NOTICE }, { status: 403 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseUrl.startsWith("https://") || !anonKey) {
    return NextResponse.json(
      {
        ok: false,
        code: "SUPABASE_ENV_MISSING",
        message: "K-KUT Supabase URL or anon key is missing.",
      },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);
  const pix = searchParams.get("pix")?.trim() || null;
  const typeParam = searchParams.get("type")?.trim() || null;
  const themeParam = searchParams.get("theme")?.trim().toLowerCase() || null;
  const playableOnly = searchParams.get("playable") === "1";

  if (typeParam && !(KF_UNIT_TYPES as readonly string[]).includes(typeParam)) {
    return NextResponse.json(
      {
        ok: false,
        code: "UNKNOWN_UNIT_TYPE",
        message: `Unknown KUT Family unit type "${typeParam}". Expected one of ${KF_UNIT_TYPES.join(", ")}.`,
      },
      { status: 400 }
    );
  }

  if (themeParam && !(KF_THEMES as readonly string[]).includes(themeParam)) {
    return NextResponse.json(
      {
        ok: false,
        code: "UNKNOWN_THEME",
        message: `Unknown theme "${themeParam}". Expected one of ${KF_THEMES.join(", ")}.`,
      },
      { status: 400 }
    );
  }

  const inventory = await buildKfInventory(createClient(), pix);

  const type = typeParam as KfUnitType | null;
  const theme = themeParam as KfTheme | null;

  let items = inventory.items;
  if (type) items = items.filter((item) => item.unit_type === type);
  if (theme) items = items.filter((item) => item.theme === theme);
  if (playableOnly) items = items.filter((item) => item.playable);

  const narrowed = items.length !== inventory.items.length;
  // Recompute so the counts describe the list actually being returned.
  const summary = narrowed
    ? summarize(items)
    : { totals: inventory.totals, families: inventory.families };

  return NextResponse.json({
    ...inventory,
    filters: { type, theme, playable_only: playableOnly },
    counts_describe: narrowed ? "items" : "scope",
    coverage_scope: pix ? `pix:${pix}` : "all",
    totals: summary.totals,
    families: summary.families,
    items,
  });
}
