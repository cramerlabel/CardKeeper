import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { createSafeStorage } from '@/storage/safeStorage';

import {
  InvalidScoreError,
  createScoreEvent,
  rebuildEvents,
  type PlayerIndex,
  type ScoreEntry,
  type ScoreEvent,
  type ScoreInput,
} from '../engine';
import {
  MAX_HISTORY,
  STORAGE_KEY,
  STORAGE_VERSION,
  buildContext,
  deriveStatus,
  maxEventDeal,
  migrateState,
  sanitizePersistedState,
} from './persistence';
import type {
  ActionResult,
  CribbageGame,
  CribbageState,
  CribbageStore,
  NewScoreInput,
} from './types';

const OK: ActionResult = { ok: true };
const fail = (...errors: string[]): ActionResult => ({ ok: false, errors });

const NO_GAME = 'No game in progress.';
const GAME_OVER = 'The game is already over.';

let idCounter = 0;
const newId = (): string =>
  `${Date.now().toString(36)}-${(idCounter++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const defaultName = (name: string, index: number): string => name.trim() || `Player ${index + 1}`;

/** Keeps history in sync with the game: present (newest first) only while the game is finished. */
function withHistory(history: CribbageGame[], game: CribbageGame | null): CribbageGame[] {
  if (!game) return history;
  const rest = history.filter((g) => g.id !== game.id);
  return game.status === 'finished' ? [game, ...rest].slice(0, MAX_HISTORY) : rest;
}

function toErrors(error: unknown): string[] {
  return error instanceof InvalidScoreError ? error.errors : ['Could not record this score.'];
}

const toEntries = (events: readonly ScoreEvent[]): ScoreEntry[] =>
  events.map(({ id, player, kind, points, deal }) => ({
    id,
    input: { player, kind, points, deal },
  }));

export function createCribbageStore(storage: StateStorage) {
  return create<CribbageStore>()(
    persist(
      (set, get) => {
        /** Applies a new event list to the current game, re-deriving deal, status and history. */
        const commit = (game: CribbageGame, events: ScoreEvent[], requested = game.status) => {
          const next: CribbageGame = {
            ...game,
            events,
            deal: Math.max(game.deal, maxEventDeal(events)),
            status: deriveStatus(events, buildContext(game), requested),
          };
          set((s) => ({ currentGame: next, history: withHistory(s.history, next) }));
        };

        /** Rebuilds all events (renumbering, truncating after a win) from edited entries. */
        const rebuild = (game: CribbageGame, entries: ScoreEntry[]): ActionResult => {
          try {
            commit(game, rebuildEvents(entries, buildContext(game)), 'inProgress');
            return OK;
          } catch (error) {
            return fail(...toErrors(error));
          }
        };

        return {
          currentGame: null,
          history: [],

          startGame: ({ names, target, firstDealer }) => {
            if (names.length < 2 || names.length > 3) return fail('Cribbage needs 2 or 3 players.');
            if (target !== 121 && target !== 61) return fail('Choose a game to 121 or 61.');
            if (!Number.isInteger(firstDealer) || firstDealer < 0 || firstDealer >= names.length) {
              return fail('Choose a valid first dealer.');
            }
            set({
              currentGame: {
                id: newId(),
                startedAt: Date.now(),
                players: names.map(defaultName),
                target,
                firstDealer: firstDealer as PlayerIndex,
                deal: 1,
                events: [],
                status: 'inProgress',
              },
            });
            return OK;
          },

          addScore: (input: NewScoreInput) => {
            const game = get().currentGame;
            if (!game) return fail(NO_GAME);
            if (game.status === 'finished') return fail(GAME_OVER);
            try {
              const event = createScoreEvent(
                newId(),
                game.events.length + 1,
                { ...input, deal: input.deal ?? game.deal },
                buildContext(game),
              );
              commit(game, [...game.events, event]);
              return OK;
            } catch (error) {
              return fail(...toErrors(error));
            }
          },

          updateScore: (id: string, input: ScoreInput) => {
            const game = get().currentGame;
            if (!game) return fail(NO_GAME);
            if (!game.events.some((e) => e.id === id)) return fail('Score not found.');
            const entries = toEntries(game.events).map((e) => (e.id === id ? { id, input } : e));
            return rebuild(game, entries);
          },

          deleteScore: (id) => {
            const game = get().currentGame;
            if (!game) return fail(NO_GAME);
            if (!game.events.some((e) => e.id === id)) return fail('Score not found.');
            return rebuild(
              game,
              toEntries(game.events).filter((e) => e.id !== id),
            );
          },

          undoLastScore: () => {
            const game = get().currentGame;
            if (!game) return fail(NO_GAME);
            if (game.events.length === 0) return fail('No scores to undo.');
            return rebuild(game, toEntries(game.events).slice(0, -1));
          },

          nextDeal: () => {
            const game = get().currentGame;
            if (!game) return fail(NO_GAME);
            if (game.status === 'finished') return fail(GAME_OVER);
            set({ currentGame: { ...game, deal: game.deal + 1 } });
            return OK;
          },

          finishGame: () => {
            const game = get().currentGame;
            if (!game) return fail(NO_GAME);
            if (game.events.length === 0) return fail('Score at least one point first.');
            commit(game, game.events, 'finished');
            return OK;
          },

          abandonGame: () => set({ currentGame: null }),

          clear: () => set({ currentGame: null, history: [] }),
        };
      },
      {
        name: STORAGE_KEY,
        version: STORAGE_VERSION,
        storage: createJSONStorage(() => createSafeStorage(storage)),
        partialize: (state): CribbageState => ({
          currentGame: state.currentGame,
          history: state.history,
        }),
        migrate: (persisted, version) => migrateState(persisted, version),
        // Always validate hydrated data so corrupt or hand-edited storage can't crash the app.
        merge: (persisted, current) => ({ ...current, ...sanitizePersistedState(persisted) }),
      },
    ),
  );
}

export type CribbageStoreApi = ReturnType<typeof createCribbageStore>;
