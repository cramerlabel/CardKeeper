import type { StateStorage } from 'zustand/middleware';

import type { HandInput } from '../engine';
import { createGinStore } from './createGinStore';
import { STORAGE_KEY } from './persistence';
import { selectFinalScore, selectHasSavedGame, selectIsGameOver, selectTotals } from './selectors';

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

// Knocker 0 knocks with 5, opponent has 25 -> player 0 scores 20.
const knock = (opp = 25): HandInput => ({ knocker: 0, kind: 'knock', deadwood: [5, opp] });
const gin = (opp = 10): HandInput => ({ knocker: 0, kind: 'gin', deadwood: [0, opp] }); // 25 + opp
const undercut: HandInput = { knocker: 0, kind: 'knock', deadwood: [5, 3] }; // player 1: 25 + 2

async function setup(storage = memoryStorage()) {
  const store = createGinStore(storage);
  await store.persist.rehydrate();
  return { store, storage };
}

describe('ginStore', () => {
  it('starts a game with trimmed / default names', async () => {
    const { store } = await setup();
    store.getState().startGame(['  Ann ', ' ']);
    const game = store.getState().currentGame!;
    expect(game.players).toEqual(['Ann', 'Player 2']);
    expect(game.status).toBe('inProgress');
    expect(game.hands).toEqual([]);
    expect(selectHasSavedGame(store.getState())).toBe(true);
  });

  it('adds hands, numbers them and computes totals', async () => {
    const { store } = await setup();
    store.getState().startGame(['A', 'B']);
    expect(store.getState().addHand(knock())).toEqual({ ok: true });
    expect(store.getState().addHand(undercut)).toEqual({ ok: true });
    const { hands } = store.getState().currentGame!;
    expect(hands.map((h) => h.number)).toEqual([1, 2]);
    expect(selectTotals(store.getState())).toEqual([20, 27]);
    // stable reference for Zustand selectors
    expect(selectTotals(store.getState())).toBe(selectTotals(store.getState()));
  });

  it('rejects invalid input and actions without a game', async () => {
    const { store } = await setup();
    expect(store.getState().addHand(knock()).ok).toBe(false);
    store.getState().startGame(['A', 'B']);
    const result = store.getState().addHand({ knocker: 0, kind: 'knock', deadwood: [0, 5] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBeGreaterThan(0);
    expect(store.getState().currentGame!.hands).toHaveLength(0);
    expect(store.getState().undoLastHand().ok).toBe(false);
    expect(store.getState().updateHand('nope', knock()).ok).toBe(false);
  });

  it('undoes the last hand', async () => {
    const { store } = await setup();
    store.getState().startGame(['A', 'B']);
    store.getState().addHand(knock());
    store.getState().addHand(knock(30));
    expect(store.getState().undoLastHand().ok).toBe(true);
    expect(selectTotals(store.getState())).toEqual([20, 0]);
    expect(store.getState().currentGame!.hands).toHaveLength(1);
  });

  it('edits a hand, recomputing points', async () => {
    const { store } = await setup();
    store.getState().startGame(['A', 'B']);
    store.getState().addHand(knock());
    store.getState().addHand(knock());
    const [first, second] = store.getState().currentGame!.hands;
    expect(store.getState().updateHand(first.id, undercut).ok).toBe(true);
    const hands = store.getState().currentGame!.hands;
    expect(hands.map((h) => h.id)).toEqual([first.id, second.id]);
    expect(hands.map((h) => h.number)).toEqual([1, 2]);
    expect(selectTotals(store.getState())).toEqual([20, 27]);
    expect(
      store.getState().updateHand(first.id, { knocker: 0, kind: 'gin', deadwood: [4, 1] }).ok,
    ).toBe(false);
    expect(selectTotals(store.getState())).toEqual([20, 27]);
  });

  it('finishes automatically at the target score and rejects further hands', async () => {
    const { store } = await setup();
    store.getState().startGame(['A', 'B']);
    for (let i = 0; i < 3; i++) store.getState().addHand(gin(10)); // 35 each -> 105
    const game = store.getState().currentGame!;
    expect(game.status).toBe('finished');
    expect(selectIsGameOver(store.getState())).toBe(true);
    expect(selectFinalScore(store.getState()).winner).toBe(0);
    expect(store.getState().history.map((g) => g.id)).toEqual([game.id]);
    expect(store.getState().addHand(knock()).ok).toBe(false);
    expect(selectHasSavedGame(store.getState())).toBe(false);
  });

  it('reopens a finished game when the winning hand is undone', async () => {
    const { store } = await setup();
    store.getState().startGame(['A', 'B']);
    for (let i = 0; i < 3; i++) store.getState().addHand(gin(10));
    store.getState().undoLastHand();
    expect(store.getState().currentGame!.status).toBe('inProgress');
    expect(store.getState().history).toHaveLength(0);
    expect(store.getState().addHand(knock()).ok).toBe(true);
  });

  it('truncates hands after the winning hand when an edit ends the game earlier', async () => {
    const { store } = await setup();
    store.getState().startGame(['A', 'B']);
    store.getState().addHand(gin(10)); // 35
    store.getState().addHand(gin(10)); // 70
    store.getState().addHand(knock()); // 90
    store.getState().addHand(knock()); // 110 -> over
    expect(store.getState().currentGame!.status).toBe('finished');
    const [first] = store.getState().currentGame!.hands;
    // Gin against 100 deadwood: 125 points, ends the game on hand 1.
    store.getState().updateHand(first.id, { knocker: 0, kind: 'gin', deadwood: [0, 100] }); // 125
    const game = store.getState().currentGame!;
    expect(game.hands).toHaveLength(1);
    expect(game.status).toBe('finished');
  });

  it('can finish a game early and abandon without recording history', async () => {
    const { store } = await setup();
    store.getState().startGame(['A', 'B']);
    expect(store.getState().finishGame().ok).toBe(false);
    store.getState().addHand(knock());
    expect(store.getState().finishGame().ok).toBe(true);
    expect(store.getState().currentGame!.status).toBe('finished');
    expect(store.getState().history).toHaveLength(1);

    store.getState().startGame(['C', 'D']);
    store.getState().abandonGame();
    expect(store.getState().currentGame).toBeNull();
    expect(store.getState().history).toHaveLength(1);
    store.getState().clear();
    expect(store.getState().history).toHaveLength(0);
  });

  it('keeps only the last 20 finished games', async () => {
    const { store } = await setup();
    for (let i = 0; i < 25; i++) {
      store.getState().startGame([`A${i}`, 'B']);
      store.getState().addHand(knock());
      store.getState().finishGame();
    }
    const { history } = store.getState();
    expect(history).toHaveLength(20);
    expect(history[0].players[0]).toBe('A24');
  });

  it('restores an in-progress game after a restart', async () => {
    const storage = memoryStorage();
    const first = await setup(storage);
    first.store.getState().startGame(['Ann', 'Bob']);
    first.store.getState().addHand(knock());
    first.store.getState().addHand(undercut);
    const saved = first.store.getState().currentGame;

    const second = await setup(storage);
    expect(second.store.getState().currentGame).toEqual(saved);
    expect(selectHasSavedGame(second.store.getState())).toBe(true);
    expect(selectTotals(second.store.getState())).toEqual([20, 27]);
    expect(second.store.getState().addHand(knock()).ok).toBe(true);
  });

  it('starts empty when storage is missing, corrupt or malformed', async () => {
    const wrap = (state: unknown, version = 1) => JSON.stringify({ state, version });
    const bad = [
      '{not json',
      'null',
      wrap({ currentGame: 'oops' }),
      wrap({
        currentGame: {
          id: 'x',
          startedAt: 1,
          players: ['a', 'b'],
          hands: [{ id: 'h', input: { knocker: 7 } }],
          status: 'inProgress',
        },
      }),
      wrap(null),
    ];
    for (const raw of bad) {
      const { store } = await setup(memoryStorage({ [STORAGE_KEY]: raw }));
      expect(store.getState().currentGame).toBeNull();
      expect(store.getState().history).toEqual([]);
      store.getState().startGame(['A', 'B']);
      expect(store.getState().currentGame).not.toBeNull();
    }
  });

  it('rebuilds points from inputs, ignoring tampered stored points, and migrates old versions', async () => {
    const stored = {
      currentGame: {
        id: 'g',
        startedAt: 1,
        players: ['A', 'B'],
        status: 'inProgress',
        hands: [{ id: 'h1', number: 9, winner: 1, points: 999, outcome: 'gin', input: knock() }],
      },
      history: [],
    };
    const { store } = await setup(
      memoryStorage({ [STORAGE_KEY]: JSON.stringify({ state: stored, version: 0 }) }),
    );
    const hand = store.getState().currentGame!.hands[0];
    expect(hand).toMatchObject({ number: 1, winner: 0, points: 20, outcome: 'knock' });
  });

  it('writes persisted state to storage', async () => {
    const { store, storage } = await setup();
    store.getState().startGame(['A', 'B']);
    const parsed = JSON.parse(storage.data[STORAGE_KEY]);
    expect(parsed.version).toBe(1);
    expect(parsed.state.currentGame.players).toEqual(['A', 'B']);
    expect(parsed.state.addHand).toBeUndefined();
  });
});
