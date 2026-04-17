'use client';

/**
 * mini-KUT View Page — /mkut/[id]
 *
 * Calls the `play-m-kut` Supabase edge function with the mini-KUT asset ID.
 * mini-KUTs are text micro-assets tied to song sections; the edge function
 * resolves the associated audio (K-KUT or K-kut variant) and returns a signed URL.
 *
 * REQUIRED for audio to work:
 *   1. Supabase edge function `play-m-kut` must be deployed.
 *      (Supabase Dashboard → Edge Functions → play-m-kut)
 *   2. The m_kut_asset row must exist and be linked to an active k_kut_asset.
 *   3. The linked k_kut_asset must have audio_qc_status = 'pass'.
 *   4. NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 *      must be set in Vercel env vars.
 *
 * Request body sent to play-m-kut: { mk_id: <m_kut_asset_id> }
 */

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/browser';

interface MKutResponse {
  signed_url: string;
  expires_in: number;
  structure_tag: string;
  duration_ms: number | null;
  mime_type: string | null;
  title: string | null;
  artist: string | null;
  theme: string;
  gift_note: string | null;
  gifted_by: string | null;
  meta: {
    id: string;
    variant: string;
    structure_tag: string;
    pix_pck_id: string;
    mime_type: string | null;
    duration_ms: number | null;
  };
}

export default function MiniKutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<MKutResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSignedUrl() {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/play-m-kut`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            // mk_id: the mini-KUT asset ID — play-m-kut resolves the associated audio from this
            body: JSON.stringify({ mk_id: id }),
          }
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Unknown error' }));
          setError(body.error ?? `Error ${res.status}`);
          return;
        }

        setData(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load mini-KUT');
      } finally {
        setLoading(false);
      }
    }

    fetchSignedUrl();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="text-[#D4A017] font-bold text-lg hover:opacity-80">← K-KUT</Link>
        <span className="text-xs uppercase tracking-widest text-[#C8A882]">mini-KUT</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg">
          {loading && (
            <div className="text-center text-[#C8A882] animate-pulse">Loading mini-KUT…</div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-center">
              <p className="text-red-400 font-semibold mb-2">Unable to load mini-KUT</p>
              <p className="text-sm text-[#C8A882]">{error}</p>
              <Link href="/" className="mt-4 inline-block text-[#D4A017] text-sm hover:underline">
                ← Back to K-KUT
              </Link>
            </div>
          )}

          {data && (
            <div className="rounded-xl border border-[#C8A882]/30 bg-[#111] p-6 flex flex-col gap-6">
              {/* Meta */}
              <div>
                <p className="text-xs uppercase tracking-widest text-[#C8A882] mb-1">mini-KUT</p>
                <p className="text-xl font-bold text-[#F5e6c8]">{data.structure_tag}</p>
                {data.title && (
                  <p className="text-sm text-[#C8A882] mt-1">
                    {data.title}{data.artist ? ` · ${data.artist}` : ''}
                  </p>
                )}
                {data.gift_note && (
                  <p className="text-sm text-[#D4A017] mt-2 italic">"{data.gift_note}"</p>
                )}
                {data.gifted_by && (
                  <p className="text-xs text-[#C8A882]/60 mt-1">from {data.gifted_by}</p>
                )}
              </div>

              {/* Audio player */}
              <audio
                controls
                src={data.signed_url}
                className="w-full rounded"
              >
                Your browser does not support audio playback.
              </audio>

              {data.duration_ms && (
                <p className="text-xs text-[#C8A882]/60 text-center">
                  {Math.round(data.duration_ms / 1000)}s · {data.meta.variant}
                </p>
              )}

              <p className="text-xs text-[#C8A882]/60 text-center">
                Link valid for {Math.round(data.expires_in / 60)} minutes
              </p>
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-white/10 px-6 py-6 text-center text-xs text-[#C8A882]">
        K-KUT is a{' '}
        <a href="https://gputnammusic.com" className="text-[#D4A017] hover:underline">
          G Putnam Music
        </a>{' '}
        invention. All rights reserved.
      </footer>
    </div>
  );
}
