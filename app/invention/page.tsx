'use client';

/**
 * K-KUT — Invention Detail Page
 *
 * Documents all 3 inventions in the K-KUT family:
 *   1. K-KUT  — exact-excerpt audio (section-based, ASCAP-compliant)
 *   2. mini-KUT (mK) — text micro-assets (NOT audio)
 *   3. K-kUpId — romance/gifting invention (5 levels)
 */

import Link from 'next/link';

const SECTION_ORDER = ['Intro', 'V1', 'Pre1', 'Ch1', 'V2', 'Pre2', 'Ch2', 'BR', 'Ch3', 'Outro'] as const;

const MK_TYPES = [
  { type: 'mK-verb',   desc: 'Action words from lyrics' },
  { type: 'mK-noun',   desc: 'Objects, names, places' },
  { type: 'mK-adj',    desc: 'Descriptors and mood words' },
  { type: 'mK-adv',    desc: 'Manner and intensity words' },
  { type: 'mK-pron',   desc: 'Pronouns in lyrical context' },
  { type: 'mK-cmpnd',  desc: '≤4-word compound units' },
  { type: 'mK-phrase', desc: '≤2 contiguous lyric lines' },
  { type: 'mK-hook',   desc: 'Phrase with a twist or play-on-words' },
];

const KUPID_LEVELS = [
  { level: 1, label: 'Interest',  color: '#C8A882' },
  { level: 2, label: 'Date',      color: '#D4A017' },
  { level: 3, label: 'Love',      color: '#E07B54' },
  { level: 4, label: 'Sex',       color: '#C0392B' },
  { level: 5, label: 'Forever',   color: '#8B5CF6' },
];

export default function InventionPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="text-[#D4A017] font-bold text-lg hover:opacity-80">← K-KUT</Link>
        <nav className="flex gap-4 text-sm text-[#C8A882]">
          <Link href="/demo" className="hover:text-[#D4A017] transition-colors">Demo</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-16 w-full flex flex-col gap-20">

        {/* ── K-KUT ── */}
        <section id="k-kut">
          <p className="text-xs uppercase tracking-widest text-[#D4A017] mb-2">Invention 1</p>
          <h2 className="text-3xl font-extrabold text-[#F5e6c8] mb-4">K-KUT</h2>
          <p className="text-[#C8A882] leading-relaxed mb-6">
            An exact audio excerpt of one or more <strong className="text-[#F5e6c8]">contiguous song sections</strong> in
            original order. Not time-based — section-based. One K-KUT per purchase. ASCAP-compliant.
          </p>

          <div className="mb-4">
            <p className="text-xs uppercase tracking-widest text-[#C8A882] mb-3">Canonical Section Order</p>
            <div className="flex flex-wrap gap-2">
              {SECTION_ORDER.map((s, i) => (
                <span
                  key={s}
                  className="px-3 py-1 rounded-full text-sm border border-[#D4A017]/40 text-[#D4A017]"
                >
                  {i + 1}. {s}
                </span>
              ))}
            </div>
          </div>

          <ul className="text-sm text-[#C8A882] list-disc list-inside space-y-1">
            <li>1+ contiguous sections, original order only (ASCAP rule)</li>
            <li>No time constraint — pure section-based architecture</li>
            <li>Section audio stored in <code className="text-[#D4A017]">k_kut_assets</code> (structure_tag + storage_path)</li>
            <li>Codes tracked in <code className="text-[#D4A017]">k_kut_codes</code> (item_type: STI | BTI | FP)</li>
          </ul>
        </section>

        {/* ── mini-KUT ── */}
        <section id="mini-kut">
          <p className="text-xs uppercase tracking-widest text-[#C8A882] mb-2">Invention 2</p>
          <h2 className="text-3xl font-extrabold text-[#F5e6c8] mb-4">mini-KUT <span className="text-[#C8A882] text-xl font-normal">(mK)</span></h2>
          <p className="text-[#C8A882] leading-relaxed mb-6">
            Text micro-assets harvested from master tracks. <strong className="text-[#F5e6c8]">NOT audio.</strong>{' '}
            Tied to PIX at backend, harvested by KKr-MSC MetaGrab, re-processed by 4PE-MSC.
            12 mini-KUTs per Master Track (8/12/20 rule).
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {MK_TYPES.map(({ type, desc }) => (
              <div key={type} className="rounded-lg border border-white/10 bg-[#111] p-3">
                <p className="text-xs font-mono text-[#D4A017] mb-1">{type}</p>
                <p className="text-xs text-[#C8A882]">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── K-kUpId ── */}
        <section id="k-kupid">
          <p className="text-xs uppercase tracking-widest text-[#C0392B] mb-2">Invention 3</p>
          <h2 className="text-3xl font-extrabold text-[#F5e6c8] mb-4">K-kUpId</h2>
          <p className="text-[#C8A882] leading-relaxed mb-6">
            A standalone K-KUT invention curated for romance. Same exact-excerpt audio strategy as K-KUT,
            but selected and signed for a specific relationship level. Cryptographically signed
            (Lone Admin credentials), shareable, giftable, traceable.
          </p>

          <div className="flex flex-wrap gap-3 mb-6">
            {KUPID_LEVELS.map(({ level, label, color }) => (
              <div
                key={level}
                className="flex items-center gap-2 px-4 py-2 rounded-full border"
                style={{ borderColor: color + '60', color }}
              >
                <span className="text-xs opacity-60">{level}</span>
                <span className="font-semibold">{label}</span>
              </div>
            ))}
          </div>

          <ul className="text-sm text-[#C8A882] list-disc list-inside space-y-1">
            <li>GPM box-opening UX: 3 panels, 3-letter codes</li>
            <li>Every share is traceable and monetizable (viral loop)</li>
            <li>NOT a delivery vehicle — it IS its own invention</li>
          </ul>
        </section>

      </main>

      <footer className="mt-auto border-t border-white/10 px-6 py-6 text-center text-xs text-[#C8A882]">
        <p>
          K-KUT is a{' '}
          <a href="https://gputnammusic.com" className="text-[#D4A017] hover:underline">
            G Putnam Music
          </a>{' '}
          invention. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
