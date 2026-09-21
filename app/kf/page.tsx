'use client';

/**
 * KUT Family Inventory — /kf
 *
 * The single inventory surface for every delivery unit G Putnam Music issues:
 *   K-KUT · mini-KUT · LineFeel · K-kUpId
 *
 * Reads /api/kf/inventory, which applies one gate to all four unit types:
 * audio QC must pass, the audio URL must not be PIX/source audio, and a K-KUT
 * additionally needs an active redemption code. Anything that fails the gate is
 * listed but not playable, with the reason shown — the inventory is complete
 * even when the catalog is not.
 *
 * Optional filters: /kf?pix=<pix_pck_id>&type=KUT|mK|LLF|KUPID
 */

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { unitColor, unitLabel, formatDuration } from '../../lib/kf/classify';
import { KF_UNIT_TYPES, KfInventoryResponse, KfUnitType } from '../../lib/kf/types';

type Filter = KfUnitType | 'ALL';

function KfInventory() {
  const searchParams = useSearchParams();
  const pix = searchParams.get('pix');
  const typeParam = searchParams.get('type');
  const initialFilter: Filter = (KF_UNIT_TYPES as readonly string[]).includes(typeParam ?? '')
    ? (typeParam as KfUnitType)
    : 'ALL';

  const [data, setData] = useState<KfInventoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>(initialFilter);

  useEffect(() => {
    let alive = true;
    setLoading(true);

    const query = pix ? `?pix=${encodeURIComponent(pix)}` : '';

    fetch(`/api/kf/inventory${query}`)
      .then((res) => res.json())
      .then((body) => {
        if (!alive) return;
        if (!body?.ok) {
          setError(body?.message ?? 'The KUT Family inventory could not be loaded.');
          return;
        }
        setData(body as KfInventoryResponse);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : 'Failed to load inventory');
      })
      .finally(() => {
        if (alive) setLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [pix]);

  const visible = useMemo(() => {
    if (!data) return [];
    if (filter === 'ALL') return data.items;
    return data.items.filter((item) => item.unit_type === filter);
  }, [data, filter]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ── Header ── */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="text-[#D4A017] font-bold text-lg hover:opacity-80">← K-KUT</Link>
        <nav className="flex gap-4 text-sm text-[#C8A882]">
          <Link href="/invention" className="hover:text-[#D4A017] transition-colors">Inventions</Link>
          <Link href="/demo" className="hover:text-[#D4A017] transition-colors">Demo</Link>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 w-full flex flex-col gap-10">
        <section>
          <p className="text-xs uppercase tracking-widest text-[#D4A017] mb-2">KUT Family Inventory</p>
          <h1 className="text-3xl font-extrabold text-[#F5e6c8] leading-tight mb-2">
            {pix ? `PIX ${pix}` : 'Every delivery unit'}
          </h1>
          <p className="text-sm text-[#C8A882] leading-relaxed max-w-2xl">
            K-KUT, mini-KUT, LineFeel and K-kUpId — one inventory, one gate.
            A unit is playable only when audio QC has passed and its audio is an
            approved delivery render. PIX and full-track source audio is never a
            delivery unit.
          </p>
        </section>

        {loading && (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-8 w-1/2 bg-white/10 rounded" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-white/5 rounded-xl border border-white/10" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 p-6 text-center">
            <p className="text-red-400 font-semibold mb-2">Unable to load the KUT Family inventory</p>
            <p className="text-sm text-[#C8A882]">{error}</p>
            <Link href="/" className="mt-4 inline-block text-[#D4A017] text-sm hover:underline">
              ← Back to K-KUT
            </Link>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* ── Family rollup ── */}
            <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {data.families.map((family) => (
                <div
                  key={family.unit_type}
                  className="rounded-xl border border-white/10 bg-[#111] p-4 flex flex-col gap-1"
                  style={{ borderColor: `${unitColor(family.unit_type)}33` }}
                >
                  <p
                    className="text-[10px] font-mono uppercase tracking-widest"
                    style={{ color: unitColor(family.unit_type) }}
                  >
                    {unitLabel(family.unit_type)}
                  </p>
                  <p className="text-2xl font-extrabold text-[#F5e6c8]">{family.total}</p>
                  <p className="text-[11px] text-[#C8A882]">
                    {family.playable} playable · {family.qc_pass} QC pass
                  </p>
                </div>
              ))}
            </section>

            {/* ── Totals + completeness ── */}
            <section className="flex flex-wrap items-center gap-3">
              <StatChip label="Units" value={String(data.totals.total)} />
              <StatChip label="Audio QC Pass" value={String(data.totals.qc_pass)} accent />
              <StatChip label="Playable" value={String(data.totals.playable)} accent />
              {data.totals.total - data.totals.playable > 0 && (
                <StatChip
                  label="Held at the gate"
                  value={String(data.totals.total - data.totals.playable)}
                />
              )}
            </section>

            {data.unavailable.length > 0 && (
              <div className="flex items-start gap-2 rounded-lg border border-[#D4A017]/20 bg-[#D4A017]/5 px-4 py-3">
                <span className="text-[#D4A017] text-base mt-0.5">⚡</span>
                <p className="text-xs text-[#C8A882] leading-relaxed">
                  <strong className="text-[#D4A017]">Partial inventory:</strong>{' '}
                  {data.unavailable.join(', ')} could not be read. Run the migrations in{' '}
                  <code className="text-[#F5e6c8]">supabase/migrations/</code> and check the
                  read policies for the anon role.
                </p>
              </div>
            )}

            {/* ── Filter ── */}
            <section className="flex flex-wrap gap-2">
              <FilterChip
                label="All"
                active={filter === 'ALL'}
                color="#F5e6c8"
                onClick={() => setFilter('ALL')}
              />
              {KF_UNIT_TYPES.map((unit) => (
                <FilterChip
                  key={unit}
                  label={unitLabel(unit)}
                  active={filter === unit}
                  color={unitColor(unit)}
                  onClick={() => setFilter(unit)}
                />
              ))}
            </section>

            {/* ── Units ── */}
            <section className="flex flex-col gap-3">
              {visible.length === 0 ? (
                <div className="rounded-xl border border-white/10 bg-[#111] p-8 text-center">
                  <p className="text-[#F5e6c8] font-semibold mb-2">Nothing in inventory yet</p>
                  <p className="text-sm text-[#C8A882]">
                    {pix
                      ? <>PIX <code className="text-[#D4A017]">{pix}</code> has no KUT Family units.</>
                      : 'No KUT Family units are visible to this client.'}
                  </p>
                </div>
              ) : (
                visible.map((item) => (
                  <div
                    key={`${item.unit_type}-${item.id}`}
                    className="rounded-xl border border-white/10 bg-[#111] px-5 py-4 flex items-center justify-between gap-4 flex-wrap"
                  >
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full border"
                          style={{
                            color: unitColor(item.unit_type),
                            borderColor: `${unitColor(item.unit_type)}55`,
                          }}
                        >
                          {unitLabel(item.unit_type)}
                        </span>
                        {item.structure_tag && (
                          <span className="font-mono text-xs text-[#C8A882]">{item.structure_tag}</span>
                        )}
                        {item.duration_ms && (
                          <span className="text-[10px] text-[#C8A882]/50">
                            {formatDuration(item.duration_ms)}
                          </span>
                        )}
                      </div>
                      <span className="text-[#F5e6c8] text-sm font-semibold truncate">{item.label}</span>
                      {item.blocked_reason && (
                        <span className="text-[11px] text-[#C8A882]/60">{item.blocked_reason}</span>
                      )}
                    </div>

                    {item.playable && item.href ? (
                      <Link
                        href={item.href}
                        className="shrink-0 px-5 py-2 rounded-full text-sm font-bold bg-[#D4A017] text-[#0a0a0a] hover:bg-[#c49015] transition-colors"
                      >
                        Play
                      </Link>
                    ) : (
                      <span className="shrink-0 text-xs text-[#C8A882]/40 font-semibold uppercase tracking-widest">
                        {item.audio_qc_status === 'fail' ? 'QC Fail' : 'Held'}
                      </span>
                    )}
                  </div>
                ))
              )}
            </section>
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

export default function KfInventoryPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#C8A882]">Loading inventory…</div>}>
      <KfInventory />
    </Suspense>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
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

function FilterChip({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-1.5 rounded-full border text-xs font-semibold transition-colors"
      style={{
        color: active ? '#0a0a0a' : color,
        backgroundColor: active ? color : 'transparent',
        borderColor: active ? color : `${color}44`,
      }}
    >
      {label}
    </button>
  );
}
