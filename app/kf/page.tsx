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
 * Shows theme coverage first: which of the seven themes have a playable unit
 * in every container, and which containers are still empty for a theme.
 *
 * Optional filters: /kf?pix=<pix_pck_id>&type=KUT|mK|LLF|KUPID&theme=love
 */

import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import { themeColor, unitColor, unitLabel, formatDuration } from '../../lib/kf/classify';
import { KF_REFERENCE_NOTICE, KF_REFERENCE_UI_ENABLED } from '../../lib/kf/reference-mode';
import {
  KF_THEMES,
  KF_UNIT_TYPES,
  KfInventoryResponse,
  KfTheme,
  KfUnitType,
} from '../../lib/kf/types';

type Filter = KfUnitType | 'ALL';
type ThemeFilter = KfTheme | 'ALL';

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
  const [themeFilter, setThemeFilter] = useState<ThemeFilter>(
    (KF_THEMES as readonly string[]).includes(searchParams.get('theme') ?? '')
      ? (searchParams.get('theme') as KfTheme)
      : 'ALL',
  );

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
    return data.items.filter(
      (item) =>
        (filter === 'ALL' || item.unit_type === filter) &&
        (themeFilter === 'ALL' || item.theme === themeFilter),
    );
  }, [data, filter, themeFilter]);

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
            {/* ── Theme coverage ── */}
            <section>
              <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
                <h2 className="text-sm font-bold text-[#F5e6c8] uppercase tracking-widest">
                  Theme coverage
                </h2>
                <p className="text-xs text-[#C8A882]">
                  <span className="text-emerald-400 font-semibold">
                    {data.satisfied_themes.length}
                  </span>
                  {' '}of {data.coverage.length} themes satisfied
                </p>
              </div>
              <p className="text-xs text-[#C8A882] mb-4">
                A theme is <strong className="text-[#F5e6c8]">satisfied</strong> when it has at
                least one playable unit in every container. Zeros are the work left.
              </p>

              <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#111]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left font-semibold text-[#C8A882] px-4 py-3 text-xs uppercase tracking-widest">
                        Theme
                      </th>
                      {KF_UNIT_TYPES.map((unit) => (
                        <th
                          key={unit}
                          className="px-3 py-3 text-xs font-mono uppercase tracking-widest"
                          style={{ color: unitColor(unit) }}
                        >
                          {unitLabel(unit)}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-xs uppercase tracking-widest text-[#C8A882]">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.coverage.map((row) => (
                      <tr key={row.theme} className="border-b border-white/5 last:border-0">
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() =>
                              setThemeFilter(themeFilter === row.theme ? 'ALL' : row.theme)
                            }
                            className="font-semibold hover:underline"
                            style={{
                              color: themeFilter === row.theme ? '#F5e6c8' : themeColor(row.theme),
                            }}
                          >
                            {row.label}
                          </button>
                        </td>
                        {KF_UNIT_TYPES.map((unit) => (
                          <td
                            key={unit}
                            className={`px-3 py-3 text-center font-mono ${
                              row.required[unit] === 0
                                ? 'text-[#C8A882]/40'
                                : row.containers[unit] >= row.required[unit]
                                  ? 'text-emerald-400'
                                  : 'text-red-400/70'
                            }`}
                          >
                            {row.containers[unit]}
                            {row.required[unit] > 0 && (
                              <span className="text-[#C8A882]/50">/{row.required[unit]}</span>
                            )}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-center">
                          {row.satisfied ? (
                            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              Satisfied
                            </span>
                          ) : !row.has_floor ? (
                            <span className="text-[10px] text-[#C8A882]/40 uppercase tracking-widest">
                              no floor set
                            </span>
                          ) : (
                            <span className="text-[10px] text-[#C8A882]/70">{row.still_needed}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

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

            <section className="flex flex-wrap gap-2">
              <FilterChip
                label="All themes"
                active={themeFilter === 'ALL'}
                color="#F5e6c8"
                onClick={() => setThemeFilter('ALL')}
              />
              {data.coverage.map((row) => (
                <FilterChip
                  key={row.theme}
                  label={row.label}
                  active={themeFilter === row.theme}
                  color={themeColor(row.theme)}
                  onClick={() => setThemeFilter(row.theme)}
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
                        {item.theme && (
                          <span
                            className="text-[10px] font-semibold uppercase tracking-widest"
                            style={{ color: themeColor(item.theme) }}
                          >
                            {item.theme}
                          </span>
                        )}
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
  if (!KF_REFERENCE_UI_ENABLED) return <ReferenceDisabled />;

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

/** Shown when the reference surfaces are disabled, which is the default. */
function ReferenceDisabled() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <Link href="/" className="text-[#D4A017] font-bold text-lg hover:opacity-80">← K-KUT</Link>
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg rounded-xl border border-[#D4A017]/30 bg-[#111] p-6">
          <p className="text-xs uppercase tracking-widest text-[#D4A017] mb-2">
            {KF_REFERENCE_NOTICE.code}
          </p>
          <h1 className="text-xl font-bold text-[#F5e6c8] mb-3">
            {KF_REFERENCE_NOTICE.title}
          </h1>
          <p className="text-sm text-[#C8A882] leading-relaxed">
            {KF_REFERENCE_NOTICE.message}
          </p>
        </div>
      </main>
    </div>
  );
}
