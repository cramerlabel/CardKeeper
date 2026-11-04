import {
  computeResult,
  computeTotals,
  dealerOf,
  isGameOver,
  pegPositions,
  type GameContext,
  type GameResult,
  type PegPosition,
  type PlayerIndex,
  type ScoreEvent,
} from '../engine';
import { buildContext } from './persistence';
import type { CribbageState } from './types';

const NO_TOTALS: number[] = [];
const NO_PEGS: PegPosition[] = [];

/**
 * Memoizes on the events array identity so selectors return stable references (required by
 * Zustand v5). A game's context never changes, so the events array alone is a sufficient key.
 */
function memoByEvents<T>(fn: (events: readonly ScoreEvent[], ctx: GameContext) => T) {
  const cache = new WeakMap<readonly ScoreEvent[], T>();
  return (events: readonly ScoreEvent[], ctx: GameContext): T => {
    let value = cache.get(events);
    if (value === undefined) {
      value = fn(events, ctx);
      cache.set(events, value);
    }
    return value;
  };
}

const totalsOf = memoByEvents<number[]>(computeTotals);
const pegsOf = memoByEvents<PegPosition[]>(pegPositions);
const resultOf = memoByEvents<GameResult>(computeResult);

type S = Pick<CribbageState, 'currentGame'>;

/** Stable per game setup; null when there is no game. */
export const selectContext = (s: S): GameContext | null =>
  s.currentGame ? buildContext(s.currentGame) : null;

export const selectTotals = (s: S): number[] => {
  const game = s.currentGame;
  return game ? totalsOf(game.events, buildContext(game)) : NO_TOTALS;
};

export const selectPegs = (s: S): PegPosition[] => {
  const game = s.currentGame;
  return game ? pegsOf(game.events, buildContext(game)) : NO_PEGS;
};

export const selectResult = (s: S): GameResult | null => {
  const game = s.currentGame;
  return game ? resultOf(game.events, buildContext(game)) : null;
};

/** Dealer of the current deal; null when there is no game. */
export const selectDealer = (s: S): PlayerIndex | null => {
  const game = s.currentGame;
  return game ? dealerOf(game.deal, game.firstDealer, game.players.length as 2 | 3) : null;
};

/** True when a player has reached the target (not when the game was ended early). */
export const selectIsGameOver = (s: S): boolean => {
  const game = s.currentGame;
  return game ? isGameOver(game.events, buildContext(game)) : false;
};

/** True when a saved game is waiting to be resumed. */
export const selectHasSavedGame = (s: S): boolean => s.currentGame?.status === 'inProgress';
