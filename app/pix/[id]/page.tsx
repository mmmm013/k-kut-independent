'use client';

/**
 * PIX Inventory Page — /pix/[id]
 *
 * Displays the complete KUT Family inventory for one PIX (master track):
 * K-KUT, mini-KUT, LineFeel and K-kUpId.
 *
 * Rules enforced visibly:
 *   • Audio QC must be "pass" before any unit is playable (silo gate).
 *   • Both variants surface: Vocal + Music and Music Only.
 *   • Sections shown in canonical GPM order.
 *   • Every KUT Family unit type is listed, not just K-KUT.
 *
 * Data sources (Supabase anon key, subject to your RLS policies):
 *   • k_kut_assets   — one row per section-combo × variant
 *   • k_kut_codes    — redeemable code rows linked to assets
 *   • m_kut_assets   — mini-KUT text micro-assets
 *   • llf_assets     — LineFeel single-line audio units
 *   • kupid_assets   — K-kUpId romance-level units
 *
 * For the family-wide view across every PIX, see /kf.
 */

import { use, useEffect, useState } from 'react';
import Link from 'next/link';

import { createClient } from '../../../lib/supabase/browser';
import {
  formatDuration,
  isVocalVariant,
  normalizeQc,
  sectionSortKey,
  unitColor,
  unitLabel,
  variantLabel,
} from '../../../lib/kf/classify';
import { KfUnitType } from '../../../lib/kf/types';

// ── Types ─────────────────────────────────────────────────────────────────────

interface KKutCode {
  id: string;
  item_type: 'STI' | 'BTI' | 'FP' | string;
  status: 'active' | 'inactive' | string;
}

interface KKutAsset {
  id: string;
  pix_pck_id: string;
  structure_tag: string;
  variant: 'VOCAL_MUSIC' | 'MUSIC_ONLY' | string;
  audio_qc_status: 'pass' | 'fail' | 'pending' | string;
  duration_ms: number | null;
  k_kut_codes: KKutCode[];
}

interface MiniKutAsset {
  id: string;
  mk_type: string;
  content: string | null;
  structure_tag: string | null;
  audio_qc_status: string | null;
}

interface LlfAsset {
  id: string;
  structure_tag: string | null;
  variant: string | null;
  line_text: string | null;
  audio_qc_status: string | null;
  duration_ms: number | null;
}

interface KupidAsset {
  id: string;
  structure_tag: string | null;
  romance_level: number | null;
  level_code: string | null;
  audio_qc_status: string | null;
  duration_ms: number | null;
}

interface PixMeta {
  title: string | null;
  artist: string | null;
  pix_id?: string;
}

function activeCode(asset: KKutAsset): KKutCode | undefined {
  return asset.k_kut_codes.find((c) => c.status === 'active');
}

// ── QC Badge ─────────────────────────────────────────────────────────────────

function QcBadge({ status }: { status: string }) {
  if (status === 'pass') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
        Audio QC Pass
      </span>
    );
  }
  if (status === 'fail') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
        QC Fail
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-white/5 text-[#C8A882] border border-white/10">
      <span className="w-1.5 h-1.5 rounded-full bg-[#C8A882]/60 inline-block" />
      Pending
    </span>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PixInventoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [assets, setAssets] = useState<KKutAsset[]>([]);
  const [mkuts, setMkuts] = useState<MiniKutAsset[]>([]);
  const [llfs, setLlfs] = useState<LlfAsset[]>([]);
  const [kupids, setKupids] = useState<KupidAsset[]>([]);
  const [pixMeta, setPixMeta] = useState<PixMeta>({ title: null, artist: null });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = createClient();

        // ── K-KUT assets ──────────────────────────────────────────────────────
        const { data: assetRows, error: assetErr } = await supabase
          .from('k_kut_assets')
          .select('id, pix_pck_id, structure_tag, variant, audio_qc_status, duration_ms, k_kut_codes(id, item_type, status)')
          .eq('pix_pck_id', id)
          .order('structure_tag', { ascending: true });

        if (assetErr) throw new Error(assetErr.message);

        const rows = (assetRows ?? []) as KKutAsset[];
        setAssets(rows);

        // Infer PIX title/artist from first asset if a pix_pck table isn't queried
        if (rows.length > 0) {
          const slug = rows[0].pix_pck_id ?? id;
          // Attempt to resolve display name from a pix_pck table (graceful fallback)
          const { data: pixRow } = await supabase
            .from('pix_pck')
            .select('title, artist')
            .eq('id', slug)
            .maybeSingle();
          if (pixRow) {
            setPixMeta({ title: pixRow.title ?? null, artist: pixRow.artist ?? null });
          } else {
            // Humanize the slug as a fallback label
            const humanized = slug.replace(/[-_]+/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
            setPixMeta({ title: humanized, artist: null });
          }
        }

        // ── mini-KUT assets (best-effort — table may not yet exist) ──────────
        const { data: mkutRows } = await supabase
          .from('m_kut_assets')
          .select('id, mk_type, content, structure_tag, audio_qc_status')
          .eq('pix_pck_id', id)
          .order('mk_type', { ascending: true });

        setMkuts((mkutRows ?? []) as MiniKutAsset[]);

        // ── LineFeel units (best-effort — table may not yet exist) ───────────
        const { data: llfRows } = await supabase
          .from('llf_assets')
          .select('id, structure_tag, variant, line_text, audio_qc_status, duration_ms')
          .eq('pix_pck_id', id)
          .order('structure_tag', { ascending: true });

        setLlfs((llfRows ?? []) as LlfAsset[]);

        // ── K-kUpId units (best-effort — table may not yet exist) ────────────
        const { data: kupidRows } = await supabase
          .from('kupid_assets')
          .select('id, structure_tag, romance_level, level_code, audio_qc_status, duration_ms')
          .eq('pix_pck_id', id)
          .order('romance_level', { ascending: true });

        setKupids((kupidRows ?? []) as KupidAsset[]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load PIX inventory');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  // ── Group assets by structure_tag ────────────────────────────────────────
  const grouped = assets
    .reduce<Map<string, KKutAsset[]>>((acc, asset) => {
      const key = asset.structure_tag;
      if (!acc.has(key)) acc.set(key, []);
      acc.get(key)!.push(asset);
      return acc;
    }, new Map());

  const sortedTags = Array.from(grouped.keys()).sort(
    (a, b) => sectionSortKey(a) - sectionSortKey(b) || a.localeCompare(b),
  );

  const passCount = assets.filter((a) => normalizeQc(a.audio_qc_status) === 'pass').length;
  const totalCount = assets.length;

  // The PIX is "empty" only when no KUT Family unit at all exists for it.
  const familyTotal = assets.length + mkuts.length + llfs.length + kupids.length;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="text-[#D4A017] font-bold text-lg hover:opacity-80">
          ← K-KUT
        </Link>
        <nav className="flex gap-4 text-sm text-[#C8A882]">
          <Link href="/kf" className="hover:text-[#D4A017] transition-colors">
            KUT Family
          </Link>
          <Link href="/invention" className="hover:text-[#D4A017] transition-colors">
            Inventions
          </Link>
        </nav>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12 w-full flex flex-col gap-10">

        {/* ── Loading ── */}
        {loading && (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-8 w-1/2 bg-white/10 rounded" />
            <div className="h-4 w-1/3 bg-white/5 rounded" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/10" />
            ))}
          </div>
        )}

        {/* ── Error ── */}
        {!loading && error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-center">
            <p className="text-red-400 font-semibold mb-2">Unable to load PIX inventory</p>
            <p className="text-sm text-[#C8A882]">{error}</p>
            <Link href="/" className="mt-4 inline-block text-[#D4A017] text-sm hover:underline">
              ← Back to K-KUT
            </Link>
          </div>
        )}

        {/* ── Empty ── */}
        {!loading && !error && familyTotal === 0 && (
          <div className="rounded-xl border border-white/10 bg-[#111] p-8 text-center">
            <p className="text-[#F5e6c8] font-semibold mb-2">No KUT Family units found</p>
            <p className="text-sm text-[#C8A882]">
              PIX <code className="text-[#D4A017]">{id}</code> has no assets in inventory yet.
            </p>
            <Link href="/" className="mt-4 inline-block text-[#D4A017] text-sm hover:underline">
              ← Back to K-KUT
            </Link>
          </div>
        )}

        {!loading && !error && familyTotal > 0 && (
          <>
            {/* ── PIX header ── */}
            <section>
              <p className="text-xs uppercase tracking-widest text-[#D4A017] mb-2">PIX Inventory</p>
              <h1 className="text-3xl font-extrabold text-[#F5e6c8] leading-tight mb-1">
                {pixMeta.title ?? id}
              </h1>
              {pixMeta.artist && (
                <p className="text-[#C8A882] text-sm mb-4">{pixMeta.artist}</p>
              )}

              {/* Stats row */}
              <div className="flex flex-wrap gap-3 mt-4">
                <StatChip label="KUT Family units" value={String(familyTotal)} />
                <StatChip label="K-KUTs" value={String(totalCount)} />
                <StatChip label="Audio QC Pass" value={String(passCount)} accent />
                {totalCount - passCount > 0 && (
                  <StatChip label="Pending / Fail" value={String(totalCount - passCount)} />
                )}
                {mkuts.length > 0 && (
                  <StatChip label="mini-KUTs" value={String(mkuts.length)} />
                )}
                {llfs.length > 0 && (
                  <StatChip label="LineFeels" value={String(llfs.length)} />
                )}
                {kupids.length > 0 && (
                  <StatChip label="K-kUpIds" value={String(kupids.length)} />
                )}
              </div>

              {/* Silo gate notice */}
              <div className="mt-5 flex items-start gap-2 rounded-lg border border-[#D4A017]/20 bg-[#D4A017]/5 px-4 py-3">
                <span className="text-[#D4A017] text-base mt-0.5">⚡</span>
                <p className="text-xs text-[#C8A882] leading-relaxed">
                  <strong className="text-[#D4A017]">Audio-first rule:</strong>{' '}
                  Audio QC must pass before any K-KUT enters or leaves the silo.
                  Only <strong className="text-[#F5e6c8]">QC Pass + Active</strong> rows are playable.
                </p>
              </div>
            </section>

            {/* ── K-KUT Catalog ── */}
            {assets.length > 0 && (
            <section>
              <h2 className="text-lg font-bold text-[#F5e6c8] mb-1 uppercase tracking-widest text-sm">
                K-KUT Catalog
              </h2>
              <p className="text-xs text-[#C8A882] mb-6">
                Every section combination — Vocal + Music and Music Only variants.
              </p>

              <div className="flex flex-col gap-4">
                {sortedTags.map((tag) => {
                  const group = grouped.get(tag)!;
                  // Sort variants: VOCAL_MUSIC first
                  const sorted = [...group].sort((a, b) => {
                    const aIsVocal = isVocalVariant(a.variant);
                    const bIsVocal = isVocalVariant(b.variant);
                    return aIsVocal === bIsVocal ? 0 : aIsVocal ? -1 : 1;
                  });

                  return (
                    <div
                      key={tag}
                      className="rounded-xl border border-white/10 bg-[#111] overflow-hidden"
                    >
                      {/* Section tag header */}
                      <div className="px-5 py-3 border-b border-white/10 flex items-center gap-2">
                        <span className="font-mono text-[#D4A017] text-sm font-bold">{tag}</span>
                        <span className="text-[10px] text-[#C8A882]/50 uppercase tracking-widest">
                          {sorted.length === 1 ? '1 variant' : `${sorted.length} variants`}
                        </span>
                      </div>

                      {/* Variants */}
                      <div className="divide-y divide-white/5">
                        {sorted.map((asset) => {
                          const code = activeCode(asset);
                          const isPlayable = asset.audio_qc_status === 'pass' && !!code;

                          return (
                            <div
                              key={asset.id}
                              className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
                            >
                              {/* Left: variant + QC */}
                              <div className="flex flex-col gap-1.5 min-w-0">
                                <span className="text-[#F5e6c8] text-sm font-semibold">
                                  {variantLabel(asset.variant)}
                                </span>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <QcBadge status={asset.audio_qc_status} />
                                  {asset.duration_ms && (
                                    <span className="text-[10px] text-[#C8A882]/50">
                                      {formatDuration(asset.duration_ms)}
                                    </span>
                                  )}
                                  {code && (
                                    <span className="text-[10px] text-[#C8A882]/40 font-mono">
                                      {code.item_type}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Right: action */}
                              {isPlayable ? (
                                <Link
                                  href={`/k/${code!.id}`}
                                  className="shrink-0 px-5 py-2 rounded-full text-sm font-bold bg-[#D4A017] text-[#0a0a0a] hover:bg-[#c49015] transition-colors"
                                >
                                  Play
                                </Link>
                              ) : asset.audio_qc_status === 'fail' ? (
                                <span className="shrink-0 text-xs text-red-400/70 font-semibold">
                                  QC Fail
                                </span>
                              ) : (
                                <span className="shrink-0 text-xs text-[#C8A882]/40 font-semibold">
                                  Pending
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
            )}

            {/* ── mini-KUT Catalog ── */}
            {mkuts.length > 0 && (
              <section>
                <h2 className="text-lg font-bold text-[#F5e6c8] mb-1 uppercase tracking-widest text-sm">
                  mini-KUT Catalog
                </h2>
                <p className="text-xs text-[#C8A882] mb-6">
                  Text micro-assets harvested from this track. Tied to sections.
                  Audio resolved at playback via the associated K-KUT.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {mkuts.map((mk) => (
                    <div
                      key={mk.id}
                      className="rounded-xl border border-white/10 bg-[#111] p-4 flex flex-col gap-2"
                    >
                      <p className="text-[10px] font-mono text-[#D4A017] uppercase">{mk.mk_type}</p>
                      {mk.structure_tag && (
                        <p className="text-[10px] text-[#C8A882]/50">{mk.structure_tag}</p>
                      )}
                      {mk.content && (
                        <p className="text-sm text-[#F5e6c8] italic leading-snug line-clamp-2">
                          "{mk.content}"
                        </p>
                      )}
                      <div className="mt-auto pt-1">
                        {normalizeQc(mk.audio_qc_status) === 'pass' ? (
                          <Link
                            href={`/mkut/${mk.id}`}
                            className="text-xs text-[#D4A017] hover:underline font-semibold"
                          >
                            Play →
                          </Link>
                        ) : (
                          <span className="text-xs text-[#C8A882]/40">
                            {mk.audio_qc_status ?? 'Pending'}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
            {/* ── LineFeel Catalog ── */}
            {llfs.length > 0 && (
              <UnitSection
                unit="sK"
                blurb="Single lyric lines delivered as audio — the smallest audible unit in the KUT Family."
              >
                {llfs.map((llf) => (
                  <UnitRow
                    key={llf.id}
                    unit="sK"
                    title={llf.line_text ?? llf.structure_tag ?? 'LineFeel'}
                    structureTag={llf.structure_tag}
                    variant={llf.variant}
                    durationMs={llf.duration_ms}
                    qcStatus={llf.audio_qc_status}
                    href={`/llf/${llf.id}`}
                  />
                ))}
              </UnitSection>
            )}

            {/* ── K-kUpId Catalog ── */}
            {kupids.length > 0 && (
              <UnitSection
                unit="KUPID"
                blurb="K-KUTs curated and signed for a romance level. A standalone invention, not a delivery vehicle."
              >
                {kupids.map((kupid) => (
                  <UnitRow
                    key={kupid.id}
                    unit="KUPID"
                    title={
                      kupid.level_code
                        ? `K-kUpId · ${kupid.level_code}`
                        : kupid.romance_level
                          ? `K-kUpId · Level ${kupid.romance_level}`
                          : 'K-kUpId'
                    }
                    structureTag={kupid.structure_tag}
                    variant={null}
                    durationMs={kupid.duration_ms}
                    qcStatus={kupid.audio_qc_status}
                    href={`/kupid/${kupid.id}`}
                  />
                ))}
              </UnitSection>
            )}
          </>
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

// ── Sub-components ────────────────────────────────────────────────────────────

function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold ${
        accent
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          : 'border-white/10 bg-[#111] text-[#C8A882]'
      }`}
    >
      <span className={accent ? 'text-emerald-300' : 'text-[#F5e6c8]'}>{value}</span>
      <span className="opacity-70">{label}</span>
    </div>
  );
}

function UnitSection({
  unit,
  blurb,
  children,
}: {
  unit: KfUnitType;
  blurb: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className="text-lg font-bold mb-1 uppercase tracking-widest text-sm"
        style={{ color: unitColor(unit) }}
      >
        {unitLabel(unit)} Catalog
      </h2>
      <p className="text-xs text-[#C8A882] mb-6">{blurb}</p>
      <div className="flex flex-col gap-3">{children}</div>
    </section>
  );
}

function UnitRow({
  unit,
  title,
  structureTag,
  variant,
  durationMs,
  qcStatus,
  href,
}: {
  unit: KfUnitType;
  title: string;
  structureTag: string | null;
  variant: string | null;
  durationMs: number | null;
  qcStatus: string | null;
  href: string;
}) {
  const qc = normalizeQc(qcStatus);

  return (
    <div className="rounded-xl border border-white/10 bg-[#111] px-5 py-4 flex items-center justify-between gap-4 flex-wrap">
      <div className="flex flex-col gap-1.5 min-w-0">
        <span className="text-[#F5e6c8] text-sm font-semibold truncate">{title}</span>
        <div className="flex items-center gap-2 flex-wrap">
          <QcBadge status={qc} />
          {structureTag && (
            <span className="font-mono text-[10px] text-[#C8A882]/60">{structureTag}</span>
          )}
          {variant && (
            <span className="text-[10px] text-[#C8A882]/50">{variantLabel(variant)}</span>
          )}
          {durationMs && (
            <span className="text-[10px] text-[#C8A882]/50">{formatDuration(durationMs)}</span>
          )}
        </div>
      </div>

      {qc === 'pass' ? (
        <Link
          href={href}
          className="shrink-0 px-5 py-2 rounded-full text-sm font-bold text-[#0a0a0a] hover:opacity-90 transition-opacity"
          style={{ backgroundColor: unitColor(unit) }}
        >
          Play
        </Link>
      ) : (
        <span className="shrink-0 text-xs text-[#C8A882]/40 font-semibold">
          {qc === 'fail' ? 'QC Fail' : 'Pending'}
        </span>
      )}
    </div>
  );
}
