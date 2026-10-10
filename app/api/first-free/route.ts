import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * POST /api/first-free
 *
 * Records a First One Free promise from the home-page funnel so the
 * "3 touches in 3 weeks" follow-up has an address to go to.
 * Table: public.first_free_signups (db/20261010000100_first_free_signups.sql).
 */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ITEM_ID = /^(mk|kkut)-[a-z0-9-]{1,60}$/;

/** Built per request: SUPABASE_SERVICE_ROLE_KEY is Production-only. */
function serviceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const itemId = typeof body?.itemId === "string" ? body.itemId : "";

  if (!EMAIL.test(email) || email.length > 254) {
    return NextResponse.json({ ok: false, code: "BAD_EMAIL" }, { status: 400 });
  }
  if (!ITEM_ID.test(itemId)) {
    return NextResponse.json({ ok: false, code: "BAD_ITEM" }, { status: 400 });
  }
  if (body?.promisedReturn !== true) {
    return NextResponse.json({ ok: false, code: "NO_PROMISE" }, { status: 400 });
  }

  const supabase = serviceClient();
  if (!supabase) {
    return NextResponse.json({ ok: false, code: "SUPABASE_SERVICE_ROLE_MISSING" }, { status: 500 });
  }

  // A repeat promise for the same item is not an error: the row is already there.
  const { error } = await supabase.from("first_free_signups").upsert(
    {
      email,
      item_id: itemId,
      item_format: itemId.startsWith("kkut-") ? "kkut" : "mk",
      promised_return: true,
    },
    { onConflict: "email,item_id", ignoreDuplicates: true }
  );

  if (error) {
    return NextResponse.json({ ok: false, code: "SAVE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
