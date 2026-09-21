'use client';

/**
 * LineFeel Playback Page — /llf/[id]
 *
 * A LineFeel (LLF) is a single lyric line delivered as audio — the smallest
 * audible unit in the KUT Family. Rows live in `llf_assets`.
 *
 * Gate (identical to every other KUT Family surface):
 *   1. `audio_qc_status` must be 'pass'.
 *   2. `llf_audio_url` must resolve and must not be PIX / source / full-track audio.
 *
 * Read with the anon key, so Row Level Security has the final say.
 */

import { use, useEffect, useState } from 'react';

import KfUnitPlayer from '../../_components/KfUnitPlayer';
import {
  KF_REFERENCE_NOTICE,
  KF_REFERENCE_UI_ENABLED,
} from '../../../lib/kf/reference-mode';
import { createClient } from '../../../lib/supabase/browser';
import {
  formatDuration,
  isForbiddenSourceUrl,
  normalizeQc,
  variantLabel,
} from '../../../lib/kf/classify';

interface LlfRow {
  id: string;
  structure_tag: string | null;
  variant: string | null;
  line_text: string | null;
  audio_qc_status: string | null;
  duration_ms: number | null;
  llf_audio_url: string | null;
}

export default function LineFeelPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const [row, setRow] = useState<LlfRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    async function load() {
      // Reference surface, off by default — never query while disabled.
      if (!KF_REFERENCE_UI_ENABLED) {
        if (alive) {
          setError(KF_REFERENCE_NOTICE.message);
          setLoading(false);
        }
        return;
      }

      try {
        const supabase = createClient();
        const { data, error: queryError } = await supabase
          .from('llf_assets')
          .select('id, structure_tag, variant, line_text, audio_qc_status, duration_ms, llf_audio_url')
          .eq('id', id)
          .maybeSingle();

        if (!alive) return;

        if (queryError) {
          setError(queryError.message);
          return;
        }

        if (!data) {
          setError('This LineFeel was not found in the KUT SSOT.');
          return;
        }

        const llf = data as LlfRow;

        if (normalizeQc(llf.audio_qc_status) !== 'pass') {
          setError('Blocked: audio QC has not passed for this LineFeel.');
          return;
        }

        if (!llf.llf_audio_url) {
          setError('Blocked: this LineFeel has no approved delivery audio.');
          return;
        }

        if (isForbiddenSourceUrl(llf.llf_audio_url)) {
          setError('Blocked: this LineFeel points at PIX/source audio instead of an approved render.');
          return;
        }

        setRow(llf);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : 'Failed to load LineFeel');
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
      unit="sK"
      loading={loading}
      error={error}
      title={row?.line_text ?? row?.structure_tag ?? null}
      subtitle={row?.line_text && row?.structure_tag ? row.structure_tag : null}
      audioUrl={row?.llf_audio_url ?? null}
      caption={
        row
          ? [
              row.duration_ms ? formatDuration(row.duration_ms) : null,
              row.variant ? variantLabel(row.variant) : null,
            ]
              .filter(Boolean)
              .join(' · ') || null
          : null
      }
    />
  );
}
