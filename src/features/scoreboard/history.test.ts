import { createHandRecord, type HandInput } from '@/games/ginRummy/engine';

import { buildHistoryRows, leaderOf, progressFraction } from './history';

const hand = (n: number, input: HandInput) => createHandRecord(`h${n}`, n, input);

describe('buildHistoryRows', () => {
  it('returns no rows for no hands', () => {
    expect(buildHistoryRows([], ['A', 'B'])).toEqual([]);
  });

  it('labels outcomes and accumulates running totals', () => {
    const hands = [
      hand(1, { knocker: 0, kind: 'knock', deadwood: [3, 10] }), // A +7
      hand(2, { knocker: 0, kind: 'knock', deadwood: [8, 5] }), // undercut: B +28
      hand(3, { knocker: 1, kind: 'gin', deadwood: [12, 0] }), // B +37
      hand(4, { knocker: 0, kind: 'bigGin', deadwood: [0, 9] }), // A +40
    ];
    const rows = buildHistoryRows(hands, ['Alice', 'Bob']);

    expect(rows.map((r) => r.outcomeLabel)).toEqual(['Knock', 'Undercut', 'Gin', 'Big Gin']);
    expect(rows.map((r) => r.winnerName)).toEqual(['Alice', 'Bob', 'Bob', 'Alice']);
    expect(rows.map((r) => r.points)).toEqual([7, 28, 37, 40]);
    expect(rows.map((r) => r.totals)).toEqual([
      [7, 0],
      [7, 28],
      [7, 65],
      [47, 65],
    ]);
    expect(rows[1].deadwood).toEqual([8, 5]);
  });

  it('does not share totals arrays between rows', () => {
    const rows = buildHistoryRows(
      [
        hand(1, { knocker: 0, kind: 'knock', deadwood: [3, 10] }),
        hand(2, { knocker: 0, kind: 'knock', deadwood: [2, 10] }),
      ],
      ['A', 'B'],
    );
    expect(rows[0].totals).toEqual([7, 0]);
  });
});

describe('leaderOf', () => {
  it('returns the higher player, or null on a tie', () => {
    expect(leaderOf([10, 5])).toBe(0);
    expect(leaderOf([5, 10])).toBe(1);
    expect(leaderOf([0, 0])).toBeNull();
    expect(leaderOf([20, 20])).toBeNull();
  });
});

describe('progressFraction', () => {
  it('clamps to 0–1 against the target', () => {
    expect(progressFraction(0)).toBe(0);
    expect(progressFraction(50)).toBe(0.5);
    expect(progressFraction(131)).toBe(1);
    expect(progressFraction(-5)).toBe(0);
  });
});
