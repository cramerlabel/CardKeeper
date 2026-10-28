import type { HandInput, HandRecord } from '../engine';

export type GameStatus = 'inProgress' | 'finished';

export interface GinGame {
  id: string;
  startedAt: number;
  players: [string, string];
  hands: HandRecord[];
  status: GameStatus;
}

export type ActionResult = { ok: true } | { ok: false; errors: string[] };

export interface GinState {
  currentGame: GinGame | null;
  /** Most recent finished games, newest first. */
  history: GinGame[];
}

export interface GinActions {
  startGame: (names: readonly [string, string]) => void;
  addHand: (input: HandInput) => ActionResult;
  updateHand: (id: string, input: HandInput) => ActionResult;
  undoLastHand: () => ActionResult;
  /** Ends the game now (also used to end early). Requires at least one hand. */
  finishGame: () => ActionResult;
  /** Discards the current game without recording it in history. */
  abandonGame: () => void;
  /** Resets everything, including history. */
  clear: () => void;
}

export type GinStore = GinState & GinActions;
