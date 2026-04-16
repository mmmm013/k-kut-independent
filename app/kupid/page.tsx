'use client';

/**
 * K-kUpId Romance-Level Picker — /kupid
 *
 * K-kUpId is a standalone K-KUT invention (NOT a delivery vehicle).
 * Same exact-excerpt audio strategy as K-KUT, curated for 5 romance levels:
 *   Interest → Date → Love → Sex → Forever
 *
 * GPM box-opening UX: 3 panels, 3-letter codes.
 * Every share is cryptographically signed, traceable, and monetizable.
 */

import { useState } from 'react';
import Link from 'next/link';

const LEVELS = [
  {
    id: 1,
    label: 'Interest',
    code: 'INT',
    desc: 'A spark. Something that says "I notice you" without saying a word.',
    color: '#C8A882',
  },
  {
    id: 2,
    label: 'Date',
    code: 'DAT',
    desc: 'The moment worth marking. Music that fits the beginning of something real.',
    color: '#D4A017',
  },
  {
    id: 3,
    label: 'Love',
    code: 'LUV',
    desc: "Deep and deliberate. A section chosen because it says what words can't.",
    color: '#E07B54',
  },
  {
    id: 4,
    label: 'Sex',
    code: 'SEX',
    desc: 'Raw. Present. The exact beat that belongs to exactly this moment.',
    color: '#C0392B',
  },
  {
    id: 5,
    label: 'Forever',
    code: 'FVR',
    desc: 'Not a moment — a monument. The section that plays at every anniversary.',
    color: '#8B5CF6',
  },
] as const;

export default function KupidPage() {
  const [selected, setSelected] = useState<number | null>(null);

  const active = LEVELS.find((l) => l.id === selected);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="text-[#D4A017] font-bold text-lg hover:opacity-80">← K-KUT</Link>
        <nav className="flex gap-4 text-sm text-[#C8A882]">
          <Link href="/invention#k-kupid" className="hover:text-[#D4A017] transition-colors">
            About K-kUpId
          </Link>
        </nav>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16 w-full flex flex-col gap-12">

        {/* ── Intro ── */}
        <section className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-[#C0392B] mb-3">K-kUpId</p>
          <h2 className="text-4xl font-extrabold text-[#F5e6c8] mb-4 leading-tight">
            Pick the Level
          </h2>
          <p className="text-[#C8A882] leading-relaxed max-w-md mx-auto">
            K-kUpId is a K-KUT curated for romance. Choose your level —
            a signed audio excerpt will be selected for that exact moment.
            Shareable. Giftable. Permanent.
          </p>
        </section>

        {/* ── Level picker ── */}
        <section className="flex flex-col gap-3">
          {LEVELS.map(({ id, label, code, desc, color }) => {
            const isActive = selected === id;
            return (
              <button
                key={id}
                onClick={() => setSelected(isActive ? null : id)}
                className={`text-left rounded-xl border p-5 transition-all ${
                  isActive
                    ? 'bg-[#111]'
                    : 'border-white/10 bg-[#0d0d0d] hover:border-white/20'
                }`}
                style={isActive ? { borderColor: color + '80' } : {}}
              >
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{ color, background: color + '20' }}
                  >
                    {code}
                  </span>
                  <span
                    className="font-bold text-lg"
                    style={{ color: isActive ? color : '#F5e6c8' }}
                  >
                    {id}. {label}
                  </span>
                </div>
                {isActive && (
                  <p className="text-sm text-[#C8A882] leading-relaxed mt-1">{desc}</p>
                )}
              </button>
            );
          })}
        </section>

        {/* ── Selected level action ── */}
        {active && (
          <section
            className="rounded-xl border bg-[#111] p-6 text-center flex flex-col gap-4"
            style={{ borderColor: active.color + '60' }}
          >
            <p className="text-xs uppercase tracking-widest" style={{ color: active.color }}>
              Level {active.id} · {active.label}
            </p>
            <p className="text-[#C8A882] text-sm leading-relaxed">{active.desc}</p>
            <a
              href="https://gputnammusic.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-8 py-3 rounded-full font-bold text-[#0a0a0a] transition-opacity hover:opacity-80"
              style={{ background: active.color }}
            >
              Get K-kUpId · {active.label}
            </a>
            <p className="text-xs text-[#C8A882]/50">
              Cryptographically signed · Traceable · Permanent
            </p>
          </section>
        )}

      </main>

      <footer className="mt-auto border-t border-white/10 px-6 py-6 text-center text-xs text-[#C8A882]">
        K-KUT is a{' '}
        <a href="https://gputnammusic.com" className="text-[#D4A017] hover:underline">
          G Putnam Music
        </a>{' '}
        invention. All rights reserved.
      </footer>
    </div>
  );
}
