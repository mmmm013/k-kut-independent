'use client';

/**
 * K-KUT — Demo Page
 *
 * User journey: Browse → Select Path (K-KUT or mini-K) → Resolve Link → K-kUpId delivered.
 *
 * This page demonstrates the K-KUT code-redemption flow conceptually.
 * Actual playback requires a valid K-KUT code and Supabase edge function (play-k-kut).
 */

import { useState } from 'react';
import Link from 'next/link';

type Step = 'browse' | 'select' | 'resolve' | 'deliver';

const STEPS: { id: Step; label: string; desc: string }[] = [
  {
    id: 'browse',
    label: '1. Browse',
    desc: 'Fan discovers available K-KUT inventory — section audio from real tracks.',
  },
  {
    id: 'select',
    label: '2. Select Path',
    desc: 'Choose K-KUT (audio excerpt) or mini-K (text micro-asset).',
  },
  {
    id: 'resolve',
    label: '3. Resolve Link',
    desc: 'K-KUT code is validated against k_kut_codes. Audio_qc_status must be "pass".',
  },
  {
    id: 'deliver',
    label: '4. K-kUpId Delivered',
    desc: 'Signed experience link is generated — shareable, giftable, traceable.',
  },
];

const DEMO_SECTIONS = ['Intro', 'V1', 'Pre1', 'Ch1', 'V2', 'Pre2', 'Ch2', 'BR', 'Ch3', 'Outro'] as const;

export default function DemoPage() {
  const [activeStep, setActiveStep] = useState<Step>('browse');
  const [selectedSections, setSelectedSections] = useState<string[]>([]);

  const toggleSection = (s: string) => {
    setSelectedSections((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="text-[#D4A017] font-bold text-lg hover:opacity-80">← K-KUT</Link>
        <nav className="flex gap-4 text-sm text-[#C8A882]">
          <Link href="/invention" className="hover:text-[#D4A017] transition-colors">Inventions</Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-16 w-full flex flex-col gap-12">

        {/* ── Journey steps ── */}
        <section>
          <h2 className="text-2xl font-extrabold text-[#F5e6c8] mb-8">K-KUT User Journey</h2>
          <div className="flex flex-col gap-4">
            {STEPS.map(({ id, label, desc }) => (
              <button
                key={id}
                onClick={() => setActiveStep(id)}
                className={`text-left rounded-xl border p-4 transition-colors ${
                  activeStep === id
                    ? 'border-[#D4A017] bg-[#D4A017]/10'
                    : 'border-white/10 bg-[#111] hover:border-white/20'
                }`}
              >
                <p className={`font-bold mb-1 ${activeStep === id ? 'text-[#D4A017]' : 'text-[#F5e6c8]'}`}>
                  {label}
                </p>
                <p className="text-sm text-[#C8A882]">{desc}</p>
              </button>
            ))}
          </div>
        </section>

        {/* ── Section picker demo ── */}
        <section>
          <h2 className="text-2xl font-extrabold text-[#F5e6c8] mb-2">Build a K-KUT</h2>
          <p className="text-sm text-[#C8A882] mb-6">
            Select contiguous sections in original order. A K-KUT may contain 1+ sections.
            No time constraint — section-based only.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {DEMO_SECTIONS.map((s) => {
              const selected = selectedSections.includes(s);
              return (
                <button
                  key={s}
                  onClick={() => toggleSection(s)}
                  className={`px-4 py-2 rounded-full text-sm border transition-colors ${
                    selected
                      ? 'border-[#D4A017] bg-[#D4A017]/20 text-[#D4A017]'
                      : 'border-white/20 text-[#C8A882] hover:border-white/40'
                  }`}
                >
                  {s}
                </button>
              );
            })}
          </div>
          {selectedSections.length > 0 && (
            <div className="rounded-xl border border-[#D4A017]/30 bg-[#111] p-4">
              <p className="text-xs uppercase tracking-widest text-[#C8A882] mb-2">Your K-KUT</p>
              <p className="font-mono text-[#D4A017]">{selectedSections.join(' → ')}</p>
              <p className="text-xs text-[#C8A882] mt-2">
                {selectedSections.length} section{selectedSections.length > 1 ? 's' : ''} selected.
                Audio QC must pass before activation.
              </p>
            </div>
          )}
        </section>

        {/* ── K-kUpId romance levels ── */}
        <section>
          <h2 className="text-2xl font-extrabold text-[#F5e6c8] mb-2">K-kUpId Romance Levels</h2>
          <p className="text-sm text-[#C8A882] mb-6">
            Each level is a curated K-KUT signed for that relationship moment.
            Shareable and giftable — every send is traceable.
          </p>
          <div className="flex flex-wrap gap-3">
            {['Interest', 'Date', 'Love', 'Sex', 'Forever'].map((level, i) => (
              <div
                key={level}
                className="px-5 py-3 rounded-full border border-[#D4A017]/40 text-[#D4A017] flex items-center gap-2"
              >
                <span className="text-xs opacity-50">{i + 1}</span>
                <span className="font-semibold">{level}</span>
              </div>
            ))}
          </div>
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
