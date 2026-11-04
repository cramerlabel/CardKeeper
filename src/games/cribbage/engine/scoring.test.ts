import {
  SHORT_CONFIG,
  STANDARD_CONFIG,
  computeResult,
  computeTotals,
  isGameOver,
  pegPositions,
  rebuildEvents,
} from './index';
import type { CribbageConfig, GameContext, PlayerCount, PlayerIndex, ScoreEvent } from './index';

function ctx(playerCount: PlayerCount = 2, config: CribbageConfig = STANDARD_CONFIG): GameContext {
  return { playerCount, firstDealer: 0, config };
}

/** Builds events without winning-truncation so tests can probe the raw functions. */
function events(...scores: [PlayerIndex, number][]): ScoreEvent[] {
  return scores.map(([player, points], i) => ({
    id: `e${i + 1}`,
    number: i + 1,
    player,
    kind: 'pegging',
    points,
    deal: 1,
  }));
}

/** Gives `player` exactly `total` points using events of at most 29. */
function give(player: PlayerIndex, total: number): [PlayerIndex, number][] {
  const out: [PlayerIndex, number][] = [];
  let left = total;
  while (left > 0) {
    const step = Math.min(left, 29);
    out.push([player, step]);
    left -= step;
  }
  return out;
}

describe('computeTotals', () => {
  it('returns zeros with no events, sized by player count', () => {
    expect(computeTotals([], ctx(2))).toEqual([0, 0]);
    expect(computeTotals([], ctx(3))).toEqual([0, 0, 0]);
  });

  it('sums per player', () => {
    expect(computeTotals(events([0, 5], [1, 7], [0, 10], [2, 4]), ctx(3))).toEqual([15, 7, 4]);
  });

  it('caps at the target', () => {
    expect(computeTotals(events(...give(0, 125)), ctx())).toEqual([121, 0]);
    expect(computeTotals(events(...give(0, 60), [0, 29]), ctx(2, SHORT_CONFIG))).toEqual([61, 0]);
  });
});

describe('isGameOver', () => {
  it('is false below the target', () => {
    expect(isGameOver(events(...give(0, 120)), ctx())).toBe(false);
    expect(isGameOver([], ctx())).toBe(false);
  });

  it('is true on exactly the target and on overshoot', () => {
    expect(isGameOver(events(...give(1, 121)), ctx())).toBe(true);
    expect(isGameOver(events(...give(1, 125)), ctx())).toBe(true);
    expect(isGameOver(events(...give(0, 61)), ctx(2, SHORT_CONFIG))).toBe(true);
  });
});

describe('computeResult', () => {
  it('has no winner while in progress', () => {
    expect(computeResult(events([0, 10], [1, 20]), ctx())).toEqual({
      winner: null,
      totals: [10, 20],
      skunk: ['none', 'none'],
      margin: 0,
    });
  });

  it('picks the winner and margin', () => {
    const result = computeResult(events(...give(1, 121), ...give(0, 100)), ctx());
    expect(result.winner).toBe(1);
    expect(result.totals).toEqual([100, 121]);
    expect(result.margin).toBe(21);
    expect(result.skunk).toEqual(['none', 'none']);
  });

  it('picks the first player to reach the target', () => {
    const result = computeResult(events(...give(0, 120), ...give(1, 120), [0, 2], [1, 2]), ctx());
    expect(result.winner).toBe(0);
  });

  it('uses the capped total for the margin on overshoot', () => {
    const result = computeResult(events(...give(0, 126), [1, 10]), ctx());
    expect(result.totals).toEqual([121, 10]);
    expect(result.margin).toBe(111);
  });

  it('does not skunk at 91 or above, skunks at 90', () => {
    expect(computeResult(events(...give(0, 121), ...give(1, 91)), ctx()).skunk[1]).toBe('none');
    expect(computeResult(events(...give(0, 121), ...give(1, 90)), ctx()).skunk[1]).toBe('skunk');
  });

  it('double skunks at 60, only a skunk at 61', () => {
    expect(computeResult(events(...give(0, 121), ...give(1, 61)), ctx()).skunk[1]).toBe('skunk');
    expect(computeResult(events(...give(0, 121), ...give(1, 60)), ctx()).skunk[1]).toBe(
      'doubleSkunk',
    );
    expect(computeResult(events(...give(0, 121)), ctx()).skunk[1]).toBe('doubleSkunk');
  });

  it('uses the short game lines: skunk at 30, none at 31, never a double skunk', () => {
    const short = ctx(2, SHORT_CONFIG);
    expect(computeResult(events(...give(0, 61), ...give(1, 31)), short).skunk[1]).toBe('none');
    expect(computeResult(events(...give(0, 61), ...give(1, 30)), short).skunk[1]).toBe('skunk');
    expect(computeResult(events(...give(0, 61)), short).skunk[1]).toBe('skunk');
  });

  it('evaluates each loser separately in a three-player game', () => {
    const result = computeResult(events(...give(2, 121), ...give(0, 95), ...give(1, 45)), ctx(3));
    expect(result.winner).toBe(2);
    expect(result.skunk).toEqual(['none', 'doubleSkunk', 'none']);
    expect(result.margin).toBe(121 - 95);

    const mixed = computeResult(events(...give(0, 121), ...give(1, 80), ...give(2, 40)), ctx(3));
    expect(mixed.skunk).toEqual(['none', 'skunk', 'doubleSkunk']);
    expect(mixed.margin).toBe(41);
  });
});

describe('pegPositions', () => {
  it('starts every peg off the board', () => {
    expect(pegPositions([], ctx(3))).toEqual([
      { front: 0, back: 0 },
      { front: 0, back: 0 },
      { front: 0, back: 0 },
    ]);
  });

  it("puts the back peg at 0 after a player's first event", () => {
    expect(pegPositions(events([0, 7]), ctx())).toEqual([
      { front: 7, back: 0 },
      { front: 0, back: 0 },
    ]);
  });

  it('leapfrogs across multiple events', () => {
    expect(pegPositions(events([0, 7], [0, 4], [0, 9]), ctx())[0]).toEqual({ front: 20, back: 11 });
  });

  it("ignores other players' events", () => {
    expect(pegPositions(events([0, 7], [1, 5], [0, 4], [1, 3]), ctx())).toEqual([
      { front: 11, back: 7 },
      { front: 8, back: 5 },
    ]);
  });

  it('reflects the rebuilt events after an edit', () => {
    const entries = [
      { id: 'a', input: { player: 0 as PlayerIndex, kind: 'hand' as const, points: 7, deal: 1 } },
      { id: 'b', input: { player: 0 as PlayerIndex, kind: 'hand' as const, points: 4, deal: 1 } },
    ];
    const before = rebuildEvents(entries, ctx());
    expect(pegPositions(before, ctx())[0]).toEqual({ front: 11, back: 7 });
    entries[0].input.points = 10;
    expect(pegPositions(rebuildEvents(entries, ctx()), ctx())[0]).toEqual({ front: 14, back: 10 });
    expect(pegPositions(rebuildEvents(entries.slice(1), ctx()), ctx())[0]).toEqual({
      front: 4,
      back: 0,
    });
  });

  it('caps the front peg at the target', () => {
    const pegs = pegPositions(events(...give(0, 118), [0, 10]), ctx());
    expect(pegs[0]).toEqual({ front: 121, back: 118 });
  });
});
