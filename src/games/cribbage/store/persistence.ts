import {
  SCORE_KINDS,
  getConfig,
  isGameOver,
  rebuildEvents,
  type GameContext,
  type PlayerCount,
  type PlayerIndex,
  type ScoreEntry,
  type ScoreEvent,
} from '../engine';
import type { CribbageGame, CribbageState, GameStatus } from './types';

export const STORAGE_KEY = 'card-keeper/cribbage';
export const STORAGE_VERSION = 1;
export const MAX_HISTORY = 20;

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const contextCache = new Map<string, GameContext>();

/** Returns the same context object for the same game setup, so selectors stay referentially stable. */
export function buildContext(
  game: Pick<CribbageGame, 'players' | 'target' | 'firstDealer'>,
): GameContext {
  const playerCount = game.players.length as PlayerCount;
  const key = `${playerCount}:${game.firstDealer}:${game.target}`;
  let ctx = contextCache.get(key);
  if (!ctx) {
    ctx = { playerCount, firstDealer: game.firstDealer, config: getConfig(game.target) };
    contextCache.set(key, ctx);
  }
  return ctx;
}

export const maxEventDeal = (events: readonly ScoreEvent[]): number =>
  events.reduce((max, e) => Math.max(max, e.deal), 1);

export function deriveStatus(
  events: readonly ScoreEvent[],
  ctx: GameContext,
  requested: GameStatus = 'inProgress',
): GameStatus {
  if (isGameOver(events, ctx)) return 'finished';
  return requested === 'finished' && events.length > 0 ? 'finished' : 'inProgress';
}

const isKind = (value: unknown): boolean => SCORE_KINDS.some((k) => k.kind === value);

function parseEntries(raw: unknown[]): ScoreEntry[] | null {
  const entries: ScoreEntry[] = [];
  for (const item of raw) {
    if (!isObject(item) || typeof item.id !== 'string' || item.id === '') return null;
    const { player, kind, points, deal } = item;
    if (!isKind(kind)) return null;
    entries.push({
      id: item.id,
      input: { player, kind, points, deal } as ScoreEntry['input'],
    });
  }
  return entries;
}

function parseGame(raw: unknown): CribbageGame | null {
  if (!isObject(raw)) return null;
  const { id, startedAt, players, target, firstDealer, deal, events, status } = raw;
  if (typeof id !== 'string' || id === '') return null;
  if (typeof startedAt !== 'number' || !Number.isFinite(startedAt)) return null;
  if (!Array.isArray(players) || players.length < 2 || players.length > 3) return null;
  if (!players.every((p) => typeof p === 'string')) return null;
  if (target !== 121 && target !== 61) return null;
  if (!Number.isInteger(firstDealer) || (firstDealer as number) < 0) return null;
  if ((firstDealer as number) >= players.length) return null;
  if (!Number.isInteger(deal) || (deal as number) < 1) return null;
  if (!Array.isArray(events)) return null;

  const entries = parseEntries(events);
  if (!entries) return null;

  const base = {
    players: [...(players as string[])],
    target: target as 121 | 61,
    firstDealer: firstDealer as PlayerIndex,
  };
  const ctx = buildContext(base);
  try {
    const rebuilt = rebuildEvents(entries, ctx);
    return {
      id,
      startedAt,
      ...base,
      deal: Math.max(deal as number, maxEventDeal(rebuilt)),
      events: rebuilt,
      status: deriveStatus(rebuilt, ctx, status === 'finished' ? 'finished' : 'inProgress'),
    };
  } catch {
    return null;
  }
}

/** Validates untrusted persisted data; anything unusable is dropped rather than thrown. */
export function sanitizePersistedState(raw: unknown): CribbageState {
  const empty: CribbageState = { currentGame: null, history: [] };
  if (!isObject(raw)) return empty;

  const history: CribbageGame[] = [];
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
export function migrateState(persisted: unknown, version: number): CribbageState {
  let state: unknown = persisted;
  switch (version) {
    // case 0: state = upgradeV0ToV1(state); falls through
    default:
      break;
  }
  return sanitizePersistedState(state);
}
