'use client';

/**
 * K-kUpId Delivery Page — /kupid/[id]
 *
 * K-kUpId is a standalone invention, not a delivery vehicle: a K-KUT curated
 * and signed for one of the five romance levels. Rows live in `kupid_assets`.
 *
 * Gate (identical to every other KUT Family surface):
 *   1. `audio_qc_status` must be 'pass'.
 *   2. `kupid_audio_url` must resolve and must not be PIX / source / full-track audio.
 *
 * `/kupid` (no id) remains the romance-level picker.
 */

import { use, useEffect, useState } from 'react';

import KfUnitPlayer from '../../_components/KfUnitPlayer';
import { createClient } from '../../../lib/supabase/browser';
import {
  formatDuration,
  isForbiddenSourceUrl,
  normalizeQc,
  variantLabel,
} from '../../../lib/kf/classify';
import { KUPID_LEVELS } from '../../../lib/kf/types';

interface KupidRow {
  id: string;
  structure_tag: string | null;
  variant: string | null;
  romance_level: number | null;
  level_code: string | null;
  gift_note: string | null;
  gifted_by: string | null;
  audio_qc_status: string | null;
  duration_ms: number | null;
  kupid_audio_url: string | null;
}

function levelLabel(row: KupidRow): string | null {
  const match = KUPID_LEVELS.find(
    (level) => level.level === row.romance_level || level.code === row.level_code,
  );
  return match ? `Level ${match.level} · ${match.label}` : null;
}

export default function KupidDeliveryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [row, setRow] = useState<KupidRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase
          .from('kupid_assets')
          .select('id, structure_tag, variant, romance_level, level_code, gift_note, gifted_by, audio_qc_status, duration_ms, kupid_audio_url')
          .eq('id', id)
          .maybeSingle();

        if (!alive) return;

        if (queryError) {
          setError(queryError.message);
          return;
        }

        if (!data) {
          setError('This K-kUpId was not found in the KUT SSOT.');
          return;
        }

        const kupid = data as KupidRow;

        if (normalizeQc(kupid.audio_qc_status) !== 'pass') {
          setError('Blocked: audio QC has not passed for this K-kUpId.');
          return;
        }

        if (!kupid.kupid_audio_url) {
          setError('Blocked: this K-kUpId has no approved delivery audio.');
          return;
        }

        if (isForbiddenSourceUrl(kupid.kupid_audio_url)) {
          setError('Blocked: this K-kUpId points at PIX/source audio instead of an approved render.');
          return;
        }

        setRow(kupid);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Failed to load K-kUpId');
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();

    return () => {
      alive = false;
    };
  }, [id]);

  return (
    <KfUnitPlayer
      unit="KUPID"
      loading={loading}
      error={error}
      title={row ? levelLabel(row) ?? 'K-kUpId' : null}
      subtitle={row?.gift_note ? `“${row.gift_note}”` : row?.structure_tag ?? null}
      audioUrl={row?.kupid_audio_url ?? null}
      caption={
        row
          ? [
              row.duration_ms ? formatDuration(row.duration_ms) : null,
              row.variant ? variantLabel(row.variant) : null,
              row.gifted_by ? `from ${row.gifted_by}` : null,
            ]
              .filter(Boolean)
              .join(' · ') || null
          : null
      }
    />
  );
}
