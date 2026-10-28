import {
  computeFinalScore,
  computeTotals,
  handsWon,
  isGameOver,
  type FinalScore,
  type HandRecord,
  type Pair,
} from '../engine';
import type { GinState } from './types';

const NO_HANDS: HandRecord[] = [];

/** Memoizes on the hands array identity so selectors return stable references (required by Zustand v5). */
function memoByHands<T>(fn: (hands: readonly HandRecord[]) => T) {
  const cache = new WeakMap<readonly HandRecord[], T>();
  return (hands: readonly HandRecord[]): T => {
    let value = cache.get(hands);
    if (value === undefined) {
      value = fn(hands);
      cache.set(hands, value);
    }
    return value;
  };
}

const totalsOf = memoByHands<Pair>(computeTotals);
const handsWonOf = memoByHands<Pair>(handsWon);
const finalScoreOf = memoByHands<FinalScore>((hands) => computeFinalScore(hands));

type S = Pick<GinState, 'currentGame'>;
const handsOf = (s: S) => s.currentGame?.hands ?? NO_HANDS;

export const selectTotals = (s: S): Pair => totalsOf(handsOf(s));
export const selectHandsWon = (s: S): Pair => handsWonOf(handsOf(s));
export const selectIsGameOver = (s: S): boolean => isGameOver(selectTotals(s));
export const selectFinalScore = (s: S): FinalScore => finalScoreOf(handsOf(s));

/** True when a saved game is waiting to be resumed. */
export const selectHasSavedGame = (s: S): boolean => s.currentGame?.status === 'inProgress';
