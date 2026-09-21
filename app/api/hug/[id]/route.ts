import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import {
  classifyUnitType,
  isDisapprovedForHug,
  isForbiddenSourceUrl,
  resolveAudioUrl,
  safeDeliveryNote,
} from "../../../../lib/kf/classify";

export const dynamic = "force-dynamic";

function blocked(code: string, message: string, status = 403) {
  return NextResponse.json(
    {
      ok: false,
      blocked: true,
      code,
      message,
    },
    { status }
  );
}

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseUrl.startsWith("https://")) {
    return blocked(
      "SUPABASE_URL_INVALID",
      "K-KUT Supabase URL is missing or malformed.",
      500
    );
  }

  if (!serviceRoleKey || serviceRoleKey.includes("<your-service-role-key>")) {
    return blocked(
      "SUPABASE_SERVICE_ROLE_MISSING",
      "K-KUT Supabase service role key is missing.",
      500
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase
    .from("k_kuts")
    .select("*")
    .limit(500);

  if (error) {
    console.error("K_KUT_TABLE_ERROR", {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });

    return blocked(
      "K_KUT_TABLE_ERROR",
      "The KUT SSOT could not be loaded.",
      500
    );
  }

  const kut = (data || []).find((row: any) => {
    return (
      String(row.id || "") === id ||
      String(row.kut_id || "") === id ||
      String(row.slug || "") === id ||
      String(row.public_id || "") === id ||
      String(row.uuid || "") === id
    );
  });

  if (!kut) {
    return blocked(
      "KUT_NOT_FOUND",
      "This HUG was not found in the KUT SSOT.",
      404
    );
  }

  const audioUrl = resolveAudioUrl(kut);

  if (!audioUrl) {
    return blocked(
      "NO_KUT_AUDIO",
      "Blocked: this KUT does not have an approved public KUT/mK/LLF/K-kUpId audio URL."
    );
  }

  if (isForbiddenSourceUrl(audioUrl)) {
    return blocked(
      "FORBIDDEN_SOURCE_AUDIO",
      "Blocked: this HUG attempted to use PIX/source/full-track audio instead of an approved KUT Family delivery unit."
    );
  }

  if (isDisapprovedForHug(kut)) {
    return blocked(
      "NOT_APPROVED_FOR_HUG",
      "Blocked: this KUT delivery unit is not approved for HUG delivery."
    );
  }

  return NextResponse.json({
    ok: true,
    blocked: false,
    id: String(kut.id || id),
    delivery_unit_type: classifyUnitType(kut),
    audio_url: audioUrl,
    delivery_note: safeDeliveryNote(kut),
    remaining_forwards: null,
  });
}
