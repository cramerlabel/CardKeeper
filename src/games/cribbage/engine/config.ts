import type { CribbageConfig, ScoreKindInfo } from './types';

export const MAX_EVENT_POINTS = 29;
export const HEELS_POINTS = 2;

export const STANDARD_CONFIG: CribbageConfig = { target: 121, skunkLine: 91, doubleSkunkLine: 61 };
// Assumption: a short game has a skunk at 31 and no double skunk.
export const SHORT_CONFIG: CribbageConfig = { target: 61, skunkLine: 31, doubleSkunkLine: null };

export function getConfig(target: 121 | 61): CribbageConfig {
  return target === 61 ? SHORT_CONFIG : STANDARD_CONFIG;
}

export const SCORE_KINDS: readonly ScoreKindInfo[] = [
  { kind: 'pegging', label: 'Pegging', hint: 'Points during the play' },
  { kind: 'hand', label: 'Hand', hint: 'Counting a hand' },
  { kind: 'crib', label: 'Crib', hint: "Dealer's crib" },
  { kind: 'heels', label: 'His heels', hint: 'Jack cut as starter: 2 for dealer' },
  { kind: 'other', label: 'Other', hint: 'Any other adjustment' },
];
