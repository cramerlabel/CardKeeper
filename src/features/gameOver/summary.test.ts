import {
  computeFinalScore,
  createHandRecord,
  type HandInput,
  type HandRecord,
} from '@/games/ginRummy/engine';

import { buildSummary, formatValue } from './summary';

let counter = 0;
const hand = (input: HandInput): HandRecord => createHandRecord(`h${++counter}`, counter, input);
const gin = (player: 0 | 1, opponentDeadwood: number) =>
  hand({
    knocker: player,
    kind: 'gin',
    deadwood: player === 0 ? [0, opponentDeadwood] : [opponentDeadwood, 0],
  });
const knock = (player: 0 | 1, own: number, other: number) =>
  hand({
    knocker: player,
    kind: 'knock',
    deadwood: player === 0 ? [own, other] : [other, own],
  });

const names: [string, string] = ['Alice', 'Bob'];
const summarize = (hands: HandRecord[]) =>
  buildSummary(computeFinalScore(hands), names, hands.length);
const row = (s: ReturnType<typeof summarize>, key: string) => s.rows.find((r) => r.key === key)!;

beforeEach(() => {
  counter = 0;
});

describe('buildSummary', () => {
  it('breaks down a normal win', () => {
    // Alice: 35 + 37 + 33 = 105 (3 hands); Bob: 28 (1 hand, undercut)
    const hands = [gin(0, 10), knock(0, 8, 5), gin(0, 12), gin(0, 8)];
    const s = summarize(hands);
    expect(s.headline).toBe('Alice wins!');
    expect(s.champion).toBe(0);
    expect(s.shutout).toBe(false);
    expect(row(s, 'game').values).toEqual([100, 0]);
    expect(s.rows.map((r) => r.key)).toEqual(['hands', 'points', 'box', 'game', 'final']);
    const final = computeFinalScore(hands).final;
    expect(row(s, 'final').values).toEqual(final);
    expect(s.subline).toBe('Reached 100 after 4 hands.');
  });

  it('labels a shutout and doubles the game bonus', () => {
    const hands = [gin(0, 30), gin(0, 30)]; // 55 * 2 = 110, Bob wins nothing
    const s = summarize(hands);
    expect(s.shutout).toBe(true);
    expect(row(s, 'game').label).toBe('Game bonus: Shutout!');
    expect(row(s, 'game').values).toEqual([200, 0]);
    expect(row(s, 'final').values).toEqual([110 + 50 + 200, 0]);
    expect(s.subline).toMatch(/^Shutout!/);
  });

  it('declares the higher final score the winner even if the other reached 100 first', () => {
    // Bob piles up 9 hands (90 points) without reaching 100; Alice then reaches 110 with two gins.
    const hands = [...Array.from({ length: 9 }, () => knock(1, 1, 11)), gin(0, 30), gin(0, 30)];
    const score = computeFinalScore(hands);
    expect(score.winner).toBe(0);
    expect(score.final).toEqual([110 + 50 + 100, 90 + 225]);
    const s = buildSummary(score, names, hands.length);
    expect(s.champion).toBe(1);
    expect(s.headline).toBe('Bob wins!');
    expect(s.subline).toBe('Alice reached 100 first, but Bob has the higher final score.');
  });

  it('handles a game ended early with no game bonus', () => {
    const s = summarize([knock(0, 3, 10), knock(1, 2, 9)]);
    expect(s.subline).toBe('Game ended early. No game bonus awarded.');
    expect(row(s, 'game').values).toEqual([0, 0]);
    expect(row(s, 'game').detail).toBeUndefined();
  });

  it('reports a tie', () => {
    const s = summarize([knock(0, 3, 10), knock(1, 3, 10)]);
    expect(s.champion).toBeNull();
    expect(s.headline).toBe("It's a tie!");
  });
});

describe('formatValue', () => {
  it('formats plain and bonus values', () => {
    expect(formatValue(12)).toBe('12');
    expect(formatValue(0)).toBe('0');
    expect(formatValue(25, true)).toBe('+25');
    expect(formatValue(0, true)).toBe('–');
  });
});
