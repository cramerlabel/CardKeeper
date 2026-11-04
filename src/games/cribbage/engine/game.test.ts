import {
  ERROR_CRIB_DEALER,
  ERROR_DEAL,
  ERROR_HEELS_DEALER,
  ERROR_HEELS_POINTS,
  ERROR_PLAYER_RANGE,
  ERROR_POINTS_RANGE,
  InvalidScoreError,
  SCORE_KINDS,
  SHORT_CONFIG,
  STANDARD_CONFIG,
  createScoreEvent,
  dealerOf,
  getConfig,
  rebuildEvents,
  validateScore,
} from './index';
import type { GameContext, PlayerCount, PlayerIndex, ScoreEntry, ScoreInput } from './index';

function ctx(
  playerCount: PlayerCount = 2,
  firstDealer: PlayerIndex = 0,
  config = STANDARD_CONFIG,
): GameContext {
  return { playerCount, firstDealer, config };
}

function entry(id: string, player: PlayerIndex, points: number, deal = 1): ScoreEntry {
  return { id, input: { player, kind: 'pegging', points, deal } };
}

describe('config', () => {
  it('returns standard and short configs', () => {
    expect(getConfig(121)).toEqual({ target: 121, skunkLine: 91, doubleSkunkLine: 61 });
    expect(getConfig(61)).toEqual({ target: 61, skunkLine: 31, doubleSkunkLine: null });
    expect(getConfig(121)).toBe(STANDARD_CONFIG);
    expect(getConfig(61)).toBe(SHORT_CONFIG);
  });

  it('lists every score kind once, in order', () => {
    expect(SCORE_KINDS.map((k) => k.kind)).toEqual(['pegging', 'hand', 'crib', 'heels', 'other']);
    for (const info of SCORE_KINDS) {
      expect(info.label).not.toBe('');
      expect(info.hint).not.toBe('');
    }
  });
});

describe('dealerOf', () => {
  it('rotates between two players', () => {
    expect([1, 2, 3, 4].map((d) => dealerOf(d, 0, 2))).toEqual([0, 1, 0, 1]);
    expect([1, 2, 3, 4].map((d) => dealerOf(d, 1, 2))).toEqual([1, 0, 1, 0]);
  });

  it('rotates between three players', () => {
    expect([1, 2, 3, 4, 5, 6, 7].map((d) => dealerOf(d, 0, 3))).toEqual([0, 1, 2, 0, 1, 2, 0]);
    expect([1, 2, 3, 4].map((d) => dealerOf(d, 2, 3))).toEqual([2, 0, 1, 2]);
  });
});

describe('validateScore', () => {
  const base: ScoreInput = { player: 0, kind: 'hand', points: 12, deal: 1 };

  it('accepts a valid event', () => {
    expect(validateScore(base, ctx())).toEqual([]);
  });

  it('accepts the points boundaries 1 and 29', () => {
    expect(validateScore({ ...base, points: 1 }, ctx())).toEqual([]);
    expect(validateScore({ ...base, points: 29 }, ctx())).toEqual([]);
  });

  it.each([0, -1, 30, 1.5, Number.NaN, Number.POSITIVE_INFINITY])('rejects points %p', (points) => {
    expect(validateScore({ ...base, points }, ctx())).toEqual([ERROR_POINTS_RANGE]);
  });

  it('rejects a player out of range', () => {
    const bad = (player: number) => ({ ...base, player: player as PlayerIndex });
    expect(validateScore(bad(2), ctx(2))).toEqual([ERROR_PLAYER_RANGE]);
    expect(validateScore(bad(-1), ctx(2))).toEqual([ERROR_PLAYER_RANGE]);
    expect(validateScore(bad(0.5), ctx(2))).toEqual([ERROR_PLAYER_RANGE]);
    expect(validateScore(bad(2), ctx(3))).toEqual([]);
    expect(validateScore(bad(3), ctx(3))).toEqual([ERROR_PLAYER_RANGE]);
  });

  it('rejects an invalid deal', () => {
    expect(validateScore({ ...base, deal: 0 }, ctx())).toEqual([ERROR_DEAL]);
    expect(validateScore({ ...base, deal: 1.5 }, ctx())).toEqual([ERROR_DEAL]);
  });

  it('requires heels to be exactly 2 points', () => {
    const heels: ScoreInput = { player: 0, kind: 'heels', points: 2, deal: 1 };
    expect(validateScore(heels, ctx())).toEqual([]);
    expect(validateScore({ ...heels, points: 3 }, ctx())).toEqual([ERROR_HEELS_POINTS]);
  });

  it('requires heels and crib to belong to the dealer', () => {
    const heels: ScoreInput = { player: 1, kind: 'heels', points: 2, deal: 1 };
    const crib: ScoreInput = { player: 1, kind: 'crib', points: 8, deal: 1 };
    expect(validateScore(heels, ctx(2, 0))).toEqual([ERROR_HEELS_DEALER]);
    expect(validateScore(crib, ctx(2, 0))).toEqual([ERROR_CRIB_DEALER]);
    expect(validateScore(heels, ctx(2, 1))).toEqual([]);
    expect(validateScore(crib, ctx(2, 1))).toEqual([]);
    expect(validateScore({ ...crib, deal: 2 }, ctx(2, 1))).toEqual([ERROR_CRIB_DEALER]);
    expect(validateScore({ ...crib, player: 2, deal: 3 }, ctx(3, 0))).toEqual([]);
  });

  it('does not restrict hand, pegging or other to the dealer', () => {
    for (const kind of ['hand', 'pegging', 'other'] as const) {
      expect(validateScore({ ...base, kind, player: 1 }, ctx(2, 0))).toEqual([]);
    }
  });

  it('collects every error', () => {
    const errors = validateScore({ player: 1, kind: 'heels', points: 40, deal: 1 }, ctx(2, 0));
    expect(errors).toEqual([ERROR_POINTS_RANGE, ERROR_HEELS_POINTS, ERROR_HEELS_DEALER]);
    const all = validateScore(
      { player: 5 as PlayerIndex, kind: 'crib', points: 0, deal: 0 },
      ctx(),
    );
    expect(all).toEqual([ERROR_POINTS_RANGE, ERROR_PLAYER_RANGE, ERROR_DEAL]);
  });
});

describe('createScoreEvent', () => {
  it('builds an event with id and number', () => {
    const input: ScoreInput = { player: 1, kind: 'hand', points: 8, deal: 2 };
    expect(createScoreEvent('a', 3, input, ctx())).toEqual({ ...input, id: 'a', number: 3 });
  });

  it('throws InvalidScoreError carrying all errors', () => {
    const input: ScoreInput = { player: 1, kind: 'heels', points: 3, deal: 1 };
    try {
      createScoreEvent('a', 1, input, ctx(2, 0));
      throw new Error('expected to throw');
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidScoreError);
      expect((error as InvalidScoreError).errors).toEqual([ERROR_HEELS_POINTS, ERROR_HEELS_DEALER]);
      expect((error as InvalidScoreError).message).toContain(ERROR_HEELS_POINTS);
    }
  });
});

describe('rebuildEvents', () => {
  it('renumbers events from 1 in order', () => {
    const events = rebuildEvents([entry('x', 0, 5), entry('y', 1, 6), entry('z', 0, 7)], ctx());
    expect(events.map((e) => [e.id, e.number])).toEqual([
      ['x', 1],
      ['y', 2],
      ['z', 3],
    ]);
  });

  it('returns an empty list for no entries', () => {
    expect(rebuildEvents([], ctx())).toEqual([]);
  });

  it('truncates after the event that reaches the target exactly', () => {
    const events = rebuildEvents(
      [
        entry('a', 0, 29),
        entry('b', 0, 29),
        entry('c', 0, 29),
        entry('d', 0, 29),
        entry('e', 0, 5),
        entry('f', 1, 3),
      ],
      ctx(),
    );
    expect(events.map((e) => e.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
    const exact = rebuildEvents(
      [entry('a', 0, 20, 1), entry('b', 1, 5), entry('c', 0, 1)],
      ctx(2, 0, { ...STANDARD_CONFIG, target: 21 }),
    );
    expect(exact.map((e) => e.id)).toEqual(['a', 'b', 'c']);
  });

  it('truncates after an overshoot', () => {
    const events = rebuildEvents(
      [
        entry('a', 0, 29),
        entry('b', 0, 29),
        entry('c', 0, 29),
        entry('d', 0, 29),
        entry('e', 0, 29),
        entry('f', 1, 3),
      ],
      ctx(),
    );
    expect(events.map((e) => e.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
  });

  it("drops later events after an edit makes another player's total win earlier", () => {
    const entries = [
      entry('a', 0, 29),
      entry('b', 1, 29),
      entry('c', 0, 29),
      entry('d', 1, 29),
      entry('e', 0, 29),
      entry('f', 1, 29),
      entry('g', 0, 29),
      entry('h', 1, 29),
      entry('i', 0, 29),
      entry('j', 1, 29),
    ];
    const events = rebuildEvents(entries, ctx());
    expect(events.map((e) => e.id)).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i']);
    expect(events[events.length - 1].number).toBe(9);
  });

  it('throws on an invalid entry', () => {
    expect(() => rebuildEvents([entry('a', 0, 0)], ctx())).toThrow(InvalidScoreError);
    const crib: ScoreEntry = { id: 'c', input: { player: 1, kind: 'crib', points: 4, deal: 1 } };
    expect(() => rebuildEvents([crib], ctx(2, 0))).toThrow(InvalidScoreError);
  });
});
