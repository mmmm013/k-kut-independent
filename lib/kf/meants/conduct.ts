/**
 * Platform conduct — Platforms NEVER sell.
 *
 * The platform guides Users and serves as their ambassador, not a sales rep.
 * When it is best for the User, it gives the Meant free. The User / Recipient
 * is always right: there is no code path here that disputes them.
 */

/** Everything the platform may do next. There is deliberately no "sell". */
export type PlatformAction =
  /** Help the User find what they mean. */
  | 'GUIDE'
  /** Give it free. */
  | 'GIVE_FREE'
  /** Replace what they got, free, no questions. */
  | 'REPLACE_FREE'
  /** Stop, and leave the User be. */
  | 'STEP_BACK';

export interface UserSignals {
  /** The User or Recipient said something was wrong. */
  reportedIssue?: boolean;
  /** The User is hesitant (the First One Free case on the home page). */
  leery?: boolean;
  /** The User asked the platform to stop. */
  askedToStop?: boolean;
  /** The User has already had a free one. Does not block another when best. */
  hadFreeAlready?: boolean;
}

/**
 * The next best action, always in the User's favour.
 *
 * Order matters: a User who asked to stop is left alone; a reported issue is
 * accepted and replaced free (the VOC rule: a reported issue earns one free
 * corrected element); a leery User gets one free; everyone else is guided.
 */
export function nextBestAction(signals: UserSignals): PlatformAction {
  if (signals.askedToStop) return 'STEP_BACK';
  if (signals.reportedIssue) return 'REPLACE_FREE';
  if (signals.leery) return 'GIVE_FREE';
  return 'GUIDE';
}

/** What the User or Recipient told us about a Meant. */
export type UserVerdict =
  | 'LOVE_IT'
  | 'NOT_QUITE'
  | 'WRONG_THEME'
  | 'AUDIO_ISSUE'
  | 'DOES_NOT_SAY_WHAT_I_MEAN'
  | 'NO_THANKS';

export interface VerdictResolution {
  verdict: UserVerdict;
  /** Always true. The User / Recipient is always right. */
  accepted: true;
  action: PlatformAction | 'KEEP';
  /** Whether the verdict is saved as Voice of Customer for the next Text Loop. */
  recordAsVoc: boolean;
}

/** The User / Recipient is always right, systematically: accept, then act. */
export function honorUserVerdict(verdict: UserVerdict): VerdictResolution {
  switch (verdict) {
    case 'LOVE_IT':
      return { verdict, accepted: true, action: 'KEEP', recordAsVoc: true };
    case 'NO_THANKS':
      return { verdict, accepted: true, action: 'STEP_BACK', recordAsVoc: true };
    case 'NOT_QUITE':
      return { verdict, accepted: true, action: 'GUIDE', recordAsVoc: true };
    default:
      // WRONG_THEME, AUDIO_ISSUE, DOES_NOT_SAY_WHAT_I_MEAN: their call, our fix.
      return { verdict, accepted: true, action: 'REPLACE_FREE', recordAsVoc: true };
  }
}

/**
 * Sales-rep language the platform never uses. Guiding words ("guide",
 * "hear it again", "first one free") are fine; pressure is not.
 */
const SALES_PATTERNS: ReadonlyArray<[RegExp, string]> = [
  [/\bbuy (it )?now\b/i, 'buy now'],
  [/\border now\b/i, 'order now'],
  [/\bact (now|fast)\b/i, 'act now'],
  [/\bhurry\b/i, 'hurry'],
  [/\blimited[- ]time\b/i, 'limited time'],
  [/\bonly \d+ left\b/i, 'scarcity count'],
  [/\blast chance\b/i, 'last chance'],
  [/\bdon'?t miss (out)?\b/i, "don't miss out"],
  [/\bexclusive (offer|deal)\b/i, 'exclusive offer'],
  [/\bspecial offer\b/i, 'special offer'],
  [/\bupgrade now\b/i, 'upgrade now'],
  [/\b\d+% off\b/i, 'discount pressure'],
  [/\bupsell\b/i, 'upsell'],
  [/\bfor a limited\b/i, 'limited'],
  [/\bexpires? (soon|today|tonight)\b/i, 'expiry pressure'],
];

/** Every sales-rep phrase in a piece of platform copy. Empty means clean. */
export function findSalesLanguage(text: string): string[] {
  return SALES_PATTERNS.filter(([pattern]) => pattern.test(text)).map(([, label]) => label);
}
