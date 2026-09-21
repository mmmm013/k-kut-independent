import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  classifyUnitType,
  publicPhrase,
  resolveAudioUrl,
  safeId,
} from "../../../../lib/kf/classify";

export const dynamic = "force-dynamic";

/**
 * Built per request, not at module scope: SUPABASE_SERVICE_ROLE_KEY is a
 * Production-only variable, and creating the client at import time made
 * `next build` fail wherever it is absent (preview deploys, local builds).
 */
function serviceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function GET(req: Request) {
  try {
    const supabase = serviceClient();

    if (!supabase) {
      return NextResponse.json(
        { error: "K-KUT Supabase URL or service role key is missing." },
        { status: 500 }
      );
    }

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
      const unit = classifyUnitType(k);
      const phrase = publicPhrase(unit);

      return {
        id: safeId(k),
        phrase,
        display_label: `${phrase} ${index + 1}`,
        delivery_unit_type: unit,
        keenness_score: k.keenness_score || 0,
        emotion_level: k.emotion_level || "",
        audio_available: Boolean(resolveAudioUrl(k)),
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
