import { DEFAULT_SCORING_CONFIG } from './config';
import { computeFinalScore, computeTotals, gameWinner, handsWon, isGameOver } from './game';
import { createHandRecord } from './scoring';
import type { HandInput, HandRecord } from './types';

let counter = 0;
const hand = (input: HandInput): HandRecord => {
  counter += 1;
  return createHandRecord(`h${counter}`, counter, input);
};
const ginFor = (player: 0 | 1, opponentDeadwood: number): HandRecord =>
  hand({
    knocker: player,
    kind: 'gin',
    deadwood: player === 0 ? [0, opponentDeadwood] : [opponentDeadwood, 0],
  });
const knockFor = (player: 0 | 1, own: number, other: number): HandRecord =>
  hand({
    knocker: player,
    kind: 'knock',
    deadwood: player === 0 ? [own, other] : [other, own],
  });

beforeEach(() => {
  counter = 0;
});

describe('computeTotals / handsWon', () => {
  it('are zero with no hands', () => {
    expect(computeTotals([])).toEqual([0, 0]);
    expect(handsWon([])).toEqual([0, 0]);
  });

  it('credit points to each hand winner, including undercuts', () => {
    const hands = [knockFor(0, 3, 9), knockFor(0, 8, 5), ginFor(1, 12)];
    expect(computeTotals(hands)).toEqual([6, 28 + 37]);
    expect(handsWon(hands)).toEqual([1, 2]);
  });
});

describe('isGameOver', () => {
  it('is true when either player reaches the target', () => {
    expect(isGameOver([99, 99], DEFAULT_SCORING_CONFIG)).toBe(false);
    expect(isGameOver([100, 0], DEFAULT_SCORING_CONFIG)).toBe(true);
    expect(isGameOver([0, 130], DEFAULT_SCORING_CONFIG)).toBe(true);
  });

  it('defaults to the standard config', () => {
    expect(isGameOver([100, 0])).toBe(true);
    expect(isGameOver([50, 50])).toBe(false);
  });

  it('respects a custom target', () => {
    expect(isGameOver([50, 0], { ...DEFAULT_SCORING_CONFIG, targetScore: 50 })).toBe(true);
  });
});

describe('gameWinner', () => {
  it('is null until someone reaches the target', () => {
    expect(gameWinner([])).toBeNull();
    expect(gameWinner([ginFor(0, 50)])).toBeNull();
  });

  it('is the player whose hand crossed the target', () => {
    expect(
      gameWinner(
        [ginFor(1, 10), ginFor(0, 30), ginFor(0, 30), ginFor(0, 30)],
        DEFAULT_SCORING_CONFIG,
      ),
    ).toBe(0);
  });

  it('only the hand winner can cross: the first to cross wins even if hands continue', () => {
    // Player 0 crosses on hand 2; player 1 also ends above 100 later but 0 is still the winner.
    const hands = [ginFor(0, 40), ginFor(0, 40), knockFor(1, 1, 80), ginFor(1, 30), ginFor(1, 60)];
    expect(computeTotals(hands)[0]).toBeGreaterThanOrEqual(100);
    expect(computeTotals(hands)[1]).toBeGreaterThanOrEqual(100);
    expect(gameWinner(hands)).toBe(0);
  });
});

describe('computeFinalScore', () => {
  it('awards the game bonus once and box bonus to each player (non-shutout)', () => {
    // P0: gin vs 12 (37) + knock 3 vs 9 (6) + gin vs 20 (45) = 88, then gin vs 5 (30) crosses 100.
    // P1: wins the 8 vs 5 undercut (28).
    const hands = [
      ginFor(0, 12),
      knockFor(0, 8, 5),
      knockFor(0, 3, 9),
      ginFor(0, 20),
      ginFor(0, 5),
    ];
    const result = computeFinalScore(hands);
    expect(result.raw).toEqual([37 + 6 + 45 + 30, 28]);
    expect(result.handsWon).toEqual([4, 1]);
    expect(result.boxBonus).toEqual([100, 25]);
    expect(result.shutout).toBe(false);
    expect(result.gameBonus).toEqual([100, 0]);
    expect(result.winner).toBe(0);
    expect(result.finalLeader).toBe(0);
    expect(result.final).toEqual([118 + 100 + 100, 28 + 25]);
  });

  it('doubles the game bonus on a shutout', () => {
    const hands = [ginFor(1, 10), ginFor(1, 10), ginFor(1, 10)];
    const result = computeFinalScore(hands);
    expect(result.winner).toBe(1);
    expect(result.shutout).toBe(true);
    expect(result.gameBonus).toEqual([0, 200]);
    expect(result.handsWon).toEqual([0, 3]);
    expect(result.boxBonus).toEqual([0, 75]);
    expect(result.final).toEqual([0, 105 + 75 + 200]);
  });

  it('gives the game bonus to the player who crossed even if the other leads on final total', () => {
    const config = { ...DEFAULT_SCORING_CONFIG, boxBonus: 50, gameBonus: 10, shutoutGameBonus: 20 };
    // P0 wins many small hands (lots of box bonus); P1 crosses 100 with one big gin.
    const hands: HandRecord[] = [
      createHandRecord('a', 1, { knocker: 0, kind: 'knock', deadwood: [1, 3] }, config),
      createHandRecord('b', 2, { knocker: 0, kind: 'knock', deadwood: [1, 3] }, config),
      createHandRecord('c', 3, { knocker: 0, kind: 'knock', deadwood: [1, 3] }, config),
      createHandRecord('d', 4, { knocker: 1, kind: 'bigGin', deadwood: [100, 0] }, config),
    ];
    const result = computeFinalScore(hands, config);
    expect(result.winner).toBe(1);
    expect(result.raw).toEqual([6, 131]);
    expect(result.final).toEqual([6 + 150, 131 + 50 + 10]);
    expect(result.finalLeader).toBe(1);

    const exotic = computeFinalScore(hands, { ...config, boxBonus: 500 });
    expect(exotic.winner).toBe(1);
    expect(exotic.finalLeader).toBe(0);
  });

  it('reports no winner and no game bonus while the game is in progress', () => {
    const result = computeFinalScore([ginFor(0, 10), knockFor(1, 2, 9)]);
    expect(result.winner).toBeNull();
    expect(result.shutout).toBe(false);
    expect(result.gameBonus).toEqual([0, 0]);
    expect(result.boxBonus).toEqual([25, 25]);
    expect(result.final).toEqual([35 + 25, 7 + 25]);
  });

  it('handles an empty game and ties', () => {
    const empty = computeFinalScore([]);
    expect(empty.final).toEqual([0, 0]);
    expect(empty.finalLeader).toBeNull();
    expect(empty.winner).toBeNull();
  });

  it('finalLeader is 1 when player 1 leads', () => {
    expect(computeFinalScore([ginFor(1, 10)]).finalLeader).toBe(1);
  });
});
