import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { InvalidHandError, createHandRecord, type HandInput } from '../engine';
import {
  MAX_HISTORY,
  STORAGE_KEY,
  STORAGE_VERSION,
  deriveStatus,
  migrateState,
  rebuildHands,
  sanitizePersistedState,
} from './persistence';
import type { ActionResult, GinGame, GinState, GinStore } from './types';

const OK: ActionResult = { ok: true };
const fail = (...errors: string[]): ActionResult => ({ ok: false, errors });

let idCounter = 0;
const newId = (): string =>
  `${Date.now().toString(36)}-${(idCounter++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const defaultName = (name: string, index: number): string => name.trim() || `Player ${index + 1}`;

/** Keeps history in sync with the game: present (newest first) only while the game is finished. */
function withHistory(history: GinGame[], game: GinGame | null): GinGame[] {
  if (!game) return history;
  const rest = history.filter((g) => g.id !== game.id);
  return game.status === 'finished' ? [game, ...rest].slice(0, MAX_HISTORY) : rest;
}

function toErrors(error: unknown): string[] {
  return error instanceof InvalidHandError ? error.errors : ['Could not score this hand.'];
}

export function createGinStore(storage: StateStorage) {
  return create<GinStore>()(
    persist(
      (set, get) => {
        /** Applies a new hand list to the current game, re-deriving status and history. */
        const commit = (game: GinGame, hands: GinGame['hands'], requested = game.status) => {
          const next: GinGame = { ...game, hands, status: deriveStatus(hands, requested) };
          set((s) => ({ currentGame: next, history: withHistory(s.history, next) }));
        };

        return {
          currentGame: null,
          history: [],

          startGame: (names) => {
            set({
              currentGame: {
                id: newId(),
                startedAt: Date.now(),
                players: [defaultName(names[0], 0), defaultName(names[1], 1)],
                hands: [],
                status: 'inProgress',
              },
            });
          },

          addHand: (input: HandInput) => {
            const game = get().currentGame;
            if (!game) return fail('No game in progress.');
            if (game.status === 'finished') return fail('The game is already over.');
            try {
              const record = createHandRecord(newId(), game.hands.length + 1, input);
              commit(game, [...game.hands, record]);
              return OK;
            } catch (error) {
              return fail(...toErrors(error));
            }
          },

          updateHand: (id, input) => {
            const game = get().currentGame;
            if (!game) return fail('No game in progress.');
            if (!game.hands.some((h) => h.id === id)) return fail('Hand not found.');
            try {
              const entries = game.hands.map((h) => ({
                id: h.id,
                input: h.id === id ? input : h.input,
              }));
              // Truncates hands that came after the (possibly new) winning hand.
              commit(game, rebuildHands(entries), 'inProgress');
              return OK;
            } catch (error) {
              return fail(...toErrors(error));
            }
          },

          undoLastHand: () => {
            const game = get().currentGame;
            if (!game) return fail('No game in progress.');
            if (game.hands.length === 0) return fail('No hands to undo.');
            commit(game, rebuildHands(game.hands.slice(0, -1)), 'inProgress');
            return OK;
          },

          finishGame: () => {
            const game = get().currentGame;
            if (!game) return fail('No game in progress.');
            if (game.hands.length === 0) return fail('Play at least one hand first.');
            commit(game, game.hands, 'finished');
            return OK;
          },

          abandonGame: () => set({ currentGame: null }),

          clear: () => set({ currentGame: null, history: [] }),
        };
      },
      {
        name: STORAGE_KEY,
        version: STORAGE_VERSION,
        storage: createJSONStorage(() => storage),
        partialize: (state): GinState => ({
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

export type GinStoreApi = ReturnType<typeof createGinStore>;
