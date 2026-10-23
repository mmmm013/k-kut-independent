/**
 * Reference-mode kill switch.
 *
 * The KUT Family surfaces in this repository (/kf, /api/kf/inventory,
 * /llf/[id], /kupid/[id]) read asset tables directly and treat
 * `audio_qc_status = 'pass'` as playable.
 *
 * The owner's Current-II Authority map is explicit that this is not authority:
 *
 *   "m_kut_assets ... its pass is generated from URL presence, not current
 *    per-LT-PIX authority."
 *   "do not equate derived pass with current authority."
 *
 * and it already names /k/[id] and /mkut/[id] as surfaces that reach around
 * the governed publication bridge and the canary STAGE gate. These surfaces
 * would do the same, against a live project holding 34,251 m_kut_assets rows.
 *
 * The governed catalog currently authorizes ZERO public IIs — two canary
 * records, both TRIAGE, none STAGE. So these surfaces are OFF unless
 * deliberately enabled for local inspection, and they must never be enabled in
 * a deployed environment. (This is not the Aug 30 freeze, which holds nothing:
 * owner, 2026-10-23. These surfaces would bypass STAGE, which is the reason.)
 *
 * Enable locally only:  NEXT_PUBLIC_KF_REFERENCE_UI=1 npm run dev
 */
export const KF_REFERENCE_UI_ENABLED =
  process.env.NEXT_PUBLIC_KF_REFERENCE_UI === '1';

/** Shown wherever a reference surface is asked for while disabled. */
export const KF_REFERENCE_NOTICE = {
  code: 'KF_REFERENCE_UI_DISABLED',
  title: 'Not a governed surface',
  message:
    'This KUT Family surface is a reference implementation and is not connected ' +
    'to the governed publication bridge. It reads asset tables directly and ' +
    'would present held candidates as if they were releasable, bypassing ' +
    'STAGE. Nothing is served here.',
} as const;
