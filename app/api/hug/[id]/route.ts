import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

function isForbiddenSourceUrl(value: unknown) {
  if (typeof value !== "string") return true;

  const lower = value.toLowerCase();

  return (
    lower.includes("/tracks/") ||
    lower.includes("pix") ||
    lower.includes("gpmc") ||
    lower.includes("source") ||
    lower.includes("flagship") ||
    lower.includes("full") ||
    lower.includes("a%20love%20like%20that") ||
    lower.includes("a love like that")
  );
}

function safeDeliveryNote(row: any) {
  if (row.public_label) return row.public_label;
  if (row.public_phrase) return row.public_phrase;
  if (row.delivery_note) return row.delivery_note;
  if (row.description) return "KUT-authorized delivery";
  return "KUT-authorized HUG delivery";
}

function unitType(row: any) {
  const raw = [
    row.delivery_unit_type,
    row.unit_type,
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

  const audioUrl =
    kut.delivery_audio_url ||
    kut.kut_audio_url ||
    kut.mk_audio_url ||
    kut.llf_audio_url ||
    kut.approved_audio_url ||
    "";

  if (!audioUrl) {
    return blocked(
      "NO_KUT_AUDIO",
      "Blocked: this KUT does not have an approved public KUT/mK/LLF audio URL."
    );
  }

  if (isForbiddenSourceUrl(audioUrl)) {
    return blocked(
      "FORBIDDEN_SOURCE_AUDIO",
      "Blocked: this HUG attempted to use PIX/source/full-track audio instead of approved KUT/mK/LLF audio."
    );
  }

  if (
    kut.approved_for_hug === false ||
    kut.hug_approved === false ||
    kut.approved === false
  ) {
    return blocked(
      "NOT_APPROVED_FOR_HUG",
      "Blocked: this KUT delivery unit is not approved for HUG delivery."
    );
  }

  return NextResponse.json({
    ok: true,
    blocked: false,
    id: String(kut.id || id),
    delivery_unit_type: unitType(kut),
    audio_url: audioUrl,
    delivery_note: safeDeliveryNote(kut),
    remaining_forwards: null,
  });
}
