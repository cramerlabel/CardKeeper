import type { PlayerIndex, ScoreEvent, ScoreInput } from '../engine';

export type GameStatus = 'inProgress' | 'finished';

export type ActionResult = { ok: true } | { ok: false; errors: string[] };

export interface CribbageGame {
  id: string;
  startedAt: number;
  /** Two or three player names. */
  players: string[];
  target: 121 | 61;
  firstDealer: PlayerIndex;
  /** Current 1-based deal; never below the highest deal of any logged event. */
  deal: number;
  events: ScoreEvent[];
  status: GameStatus;
}

export interface CribbageState {
  currentGame: CribbageGame | null;
  /** Most recent finished games, newest first. */
  history: CribbageGame[];
}

export interface StartGameOptions {
  names: readonly string[];
  target: 121 | 61;
  firstDealer: PlayerIndex;
}

/** Score input for `addScore`; `deal` defaults to the current deal. */
export type NewScoreInput = Omit<ScoreInput, 'deal'> & { deal?: number };

export interface CribbageActions {
  /** Starts a new game, replacing any current one. Fails on an invalid player count, target or dealer. */
  startGame: (options: StartGameOptions) => ActionResult;
  addScore: (input: NewScoreInput) => ActionResult;
  updateScore: (id: string, input: ScoreInput) => ActionResult;
  deleteScore: (id: string) => ActionResult;
  undoLastScore: () => ActionResult;
  /** Moves to the next deal (rotates the dealer). */
  nextDeal: () => ActionResult;
  /** Ends the game now (also used to end early). Requires at least one event. */
  finishGame: () => ActionResult;
  /** Discards the current game without recording it in history. */
  abandonGame: () => void;
  /** Resets everything, including history. */
  clear: () => void;
}

export type CribbageStore = CribbageState & CribbageActions;
