import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

function publicUnitType(row: any) {
  const raw = [
    row.unit_type,
    row.delivery_unit_type,
    row.kut_type,
    row.type,
    row.asset_type,
    row.title,
    row.description,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (raw.includes("llf") || raw.includes("linefeel") || raw.includes("line feel")) {
    return "LLF";
  }

  if (raw.includes("mk") || raw.includes("mini")) {
    return "mK";
  }

  return "KUT";
}

function publicPhrase(row: any) {
  const unit = publicUnitType(row);

  if (unit === "LLF") return "LineFeel option";
  if (unit === "mK") return "Mini KUT option";
  return "KUT option";
}

function safeId(row: any) {
  return (
    row.id ||
    row.kut_id ||
    row.slug ||
    row.key ||
    row.uuid ||
    row.public_id ||
    null
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").toLowerCase().trim();

    let query = supabase.from("k_kuts").select("*").limit(10);

    if (q) {
      query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%`);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const moments = (data || []).map((k: any, index: number) => {
      const unit = publicUnitType(k);

      return {
        id: safeId(k),
        phrase: publicPhrase(k),
        display_label: `${publicPhrase(k)} ${index + 1}`,
        delivery_unit_type: unit,
        keenness_score: k.keenness_score || 0,
        emotion_level: k.emotion_level || "",
        audio_available: Boolean(k.delivery_audio_url || k.kut_audio_url || k.mk_audio_url || k.llf_audio_url || k.approved_audio_url),
      };
    });

    return NextResponse.json({
      query: q,
      count: moments.length,
      moments,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
