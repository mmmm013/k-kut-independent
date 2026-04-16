/**
 * Browser (client-side) Supabase client for staging/k-kut.
 * Uses NEXT_PUBLIC_ env vars — safe to call from client components.
 */
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
