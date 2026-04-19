'use client';

/**
 * K-KUT Playback / Redemption Page — /k/[id]
 *
 * Two modes:
 *
 * 1. CATALOG DIRECT-PLAY (no edge function, no DB required):
 *    If [id] is a known catalog slug (e.g. "kkut-love-01"), audio is served
 *    directly from the public Supabase Storage "tracks" bucket.
 *    Requires: bucket is PUBLIC and NEXT_PUBLIC_SUPABASE_URL is set.
 *
 * 2. EDGE-FUNCTION / CODE REDEMPTION (full production flow):
 *    If [id] is a UUID code from k_kut_codes, the play-k-kut edge function
 *    is called to produce a signed URL.
 *    Requires: edge function deployed, k_kut_asset row with audio_qc_status='pass',
 *    k_kut_codes row with status='active', and both env vars set.
 */

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/browser';

// ── Catalog: known K-KUT IDs → Storage filename + display metadata ────────────
// Add entries here whenever a new K-KUT is ready in the tracks bucket.
const BASE_TRACKS = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/tracks`;

interface CatalogEntry {
  filename: string;
  title: string;
  artist: string;
  variant: string;
}

const CATALOG_AUDIO: Record<string, CatalogEntry> = {
  'kkut-love-01':      { filename: 'perfect-day.mp3',       title: 'K-KUT · Love Renews',       artist: 'KLEIGH',         variant: 'Vocal + Music' },
  'kkut-apology-01':   { filename: 'jump.mp3',               title: 'K-KUT · Open Hands',        artist: 'G Putnam Music', variant: 'Vocal + Music' },
  'kkut-hurt-01':      { filename: 'kleigh--nightfall.mp3',  title: 'K-KUT · Wounded & Willing', artist: 'G Putnam Music', variant: 'Vocal + Music' },
  'kkut-gratitude-01': { filename: 'wanna-know-you.mp3',     title: 'K-KUT · Steady Thanks',     artist: 'G Putnam Music', variant: 'Vocal + Music' },
  'kkut-energy-01':    { filename: 'kleigh--waterfall.mp3',  title: 'K-KUT · High Energy',       artist: 'G Putnam Music', variant: 'Vocal + Music' },
  'kkut-hope-01':      { filename: 'kleigh--solace.mp3',     title: 'K-KUT · Hope',              artist: 'G Putnam Music', variant: 'Vocal + Music' },
  'kkut-peace-01':     { filename: 'kleigh--solace.mp3',     title: 'K-KUT · Melancholy Blues',  artist: 'G Putnam Music', variant: 'Vocal + Music' },
};

interface PlayMeta {
  id: string;
  variant: string;
  structure_tag: string;
  pix_pck_id: string;
  mime_type: string | null;
  duration_ms: number | null;
}

interface PlayResponse {
  signed_url: string;
  /** 0 means direct-play (no expiry); positive value = seconds until expiry */
  expires_in: number;
  meta: PlayMeta;
}

export default function KKutPlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<PlayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      // ── Mode 1: Catalog direct-play (no edge function required) ──────────────
      const catalog = CATALOG_AUDIO[id];
      if (catalog) {
        setData({
          signed_url: `${BASE_TRACKS}/${catalog.filename}`,
          expires_in: 0,
          meta: {
            id,
            variant: catalog.variant,
            structure_tag: catalog.title,
            pix_pck_id: id,
            mime_type: 'audio/mpeg',
            duration_ms: null,
          },
        });
        setLoading(false);
        return;
      }

      // ── Mode 2: Edge-function / code redemption ───────────────────────────────
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/play-k-kut`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session?.access_token ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({ k_kut_id: id }),
          }
        );

        if (!res.ok) {
          const body = await res.json().catch(() => ({ error: 'Unknown error' }));
          setError(body.error ?? `Error ${res.status}`);
          return;
        }

        setData(await res.json());
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load K-KUT');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="text-[#D4A017] font-bold text-lg hover:opacity-80">← K-KUT</Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg">
          {loading && (
            <div className="text-center text-[#C8A882] animate-pulse">Loading K-KUT…</div>
          )}

          {error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-center">
              <p className="text-red-400 font-semibold mb-2">Unable to load K-KUT</p>
              <p className="text-sm text-[#C8A882]">{error}</p>
              <Link href="/" className="mt-4 inline-block text-[#D4A017] text-sm hover:underline">
                ← Back to K-KUT
              </Link>
            </div>
          )}

          {data && (
            <div className="rounded-xl border border-[#D4A017]/30 bg-[#111] p-6 flex flex-col gap-6">
              {/* Meta */}
              <div>
                <p className="text-xs uppercase tracking-widest text-[#C8A882] mb-1">K-KUT</p>
                <p className="text-xl font-bold text-[#D4A017]">{data.meta.structure_tag}</p>
                {data.meta.duration_ms && (
                  <p className="text-xs text-[#C8A882] mt-1">
                    {Math.round(data.meta.duration_ms / 1000)}s · {data.meta.variant}
                  </p>
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

              {data.expires_in > 0 && (
                <p className="text-xs text-[#C8A882]/60 text-center">
                  Link valid for {Math.round(data.expires_in / 60)} minutes
                </p>
              )}
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
