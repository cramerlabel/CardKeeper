import { DEFAULT_SCORING_CONFIG } from './config';
import type { FinalScore, HandRecord, Pair, PlayerId, ScoringConfig } from './types';

export function computeTotals(hands: readonly HandRecord[]): Pair {
  const totals: Pair = [0, 0];
  for (const hand of hands) totals[hand.winner] += hand.points;
  return totals;
}

export function handsWon(hands: readonly HandRecord[]): Pair {
  const won: Pair = [0, 0];
  for (const hand of hands) won[hand.winner] += 1;
  return won;
}

export function isGameOver(
  totals: Readonly<Pair>,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): boolean {
  return totals[0] >= config.targetScore || totals[1] >= config.targetScore;
}

/**
 * Player who first reached the target score, or null if nobody has.
 * Only a hand's winner gains points, so exactly one player crosses the target on any single hand;
 * walking the hands in order therefore always identifies a unique player.
 */
export function gameWinner(
  hands: readonly HandRecord[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): PlayerId | null {
  const totals: Pair = [0, 0];
  for (const hand of hands) {
    totals[hand.winner] += hand.points;
    if (totals[hand.winner] >= config.targetScore) return hand.winner;
  }
  return null;
}

/**
 * Final tally. The game bonus goes to the player who crossed the target score first (`winner`),
 * even if the other player ends with a higher final total thanks to box bonuses (`finalLeader`).
 * Until someone reaches the target, no game bonus is awarded and `winner` is null.
 * Callers are expected to stop adding hands once the game is over.
 */
export function computeFinalScore(
  hands: readonly HandRecord[],
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): FinalScore {
  const raw = computeTotals(hands);
  const won = handsWon(hands);
  const winner = gameWinner(hands, config);
  const boxBonus: Pair = [won[0] * config.boxBonus, won[1] * config.boxBonus];

  const gameBonus: Pair = [0, 0];
  let shutout = false;
  if (winner !== null) {
    const loser: PlayerId = winner === 0 ? 1 : 0;
    shutout = won[loser] === 0;
    gameBonus[winner] = shutout ? config.shutoutGameBonus : config.gameBonus;
  }

  const final: Pair = [raw[0] + boxBonus[0] + gameBonus[0], raw[1] + boxBonus[1] + gameBonus[1]];
  const finalLeader: PlayerId | null = final[0] === final[1] ? null : final[0] > final[1] ? 0 : 1;

  return { winner, finalLeader, raw, handsWon: won, boxBonus, gameBonus, shutout, final };
}
