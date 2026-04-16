'use client';

/**
 * K-KUT Playback / Redemption Page — /k/[id]
 *
 * Calls the `play-k-kut` Supabase edge function with the asset ID.
 * Returns a signed audio URL (TTL 1 hr) + meta.
 * Audio QC must be 'pass' and status must be 'active' for the asset to resolve.
 */

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/browser';

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
  expires_in: number;
  meta: PlayMeta;
}

export default function KKutPlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<PlayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSignedUrl() {
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

    fetchSignedUrl();
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
