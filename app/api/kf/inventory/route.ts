import { NextResponse } from "next/server";

import { createClient } from "../../../../lib/supabase/server";
import { buildKfInventory } from "../../../../lib/kf/inventory";
import { KF_UNIT_TYPES, KfUnitType } from "../../../../lib/kf/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/kf/inventory
 *
 * The complete KUT Family inventory — K-KUT, mini-KUT, LineFeel and K-kUpId —
 * normalized into one list with a single gate applied across all four.
 *
 * Query params:
 *   ?pix=<pix_pck_id>   scope to one master track (default: whole family)
 *   ?type=KUT|mK|LLF|KUPID   scope to one unit type
 *   ?playable=1         return only units that pass the gate
 *
 * Uses the anon key, so Row Level Security decides what is visible. Nothing
 * here can widen access beyond what the browser could already read.
 */
export async function GET(req: Request) {
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

  const inventory = await buildKfInventory(createClient(), pix);

  let items = inventory.items;
  if (typeParam) items = items.filter((item) => item.unit_type === (typeParam as KfUnitType));
  if (playableOnly) items = items.filter((item) => item.playable);

  return NextResponse.json({ ...inventory, items });
}
