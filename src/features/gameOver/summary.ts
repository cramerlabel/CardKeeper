import {
  DEFAULT_SCORING_CONFIG,
  type FinalScore,
  type Pair,
  type PlayerId,
} from '@/games/ginRummy/engine';

export interface BreakdownRow {
  key: 'hands' | 'points' | 'box' | 'game' | 'final';
  label: string;
  /** Small explanatory text under the label. */
  detail?: string;
  values: Pair;
  /** Show a leading "+" on non-zero values. */
  plus?: boolean;
  emphasis?: boolean;
}

export interface GameSummary {
  /** Player who wins on final score; null on a tie. */
  champion: PlayerId | null;
  headline: string;
  subline: string;
  shutout: boolean;
  rows: BreakdownRow[];
}

/** Turns the engine's FinalScore into the texts and table rows shown on the game-over screen. */
export function buildSummary(
  score: FinalScore,
  players: readonly [string, string],
  handCount: number,
): GameSummary {
  const { winner, finalLeader, shutout } = score;
  const target = DEFAULT_SCORING_CONFIG.targetScore;

  const headline = finalLeader === null ? "It's a tie!" : `${players[finalLeader]} wins!`;

  let subline: string;
  if (winner === null) {
    subline = 'Game ended early. No game bonus awarded.';
  } else if (shutout) {
    subline = `Shutout! ${players[winner]} reached ${target} without the other player winning a hand.`;
  } else if (finalLeader !== winner) {
    subline =
      finalLeader === null
        ? `${players[winner]} reached ${target} first, but the final scores are level.`
        : `${players[winner]} reached ${target} first, but ${players[finalLeader]} has the higher final score.`;
  } else {
    subline = `Reached ${target} after ${handCount} ${handCount === 1 ? 'hand' : 'hands'}.`;
  }

  const rows: BreakdownRow[] = [
    { key: 'hands', label: 'Hands won', values: score.handsWon },
    { key: 'points', label: 'Points scored', values: score.raw },
    {
      key: 'box',
      label: 'Box bonus',
      detail: `${DEFAULT_SCORING_CONFIG.boxBonus} per hand won`,
      values: score.boxBonus,
      plus: true,
    },
    {
      key: 'game',
      label: shutout ? 'Game bonus: Shutout!' : 'Game bonus',
      detail:
        winner === null ? undefined : shutout ? 'Double bonus' : `For reaching ${target} first`,
      values: score.gameBonus,
      plus: true,
    },
    { key: 'final', label: 'Final score', values: score.final, emphasis: true },
  ];

  return { champion: finalLeader, headline, subline, shutout, rows };
}

/** "+25" / "–" / "12", depending on the row. */
export function formatValue(value: number, plus = false): string {
  if (plus) return value === 0 ? '–' : `+${value}`;
  return String(value);
}
