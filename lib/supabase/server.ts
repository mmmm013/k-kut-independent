/**
 * Server-side Supabase client for staging/k-kut.
 * Uses NEXT_PUBLIC_ env vars only — no service-role key required.
 * Suitable for server components and route handlers.
 */
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { auth: { persistSession: false } }
  );
}
