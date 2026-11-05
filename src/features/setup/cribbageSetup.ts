import { getConfig, type PlayerIndex } from '@/games/cribbage/engine';

import { MAX_LIST_PLAYERS, MIN_LIST_PLAYERS, validateNameList } from './playerNames';

export type CribbageTarget = 121 | 61;

/** A specific player (by index) or a coin-flip resolved when the game starts. */
export type FirstDealerChoice = PlayerIndex | 'random';

/** Returns a number in [0, 1), like `Math.random`. */
export type RandomFn = () => number;

export interface RawCribbageSetup {
  /** Raw text of each name field, one entry per player (2–3). */
  names: readonly string[];
  target: CribbageTarget;
  dealer: FirstDealerChoice;
}

export interface CribbageSetup {
  valid: boolean;
  /** Inline error per name field, or null when that field is fine. */
  errors: (string | null)[];
  /** Trimmed names with "Player N" filled in for blank fields. */
  names: string[];
  target: CribbageTarget;
  firstDealer: PlayerIndex;
}

const isPlayerCount = (count: number): boolean =>
  count >= MIN_LIST_PLAYERS && count <= MAX_LIST_PLAYERS;

const isSpecificDealer = (choice: FirstDealerChoice, playerCount: number): choice is PlayerIndex =>
  choice !== 'random' && Number.isInteger(choice) && choice >= 0 && choice < playerCount;

/** Keeps a chosen dealer only while that player still exists; otherwise falls back to "random". */
export function normalizeDealerChoice(
  choice: FirstDealerChoice,
  playerCount: number,
): FirstDealerChoice {
  return isSpecificDealer(choice, playerCount) ? choice : 'random';
}

/** Picks the first dealer. A specific choice is returned as is; "random" (or a stale index) draws one. */
export function resolveFirstDealer(
  choice: FirstDealerChoice,
  playerCount: number,
  random: RandomFn = Math.random,
): PlayerIndex {
  if (isSpecificDealer(choice, playerCount)) return choice;
  const index = Math.min(playerCount - 1, Math.max(0, Math.floor(random() * playerCount)));
  return index as PlayerIndex;
}

/**
 * Validates the setup form and resolves the first dealer. `random` is only consulted for a "random"
 * choice, so call this when starting the game (not on every render) to get a fresh draw.
 */
export function buildSetup(raw: RawCribbageSetup, random: RandomFn = Math.random): CribbageSetup {
  const { valid, errors, names } = validateNameList(raw.names);
  const playerCount = raw.names.length;
  const countOk = isPlayerCount(playerCount);
  return {
    valid: valid && countOk,
    errors,
    names,
    target: raw.target,
    firstDealer: countOk ? resolveFirstDealer(raw.dealer, playerCount, random) : 0,
  };
}

/** One-line explanation of the game length, with the numbers taken from the engine config. */
export function describeGameLength(target: CribbageTarget): string {
  const { skunkLine, doubleSkunkLine } = getConfig(target);
  const skunk = `Skunk if the loser has under ${skunkLine}`;
  return doubleSkunkLine === null
    ? `First to ${target}. ${skunk}; no double skunk.`
    : `First to ${target}. ${skunk}, double skunk under ${doubleSkunkLine}.`;
}
