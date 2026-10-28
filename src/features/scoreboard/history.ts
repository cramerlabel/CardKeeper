import {
  DEFAULT_SCORING_CONFIG,
  type HandOutcome,
  type HandRecord,
  type Pair,
  type PlayerId,
} from '@/games/ginRummy/engine';

export const OUTCOME_LABELS: Record<HandOutcome, string> = {
  knock: 'Knock',
  undercut: 'Undercut',
  gin: 'Gin',
  bigGin: 'Big Gin',
};

export interface HistoryRow {
  id: string;
  number: number;
  winner: PlayerId;
  winnerName: string;
  outcome: HandOutcome;
  outcomeLabel: string;
  points: number;
  /** Deadwood per player, indexed by PlayerId. */
  deadwood: Pair;
  /** Running totals after this hand. */
  totals: Pair;
}

/** One row per hand in play order, each with the running totals after that hand. */
export function buildHistoryRows(
  hands: readonly HandRecord[],
  players: readonly [string, string],
): HistoryRow[] {
  const totals: Pair = [0, 0];
  return hands.map((hand) => {
    totals[hand.winner] += hand.points;
    return {
      id: hand.id,
      number: hand.number,
      winner: hand.winner,
      winnerName: players[hand.winner],
      outcome: hand.outcome,
      outcomeLabel: OUTCOME_LABELS[hand.outcome],
      points: hand.points,
      deadwood: [hand.input.deadwood[0], hand.input.deadwood[1]],
      totals: [totals[0], totals[1]],
    };
  });
}

/** Player with the strictly higher total, or null when tied (including 0-0). */
export function leaderOf(totals: Readonly<Pair>): PlayerId | null {
  if (totals[0] === totals[1]) return null;
  return totals[0] > totals[1] ? 0 : 1;
}

/** Progress toward the target score as a 0–1 fraction. */
export function progressFraction(
  total: number,
  target: number = DEFAULT_SCORING_CONFIG.targetScore,
): number {
  if (target <= 0) return 1;
  return Math.min(1, Math.max(0, total / target));
}
