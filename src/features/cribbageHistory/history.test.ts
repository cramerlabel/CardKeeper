import {
  SHORT_CONFIG,
  STANDARD_CONFIG,
  createScoreEvent,
  type GameContext,
  type ScoreEvent,
  type ScoreInput,
} from '@/games/cribbage/engine';

import { buildHistorySections, flattenHistory, hasScoresInDeal, leaderOf } from './history';

const CTX3: GameContext = { playerCount: 3, firstDealer: 0, config: STANDARD_CONFIG };
const NAMES = ['Alice', 'Bob', 'Cara'];

function events(inputs: ScoreInput[], ctx: GameContext = CTX3): ScoreEvent[] {
  return inputs.map((input, index) => createScoreEvent(`e${index + 1}`, index + 1, input, ctx));
}

const base = { firstDealer: 0 as const, target: 121 };

describe('buildHistorySections', () => {
  it('returns only the current deal, empty, for a new game', () => {
    const sections = buildHistorySections({ ...base, events: [], players: NAMES, deal: 1 });
    expect(sections).toEqual([{ deal: 1, dealerName: 'Alice', isCurrent: true, rows: [] }]);
  });

  it('groups scores by deal, newest deal and newest score first', () => {
    const list = events([
      { player: 1, kind: 'pegging', points: 2, deal: 1 },
      { player: 0, kind: 'hand', points: 8, deal: 1 },
      { player: 0, kind: 'crib', points: 4, deal: 1 },
      { player: 2, kind: 'hand', points: 6, deal: 2 },
    ]);
    const sections = buildHistorySections({ ...base, events: list, players: NAMES, deal: 2 });

    expect(sections.map((s) => [s.deal, s.isCurrent, s.rows.map((r) => r.id)])).toEqual([
      [2, true, ['e4']],
      [1, false, ['e3', 'e2', 'e1']],
    ]);
  });

  it('names the dealer of each deal', () => {
    const list = events([{ player: 0, kind: 'hand', points: 4, deal: 1 }]);
    const sections = buildHistorySections({ ...base, events: list, players: NAMES, deal: 3 });

    expect(sections.map((s) => [s.deal, s.dealerName])).toEqual([
      [3, 'Cara'],
      [1, 'Alice'],
    ]);
  });

  it('honours the first dealer', () => {
    const [section] = buildHistorySections({
      ...base,
      events: [],
      players: NAMES,
      firstDealer: 2,
      deal: 2,
    });
    expect(section.dealerName).toBe('Alice');
  });

  it('omits deals without scores except the current one', () => {
    const list = events([
      { player: 0, kind: 'hand', points: 4, deal: 1 },
      { player: 1, kind: 'hand', points: 4, deal: 3 },
    ]);
    const sections = buildHistorySections({ ...base, events: list, players: NAMES, deal: 5 });
    expect(sections.map((s) => s.deal)).toEqual([5, 3, 1]);
    expect(sections[0].rows).toEqual([]);
  });

  it('keeps a running total per player across deals', () => {
    const list = events([
      { player: 0, kind: 'pegging', points: 3, deal: 1 },
      { player: 1, kind: 'pegging', points: 5, deal: 1 },
      { player: 0, kind: 'hand', points: 8, deal: 1 },
      { player: 0, kind: 'crib', points: 6, deal: 1 },
      { player: 1, kind: 'hand', points: 10, deal: 2 },
      { player: 0, kind: 'other', points: 2, deal: 2 },
    ]);
    const rows = buildHistorySections({ ...base, events: list, players: NAMES, deal: 2 })
      .flatMap((s) => s.rows)
      .sort((a, b) => a.number - b.number);

    expect(rows.map((r) => [r.playerName, r.points, r.total])).toEqual([
      ['Alice', 3, 3],
      ['Bob', 5, 5],
      ['Alice', 8, 11],
      ['Alice', 6, 17],
      ['Bob', 10, 15],
      ['Alice', 2, 19],
    ]);
  });

  it('caps the winning score at the target', () => {
    const list = events([
      { player: 0, kind: 'hand', points: 29, deal: 1 },
      { player: 0, kind: 'hand', points: 29, deal: 2 },
      { player: 0, kind: 'hand', points: 29, deal: 3 },
      { player: 0, kind: 'hand', points: 29, deal: 4 },
      { player: 0, kind: 'hand', points: 10, deal: 5 },
    ]);
    const [latest] = buildHistorySections({ ...base, events: list, players: NAMES, deal: 5 });
    expect(latest.rows[0].total).toBe(121);
  });

  it('caps at the short-game target', () => {
    const ctx: GameContext = { playerCount: 2, firstDealer: 0, config: SHORT_CONFIG };
    const list = events(
      [
        { player: 1, kind: 'hand', points: 29, deal: 1 },
        { player: 1, kind: 'hand', points: 29, deal: 2 },
        { player: 1, kind: 'hand', points: 20, deal: 3 },
      ],
      ctx,
    );
    const [latest] = buildHistorySections({
      events: list,
      players: ['A', 'B'],
      firstDealer: 0,
      deal: 3,
      target: 61,
    });
    expect(latest.rows[0].total).toBe(61);
  });

  it('labels rows with the kind, player and description', () => {
    const list = events([
      { player: 0, kind: 'heels', points: 2, deal: 1 },
      { player: 1, kind: 'hand', points: 6, deal: 1 },
      { player: 2, kind: 'pegging', points: 4, deal: 1 },
    ]);
    const [section] = buildHistorySections({ ...base, events: list, players: NAMES, deal: 1 });
    const byId = Object.fromEntries(section.rows.map((r) => [r.id, r]));

    expect(byId.e1).toMatchObject({ kindLabel: 'His heels', playerName: 'Alice', points: 2 });
    expect(byId.e2).toMatchObject({ kindLabel: 'Hand', playerName: 'Bob', player: 1, total: 6 });
    expect(byId.e2.description).toBe('Bob +6 (Hand)');
    expect(byId.e3.kind).toBe('pegging');
  });

  it('does not mutate the events', () => {
    const list = events([
      { player: 0, kind: 'hand', points: 4, deal: 1 },
      { player: 1, kind: 'hand', points: 6, deal: 1 },
    ]);
    const copy = list.map((e) => ({ ...e }));
    buildHistorySections({ ...base, events: list, players: NAMES, deal: 1 });
    expect(list).toEqual(copy);
  });
});

describe('hasScoresInDeal', () => {
  it('is true only for deals with an event', () => {
    const list = events([{ player: 0, kind: 'hand', points: 4, deal: 2 }]);
    expect(hasScoresInDeal(list, 2)).toBe(true);
    expect(hasScoresInDeal(list, 1)).toBe(false);
    expect(hasScoresInDeal([], 1)).toBe(false);
  });
});

describe('flattenHistory', () => {
  it('puts a header before each deal and a note for an empty deal', () => {
    const list = events([
      { player: 0, kind: 'hand', points: 4, deal: 1 },
      { player: 1, kind: 'pegging', points: 2, deal: 1 },
    ]);
    const items = flattenHistory(
      buildHistorySections({ ...base, events: list, players: NAMES, deal: 2 }),
    );

    expect(items.map((item) => [item.type, item.key])).toEqual([
      ['header', 'deal-2'],
      ['empty', 'empty-2'],
      ['header', 'deal-1'],
      ['row', 'e2'],
      ['row', 'e1'],
    ]);
  });

  it('is empty without sections', () => {
    expect(flattenHistory([])).toEqual([]);
  });
});

describe('leaderOf', () => {
  it('returns the strict leader', () => {
    expect(leaderOf([10, 5])).toBe(0);
    expect(leaderOf([5, 10, 7])).toBe(1);
    expect(leaderOf([1, 2, 30])).toBe(2);
  });

  it('returns null when tied for the lead or nobody has scored', () => {
    expect(leaderOf([0, 0])).toBeNull();
    expect(leaderOf([0, 0, 0])).toBeNull();
    expect(leaderOf([20, 20, 3])).toBeNull();
    expect(leaderOf([7, 7])).toBeNull();
  });
});
