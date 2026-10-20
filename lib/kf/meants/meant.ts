/**
 * A Meant working copy: its SSOT origin, full-audio integrity, TPs and
 * boundaries, Text Loop history, and its Product Tier. A Meant IS a HUG, a
 * TUG or a BUG: KK = HUG, sK = TUG, mK = BUG.
 *
 * `validateMeant()` is the one gate every surface calls. It returns every
 * violation rather than stopping at the first, so a working copy can be fixed
 * in one pass.
 */

import { isForbiddenSourceUrl } from '../classify';
import {
  MEANT_TYPES,
  MeantTypeCode,
  ProductTier,
  STRATEGY_GRANULARITIES,
  StrategyGranularity,
} from './catalog';

// ── Product Tiers ────────────────────────────────────────────────────────────

/** How a tier may reach a User. */
export type DeliveryTrigger =
  /** The User asked for it, explicitly. */
  | 'user_request'
  /** The platform offered it while guiding the User. */
  | 'platform_suggestion'
  /** Part of a follow-up touch (e.g. First One Free's 3-in-3). */
  | 'follow_up'
  /** Sent on a schedule. */
  | 'scheduled';

export interface TierRule {
  tier: ProductTier;
  /** Tier rank: HUG (KK) 1, TUG (sK) 2, BUG (mK) 3. */
  rank: 1 | 2 | 3;
  usesThemes: boolean;
  usesEmotions: boolean;
  usesScenarios: boolean;
  /** Triggers this tier may be delivered on. */
  allowedTriggers: readonly DeliveryTrigger[];
}

export const TIER_RULES: Record<ProductTier, TierRule> = {
  HUG: {
    tier: 'HUG', rank: 1, usesThemes: true, usesEmotions: true, usesScenarios: true,
    allowedTriggers: ['user_request', 'platform_suggestion', 'follow_up', 'scheduled'],
  },
  TUG: {
    tier: 'TUG', rank: 2, usesThemes: true, usesEmotions: true, usesScenarios: true,
    allowedTriggers: ['user_request', 'platform_suggestion', 'follow_up', 'scheduled'],
  },
  // BUGs never carry Themes, Emotions or Scenarios, and arrive ON DEMAND ONLY.
  BUG: {
    tier: 'BUG', rank: 3, usesThemes: false, usesEmotions: false, usesScenarios: false,
    allowedTriggers: ['user_request'],
  },
};

/** May this tier be delivered on this trigger? BUGs only when the User asks. */
export function canDeliverTier(tier: ProductTier, trigger: DeliveryTrigger): boolean {
  return TIER_RULES[tier].allowedTriggers.includes(trigger);
}

/** One KKr strategy, from a single word up to a whole song section. */
export interface Strategy {
  granularity: StrategyGranularity;
  text: string;
}

export interface TierPlan {
  strategies: Strategy[];
  /**
   * Kept as three separate fields: sentiment, emotion and scenario must stay
   * independently inspectable (reference/NOT-DEPLOYED/README.md).
   */
  themes: string[];
  emotions: string[];
  scenarios: string[];
}

// ── The working copy ─────────────────────────────────────────────────────────

/** A time point pair into the source audio, in seconds. */
export interface TpRange {
  start_seconds: number;
  end_seconds: number;
}

export interface MeantClone {
  /** Always a working copy: KKr never publishes or approves. */
  authority: 'KKR_WORKING_COPY';
  meant_id: string;
  type: MeantTypeCode;
  subtype: string | null;

  /** The SSOT clone this Meant was grabbed from, by object id and hash. */
  ssot: {
    clone_id: string;
    clone_sha256: string;
    lt_pix_id: string;
    authority_src_id: string;
    parent_id: string | null;
    parent_sha256: string;
    /** Identity is by hash, never by title. */
    matched_by: 'object_id_and_sha256';
  };

  /** Full audio: vocals and instrumentals both, always. */
  audio: {
    vocals: boolean;
    instrumentals: boolean;
    variant: string;
    url: string | null;
  };

  /** InTP is the original boundary; VTP is the verified one inside it. */
  tps: {
    intp: TpRange;
    vtp: TpRange | null;
  };
  /** The parent's bounds. A Meant may never escape them. */
  parent_bounds: TpRange | null;

  /** Text Loop runs this Meant has been through, in order. */
  text_loops: string[];
  humanizing: 'RAW' | 'LOOPING' | 'HUMANIZED';

  /** Which Meant this is. Must equal the tier of its type. */
  tier: ProductTier;
  /** The KKr instructions for this Meant. */
  plan: TierPlan;
}

/** "MULTIPLE Text Loops": a Meant is not humanized until at least two have run. */
export const MIN_TEXT_LOOPS = 2;

export interface MeantViolation {
  code: string;
  message: string;
}

const SHA = /^[0-9a-f]{64}$/;

function ordered(r: TpRange): boolean {
  return Number.isFinite(r.start_seconds) && Number.isFinite(r.end_seconds) &&
    r.start_seconds >= 0 && r.end_seconds > r.start_seconds;
}

function within(inner: TpRange, outer: TpRange): boolean {
  return inner.start_seconds >= outer.start_seconds && inner.end_seconds <= outer.end_seconds;
}

/** Every rule a Meant working copy must satisfy. Empty array means valid. */
export function validateMeant(m: MeantClone): MeantViolation[] {
  const out: MeantViolation[] = [];
  const fail = (code: string, message: string) => out.push({ code, message });

  if (m.authority !== 'KKR_WORKING_COPY') {
    fail('NOT_A_WORKING_COPY', 'A Meant clone is a KKr working copy; it never carries approval.');
  }

  // Type and subtype must be a cloned Element Type.
  const type = MEANT_TYPES[m.type];
  if (!type) {
    fail('UNKNOWN_TYPE', `"${m.type}" is not a cloned Element Type.`);
  } else if (m.subtype !== null && !type.subtypes.some((s) => s.code === m.subtype)) {
    fail('UNKNOWN_SUBTYPE', `"${m.subtype}" is not a subtype of ${type.code}.`);
  }

  // SSOT origin: by object id and SHA-256, never by title.
  if (!m.ssot.clone_id) fail('NO_SSOT_CLONE', 'A Meant must be grabbed from an SSOT clone.');
  if (!SHA.test(m.ssot.clone_sha256)) fail('BAD_CLONE_SHA256', 'SSOT clone SHA-256 is missing or invalid.');
  if (!SHA.test(m.ssot.parent_sha256)) fail('MISSING_OR_INVALID_PARENT_SHA256', 'Parent SHA-256 is missing or invalid.');
  if (!m.ssot.lt_pix_id || !m.ssot.authority_src_id) {
    fail('LINEAGE_INCOMPLETE', 'A Meant must retain its LT-PIX and authority SRC ids.');
  }
  if (m.ssot.matched_by !== 'object_id_and_sha256') {
    fail('TITLE_MATCHED', 'Identity is by object id and SHA-256, never by title.');
  }

  // Full audio: vocals and instrumentals are never lost.
  if (!m.audio.vocals) fail('VOCALS_LOST', 'A Meant must keep its vocals.');
  if (!m.audio.instrumentals) fail('INSTRUMENTALS_LOST', 'A Meant must keep its instrumentals.');
  if (m.audio.variant !== 'VOCAL_MUSIC') {
    fail('NOT_FULL_AUDIO', `A Meant is VOCAL_MUSIC only; "${m.audio.variant}" drops a layer.`);
  }
  // Full audio is not the full master: LT-PIX itself never ships.
  if (m.audio.url !== null && isForbiddenSourceUrl(m.audio.url)) {
    fail('FORBIDDEN_SOURCE_AUDIO', 'A Meant may never point at PIX, source or full-track audio.');
  }

  // TPs and boundaries.
  if (!ordered(m.tps.intp)) fail('INTP_UNORDERED', 'InTP must start at or after 0 and end after it starts.');
  if (m.tps.vtp) {
    if (!ordered(m.tps.vtp)) fail('VTP_UNORDERED', 'VTP must start at or after 0 and end after it starts.');
    else if (!within(m.tps.vtp, m.tps.intp)) {
      fail('APPROVED_BOUNDARY_OUTSIDE_SOURCE_KK', 'VTP must lie inside the original InTP.');
    }
  }
  if (m.parent_bounds && ordered(m.tps.intp) && !within(m.tps.intp, m.parent_bounds)) {
    fail('ESCAPES_PARENT_BOUNDS', 'A Meant may never escape its parent\'s bounds.');
  }

  // Text Loops.
  const loops = new Set(m.text_loops.filter(Boolean));
  if (loops.size !== m.text_loops.length) fail('DUPLICATE_TEXT_LOOP', 'Each Text Loop run is counted once.');
  if (m.humanizing === 'HUMANIZED' && loops.size < MIN_TEXT_LOOPS) {
    fail('TOO_FEW_TEXT_LOOPS', `HUMANIZED needs at least ${MIN_TEXT_LOOPS} Text Loop runs.`);
  }

  // The Meant IS its tier: KK = HUG, sK = TUG, mK = BUG.
  if (type) {
    if (type.tier === null) {
      fail('NOT_A_MEANT_KIND', `${type.code} is not a HUG, TUG or BUG, so it cannot be a Meant.`);
    } else if (m.tier !== type.tier) {
      fail('TIER_MISMATCH', `A ${type.code} is a ${type.tier}, not a ${m.tier}.`);
    }
  }

  const tier = m.tier;
  const rule = TIER_RULES[tier];
  const plan = m.plan;
  if (!rule) {
    fail('UNKNOWN_TIER', `"${tier}" is not HUG, TUG or BUG.`);
  } else if (!plan) {
    fail('NO_PLAN', `${tier} has no KKr instructions.`);
  } else {
    if (plan.strategies.length === 0) fail('NO_STRATEGY', `${tier} has no KKr strategy.`);
    for (const s of plan.strategies) {
      if (!(STRATEGY_GRANULARITIES as readonly string[]).includes(s.granularity)) {
        fail('BAD_GRANULARITY', `${tier}: "${s.granularity}" is not a strategy granularity.`);
      } else if (type && !type.granularities.includes(s.granularity)) {
        fail('GRANULARITY_NOT_FOR_TYPE', `${tier}: ${type.code} has no ${s.granularity} strategies.`);
      }
      if (!s.text.trim()) fail('EMPTY_STRATEGY', `${tier}: a strategy has no text.`);
    }

    if (!rule.usesThemes && plan.themes.length) fail('BUG_HAS_THEMES', `${tier} never uses Themes.`);
    if (!rule.usesEmotions && plan.emotions.length) fail('BUG_HAS_EMOTIONS', `${tier} never uses Emotions.`);
    if (!rule.usesScenarios && plan.scenarios.length) fail('BUG_HAS_SCENARIOS', `${tier} never uses Scenarios.`);

    if (rule.usesThemes && !plan.themes.length && !plan.emotions.length && !plan.scenarios.length) {
      fail('NO_SENTIMENT', `${tier} works with Themes, Emotions and Scenarios; it has none.`);
    }
  }

  return out;
}
