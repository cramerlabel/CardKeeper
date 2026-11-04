import type { StateStorage } from 'zustand/middleware';

import { createCribbageStore } from './createCribbageStore';
import { MAX_HISTORY, STORAGE_KEY } from './persistence';
import {
  selectContext,
  selectDealer,
  selectHasSavedGame,
  selectIsGameOver,
  selectPegs,
  selectResult,
  selectTotals,
} from './selectors';
import type { StartGameOptions } from './types';

function memoryStorage(initial: Record<string, string> = {}): StateStorage & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: async (key) => data[key] ?? null,
    setItem: async (key, value) => {
      data[key] = value;
    },
    removeItem: async (key) => {
      delete data[key];
    },
  };
}

const two: StartGameOptions = { names: ['A', 'B'], target: 121, firstDealer: 0 };
const hand = (player: 0 | 1 | 2, points: number) => ({ player, kind: 'hand' as const, points });

async function setup<S extends StateStorage = ReturnType<typeof memoryStorage>>(
  storage: S = memoryStorage() as unknown as S,
) {
  const store = createCribbageStore(storage);
  await store.persist.rehydrate();
  return { store, storage };
}

describe('cribbageStore', () => {
  it('starts a game with trimmed / default names', async () => {
    const { store } = await setup();
    expect(
      store.getState().startGame({ ...two, names: ['  Ann ', ' ', 'Cy'], firstDealer: 2 }),
    ).toEqual({
      ok: true,
    });
    const game = store.getState().currentGame!;
    expect(game.players).toEqual(['Ann', 'Player 2', 'Cy']);
    expect(game).toMatchObject({ deal: 1, status: 'inProgress', target: 121, firstDealer: 2 });
    expect(game.events).toEqual([]);
    expect(selectHasSavedGame(store.getState())).toBe(true);
    expect(selectDealer(store.getState())).toBe(2);
  });

  it('rejects invalid setups', async () => {
    const { store } = await setup();
    expect(store.getState().startGame({ ...two, names: ['A'] }).ok).toBe(false);
    expect(store.getState().startGame({ ...two, names: ['A', 'B', 'C', 'D'] }).ok).toBe(false);
    expect(store.getState().startGame({ ...two, firstDealer: 2 }).ok).toBe(false);
    expect(store.getState().startGame({ ...two, target: 100 as 121 }).ok).toBe(false);
    expect(store.getState().currentGame).toBeNull();
  });

  it('adds scores, numbers them and defaults the deal', async () => {
    const { store } = await setup();
    store.getState().startGame(two);
    expect(store.getState().addScore(hand(0, 8))).toEqual({ ok: true });
    expect(store.getState().addScore({ player: 1, kind: 'pegging', points: 3 })).toEqual({
      ok: true,
    });
    const { events } = store.getState().currentGame!;
    expect(events.map((e) => e.number)).toEqual([1, 2]);
    expect(events.every((e) => e.deal === 1)).toBe(true);
    expect(selectTotals(store.getState())).toEqual([8, 3]);
    expect(selectPegs(store.getState())).toEqual([
      { front: 8, back: 0 },
      { front: 3, back: 0 },
    ]);
  });

  it('rejects invalid input and actions without a game', async () => {
    const { store } = await setup();
    expect(store.getState().addScore(hand(0, 5)).ok).toBe(false);
    expect(store.getState().undoLastScore().ok).toBe(false);
    expect(store.getState().deleteScore('x').ok).toBe(false);
    expect(store.getState().nextDeal().ok).toBe(false);
    expect(store.getState().finishGame().ok).toBe(false);
    store.getState().startGame(two);
    const bad = store.getState().addScore(hand(0, 0));
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(bad.errors.length).toBeGreaterThan(0);
    expect(store.getState().addScore({ player: 1, kind: 'heels', points: 2 }).ok).toBe(false);
    expect(store.getState().addScore({ player: 1, kind: 'crib', points: 4 }).ok).toBe(false);
    expect(store.getState().addScore({ player: 2 as 0, kind: 'hand', points: 4 }).ok).toBe(false);
    expect(store.getState().currentGame!.events).toHaveLength(0);
    expect(store.getState().undoLastScore().ok).toBe(false);
    expect(store.getState().updateScore('nope', { ...hand(0, 4), deal: 1 }).ok).toBe(false);
  });

  it('moves to the next deal and rotates the dealer', async () => {
    const { store } = await setup();
    store.getState().startGame(two);
    store.getState().addScore(hand(0, 4));
    const eventsBefore = store.getState().currentGame!.events;
    expect(store.getState().nextDeal().ok).toBe(true);
    expect(store.getState().currentGame!.deal).toBe(2);
    expect(store.getState().currentGame!.events).toBe(eventsBefore);
    expect(selectDealer(store.getState())).toBe(1);
    expect(store.getState().addScore({ player: 1, kind: 'crib', points: 6 }).ok).toBe(true);
    expect(store.getState().currentGame!.events[1].deal).toBe(2);
    // An explicit later deal bumps the current deal.
    store.getState().addScore({ ...hand(0, 2), deal: 4 });
    expect(store.getState().currentGame!.deal).toBe(4);
  });

  it('keeps the deal at or above the highest remaining event deal on delete/undo', async () => {
    const { store } = await setup();
    store.getState().startGame(two);
    store.getState().addScore(hand(0, 4));
    store.getState().nextDeal();
    store.getState().addScore(hand(1, 4));
    store.getState().nextDeal();
    expect(store.getState().currentGame!.deal).toBe(3);
    expect(store.getState().undoLastScore().ok).toBe(true);
    expect(store.getState().currentGame!.deal).toBe(3);
    const [first] = store.getState().currentGame!.events;
    store.getState().deleteScore(first.id);
    expect(store.getState().currentGame!.deal).toBe(3);
    expect(store.getState().currentGame!.events).toHaveLength(0);

    // Editing an event into a later deal pulls the deal up.
    store.getState().addScore(hand(0, 4));
    const [only] = store.getState().currentGame!.events;
    store.getState().updateScore(only.id, { ...hand(0, 4), deal: 6 });
    expect(store.getState().currentGame!.deal).toBe(6);
  });

  it('undoes and deletes scores, renumbering', async () => {
    const { store } = await setup();
    store.getState().startGame(two);
    store.getState().addScore(hand(0, 4));
    store.getState().addScore(hand(1, 5));
    store.getState().addScore(hand(0, 6));
    const [first, second] = store.getState().currentGame!.events;
    expect(store.getState().undoLastScore().ok).toBe(true);
    expect(selectTotals(store.getState())).toEqual([4, 5]);
    expect(store.getState().deleteScore(first.id).ok).toBe(true);
    const { events } = store.getState().currentGame!;
    expect(events.map((e) => [e.id, e.number])).toEqual([[second.id, 1]]);
    expect(selectTotals(store.getState())).toEqual([0, 5]);
  });

  it('edits a score and rejects invalid edits without changing state', async () => {
    const { store } = await setup();
    store.getState().startGame(two);
    store.getState().addScore(hand(0, 4));
    store.getState().addScore(hand(1, 5));
    const [first, second] = store.getState().currentGame!.events;
    expect(store.getState().updateScore(first.id, { ...hand(1, 9), deal: 1 }).ok).toBe(true);
    const events = store.getState().currentGame!.events;
    expect(events.map((e) => e.id)).toEqual([first.id, second.id]);
    expect(selectTotals(store.getState())).toEqual([0, 14]);
    const before = store.getState().currentGame;
    expect(store.getState().updateScore(first.id, { ...hand(1, 99), deal: 1 }).ok).toBe(false);
    expect(store.getState().currentGame).toBe(before);
  });

  it('finishes automatically at the target and rejects further scores', async () => {
    const { store } = await setup();
    store.getState().startGame(two);
    for (let i = 0; i < 4; i++) store.getState().addScore(hand(0, 29)); // 116
    expect(store.getState().currentGame!.status).toBe('inProgress');
    store.getState().addScore(hand(1, 20));
    store.getState().addScore(hand(0, 29)); // 145 -> capped at 121
    const game = store.getState().currentGame!;
    expect(game.status).toBe('finished');
    expect(selectIsGameOver(store.getState())).toBe(true);
    expect(selectTotals(store.getState())).toEqual([121, 20]);
    expect(selectResult(store.getState())).toMatchObject({ winner: 0, margin: 101 });
    expect(selectResult(store.getState())!.skunk).toEqual(['none', 'doubleSkunk']);
    expect(store.getState().history.map((g) => g.id)).toEqual([game.id]);
    expect(store.getState().addScore(hand(1, 5)).ok).toBe(false);
    expect(store.getState().nextDeal().ok).toBe(false);
    expect(selectHasSavedGame(store.getState())).toBe(false);
  });

  it('reopens a finished game when the winning score is undone or deleted', async () => {
    const { store } = await setup();
    store.getState().startGame({ ...two, target: 61 });
    for (let i = 0; i < 3; i++) store.getState().addScore(hand(0, 21)); // 63
    expect(store.getState().currentGame!.status).toBe('finished');
    store.getState().undoLastScore();
    expect(store.getState().currentGame!.status).toBe('inProgress');
    expect(store.getState().history).toHaveLength(0);
    expect(store.getState().addScore(hand(0, 21)).ok).toBe(true);
    expect(store.getState().currentGame!.status).toBe('finished');
    store.getState().deleteScore(store.getState().currentGame!.events[0].id);
    expect(store.getState().currentGame!.status).toBe('inProgress');
  });

  it('truncates events after the win when an edit ends the game earlier', async () => {
    const { store } = await setup();
    store.getState().startGame({ ...two, target: 61 });
    store.getState().addScore(hand(0, 20));
    store.getState().addScore(hand(1, 10));
    store.getState().addScore(hand(0, 20));
    store.getState().addScore(hand(0, 15));
    store.getState().addScore(hand(0, 3)); // 58, still in progress
    expect(store.getState().currentGame!.status).toBe('inProgress');
    const [first] = store.getState().currentGame!.events;
    store.getState().updateScore(first.id, { ...hand(0, 29), deal: 1 }); // 29, 49, 64 -> over
    const game = store.getState().currentGame!;
    expect(game.events.map((e) => e.number)).toEqual([1, 2, 3, 4]);
    expect(game.status).toBe('finished');
    expect(store.getState().history).toHaveLength(1);
  });

  it('can finish early and abandon without recording history', async () => {
    const { store } = await setup();
    store.getState().startGame(two);
    expect(store.getState().finishGame().ok).toBe(false);
    store.getState().addScore(hand(0, 4));
    expect(store.getState().finishGame().ok).toBe(true);
    expect(store.getState().currentGame!.status).toBe('finished');
    expect(selectIsGameOver(store.getState())).toBe(false);
    expect(store.getState().history).toHaveLength(1);

    store.getState().startGame(two);
    store.getState().abandonGame();
    expect(store.getState().currentGame).toBeNull();
    expect(store.getState().history).toHaveLength(1);
    store.getState().clear();
    expect(store.getState().history).toHaveLength(0);
  });

  it('keeps only the last 20 finished games, newest first', async () => {
    const { store } = await setup();
    for (let i = 0; i < MAX_HISTORY + 5; i++) {
      store.getState().startGame({ ...two, names: [`A${i}`, 'B'] });
      store.getState().addScore(hand(0, 4));
      store.getState().finishGame();
    }
    const { history } = store.getState();
    expect(history).toHaveLength(MAX_HISTORY);
    expect(history[0].players[0]).toBe(`A${MAX_HISTORY + 4}`);
  });

  it('restores an in-progress game after a restart', async () => {
    const storage = memoryStorage();
    const first = await setup(storage);
    first.store.getState().startGame({ names: ['Ann', 'Bob', 'Cy'], target: 61, firstDealer: 1 });
    first.store.getState().addScore(hand(1, 4));
    first.store.getState().nextDeal();
    const saved = first.store.getState().currentGame;

    const second = await setup(storage);
    expect(second.store.getState().currentGame).toEqual(saved);
    expect(selectHasSavedGame(second.store.getState())).toBe(true);
    expect(selectTotals(second.store.getState())).toEqual([0, 4, 0]);
    expect(second.store.getState().addScore(hand(2, 4)).ok).toBe(true);
  });

  it('starts empty when storage is missing, corrupt or malformed', async () => {
    const wrap = (state: unknown, version = 1) => JSON.stringify({ state, version });
    const valid = {
      id: 'x',
      startedAt: 1,
      players: ['a', 'b'],
      target: 121,
      firstDealer: 0,
      deal: 1,
      events: [],
      status: 'inProgress',
    };
    const ev = (over: object) => ({
      id: 'e',
      player: 0,
      kind: 'hand',
      points: 4,
      deal: 1,
      ...over,
    });
    const bad = [
      '{not json',
      'null',
      wrap(null),
      wrap({ currentGame: 'oops' }),
      wrap({ currentGame: { ...valid, players: ['a'] } }),
      wrap({ currentGame: { ...valid, players: ['a', 'b', 'c', 'd'] } }),
      wrap({ currentGame: { ...valid, players: ['a', 2] } }),
      wrap({ currentGame: { ...valid, target: 100 } }),
      wrap({ currentGame: { ...valid, firstDealer: 2 } }),
      wrap({ currentGame: { ...valid, deal: 0 } }),
      wrap({ currentGame: { ...valid, id: '' } }),
      wrap({ currentGame: { ...valid, events: 'x' } }),
      wrap({ currentGame: { ...valid, events: [ev({ player: 7 })] } }),
      wrap({ currentGame: { ...valid, events: [ev({ kind: 'nope' })] } }),
      wrap({ currentGame: { ...valid, events: [ev({ points: 'lots' })] } }),
      wrap({ currentGame: { ...valid, events: [ev({ kind: 'heels', player: 1, points: 2 })] } }),
      wrap({ currentGame: { ...valid, events: [null] } }),
    ];
    for (const raw of bad) {
      const { store } = await setup(memoryStorage({ [STORAGE_KEY]: raw }));
      expect(store.persist.hasHydrated()).toBe(true);
      expect(store.getState().currentGame).toBeNull();
      expect(store.getState().history).toEqual([]);
      expect(store.getState().startGame(two).ok).toBe(true);
    }
  });

  it('drops unusable history entries and unfinished history games', async () => {
    const game = (id: string, status: string) => ({
      id,
      startedAt: 1,
      players: ['a', 'b'],
      target: 121,
      firstDealer: 0,
      deal: 1,
      events: [{ id: 'e', player: 0, kind: 'hand', points: 4, deal: 1 }],
      status,
    });
    const { store } = await setup(
      memoryStorage({
        [STORAGE_KEY]: JSON.stringify({
          state: {
            currentGame: null,
            history: [game('a', 'finished'), game('b', 'inProgress'), 5],
          },
          version: 1,
        }),
      }),
    );
    expect(store.getState().history.map((g) => g.id)).toEqual(['a']);
  });

  it('survives a storage backend that throws', async () => {
    const broken: StateStorage = {
      getItem: async () => {
        throw new Error('read failed');
      },
      setItem: async () => {
        throw new Error('write failed');
      },
      removeItem: async () => {},
    };
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { store } = await setup(broken);
    expect(store.persist.hasHydrated()).toBe(true);
    store.getState().startGame(two);
    expect(store.getState().addScore(hand(0, 4)).ok).toBe(true);
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('rebuilds events from inputs (renumber, truncate, deal fix-up) and migrates old versions', async () => {
    const entry = (id: string, number: number, points: number, deal: number) => ({
      id,
      number,
      player: 0,
      kind: 'hand',
      points,
      deal,
    });
    const stored = {
      currentGame: {
        id: 'g',
        startedAt: 1,
        players: ['A', 'B'],
        target: 61,
        firstDealer: 0,
        deal: 1,
        status: 'inProgress',
        extra: 'ignored',
        events: [
          entry('e1', 9, 29, 1),
          entry('e2', 9, 29, 3),
          entry('e3', 9, 29, 3),
          entry('e4', 9, 5, 3),
        ],
      },
      history: [],
    };
    const { store } = await setup(
      memoryStorage({ [STORAGE_KEY]: JSON.stringify({ state: stored, version: 0 }) }),
    );
    const game = store.getState().currentGame!;
    expect(game.events.map((e) => e.number)).toEqual([1, 2, 3]);
    expect(game.status).toBe('finished');
    expect(game.deal).toBe(3);
    expect(game).not.toHaveProperty('extra');
    expect(selectTotals(store.getState())).toEqual([61, 0]);
  });

  it('writes persisted state to storage', async () => {
    const { store, storage } = await setup();
    store.getState().startGame(two);
    const parsed = JSON.parse(storage.data[STORAGE_KEY]);
    expect(parsed.version).toBe(1);
    expect(parsed.state.currentGame.players).toEqual(['A', 'B']);
    expect(parsed.state.addScore).toBeUndefined();
  });

  it('returns referentially stable selector results', async () => {
    const { store } = await setup();
    const empty = store.getState();
    expect(selectTotals(empty)).toBe(selectTotals(empty));
    expect(selectPegs(empty)).toBe(selectPegs(empty));
    expect(selectResult(empty)).toBeNull();
    expect(selectContext(empty)).toBeNull();
    expect(selectDealer(empty)).toBeNull();

    store.getState().startGame(two);
    store.getState().addScore(hand(0, 4));
    const a = store.getState();
    expect(selectTotals(a)).toBe(selectTotals(a));
    expect(selectPegs(a)).toBe(selectPegs(a));
    expect(selectResult(a)).toBe(selectResult(a));
    expect(selectContext(a)).toBe(selectContext(a));

    // Unrelated state changes keep the same references.
    store.getState().nextDeal();
    const b = store.getState();
    expect(b).not.toBe(a);
    expect(selectTotals(b)).toBe(selectTotals(a));
    expect(selectPegs(b)).toBe(selectPegs(a));
    expect(selectResult(b)).toBe(selectResult(a));
    expect(selectContext(b)).toBe(selectContext(a));

    // New events produce fresh values.
    store.getState().addScore(hand(1, 3));
    expect(selectTotals(store.getState())).not.toBe(selectTotals(b));
  });

  it('shares context for identical setups', async () => {
    const { store } = await setup();
    store.getState().startGame(two);
    const ctx = selectContext(store.getState());
    store.getState().startGame(two);
    expect(selectContext(store.getState())).toBe(ctx);
    expect(ctx).toMatchObject({ playerCount: 2, firstDealer: 0 });
  });
});
