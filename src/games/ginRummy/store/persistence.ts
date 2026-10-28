import {
  computeTotals,
  createHandRecord,
  DEFAULT_SCORING_CONFIG,
  isGameOver,
  type HandInput,
  type HandRecord,
} from '../engine';
import type { GameStatus, GinGame, GinState } from './types';

export const STORAGE_KEY = 'card-keeper/gin-rummy';
export const STORAGE_VERSION = 1;
export const MAX_HISTORY = 20;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

/** Recomputes every record from its input, renumbering and dropping hands after the game is won. */
export function rebuildHands(
  entries: readonly { id: string; input: HandInput }[],
  config = DEFAULT_SCORING_CONFIG,
): HandRecord[] {
  const hands: HandRecord[] = [];
  for (const entry of entries) {
    hands.push(createHandRecord(entry.id, hands.length + 1, entry.input, config));
    if (isGameOver(computeTotals(hands), config)) break;
  }
  return hands;
}

export function deriveStatus(
  hands: readonly HandRecord[],
  requested: GameStatus = 'inProgress',
): GameStatus {
  if (isGameOver(computeTotals(hands))) return 'finished';
  return requested === 'finished' && hands.length > 0 ? 'finished' : 'inProgress';
}

function parseGame(raw: unknown): GinGame | null {
  if (!isObject(raw)) return null;
  const { id, startedAt, players, hands, status } = raw;
  if (typeof id !== 'string' || id === '') return null;
  if (typeof startedAt !== 'number' || !Number.isFinite(startedAt)) return null;
  if (!Array.isArray(players) || players.length !== 2) return null;
  if (!players.every((p) => typeof p === 'string')) return null;
  if (!Array.isArray(hands)) return null;

  const entries: { id: string; input: HandInput }[] = [];
  for (const hand of hands) {
    if (!isObject(hand) || typeof hand.id !== 'string' || !isObject(hand.input)) return null;
    entries.push({ id: hand.id, input: hand.input as unknown as HandInput });
  }

  try {
    const rebuilt = rebuildHands(entries);
    return {
      id,
      startedAt,
      players: [players[0], players[1]],
      hands: rebuilt,
      status: deriveStatus(rebuilt, status === 'finished' ? 'finished' : 'inProgress'),
    };
  } catch {
    return null;
  }
}

/** Validates untrusted persisted data; anything unusable is dropped rather than thrown. */
export function sanitizePersistedState(raw: unknown): GinState {
  const empty: GinState = { currentGame: null, history: [] };
  if (!isObject(raw)) return empty;

  const history: GinGame[] = [];
  if (Array.isArray(raw.history)) {
    for (const item of raw.history) {
      const game = parseGame(item);
      if (game && game.status === 'finished') history.push(game);
      if (history.length >= MAX_HISTORY) break;
    }
  }
  return { currentGame: parseGame(raw.currentGame), history };
}

/** Upgrades persisted data from an older schema version. Add a case per version bump. */
export function migrateState(persisted: unknown, version: number): GinState {
  let state: unknown = persisted;
  switch (version) {
    // case 0: state = upgradeV0ToV1(state); falls through
    default:
      break;
  }
  return sanitizePersistedState(state);
}
