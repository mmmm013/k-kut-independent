'use client';

/**
 * Shared playback shell for KUT Family delivery units.
 *
 * `/llf/[id]` and `/kupid/[id]` both render this so a LineFeel and a K-kUpId
 * present identically to a fan and enforce the same visible gate. The page
 * above it owns the fetch; this component owns the chrome and the audio element.
 */

import Link from 'next/link';
import { ReactNode } from 'react';

import { unitColor, unitLabel } from '../../lib/kf/classify';
import { KfUnitType } from '../../lib/kf/types';

interface KfUnitPlayerProps {
  unit: KfUnitType;
  loading: boolean;
  /** Set when the unit could not be loaded or is held at the gate. */
  error: string | null;
  title: string | null;
  subtitle?: string | null;
  /** Approved delivery audio. Never a PIX or full-track URL. */
  audioUrl: string | null;
  /** Small caption under the player — duration, variant, level, etc. */
  caption?: ReactNode;
}

export default function KfUnitPlayer({
  unit,
  loading,
  error,
  title,
  subtitle,
  audioUrl,
  caption,
}: KfUnitPlayerProps) {
  const color = unitColor(unit);
  const label = unitLabel(unit);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="text-[#D4A017] font-bold text-lg hover:opacity-80">← K-KUT</Link>
        <span className="text-xs uppercase tracking-widest" style={{ color }}>{label}</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg">
          {loading && (
            <div className="text-center text-[#C8A882] animate-pulse">Loading {label}…</div>
          )}

          {!loading && error && (
            <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-center">
              <p className="text-red-400 font-semibold mb-2">Unable to play this {label}</p>
              <p className="text-sm text-[#C8A882]">{error}</p>
              <p className="mt-4 text-xs text-[#C8A882]/60">
                Only approved KUT Family delivery units play here. PIX and full-track
                source audio is always blocked.
              </p>
              <Link href="/kf" className="mt-4 inline-block text-[#D4A017] text-sm hover:underline">
                ← Back to the KUT Family inventory
              </Link>
            </div>
          )}

          {!loading && !error && audioUrl && (
            <div
              className="rounded-xl border bg-[#111] p-6 flex flex-col gap-6"
              style={{ borderColor: `${color}4d` }}
            >
              <div>
                <p className="text-xs uppercase tracking-widest mb-1" style={{ color }}>{label}</p>
                <p className="text-xl font-bold text-[#F5e6c8]">{title ?? label}</p>
                {subtitle && <p className="text-sm text-[#C8A882] mt-1">{subtitle}</p>}
              </div>

              <audio controls preload="none" src={audioUrl} className="w-full rounded">
                Your browser does not support audio playback.
              </audio>

              {caption && (
                <p className="text-xs text-[#C8A882]/60 text-center">{caption}</p>
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
