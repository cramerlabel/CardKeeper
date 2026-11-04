export type PlayerCount = 2 | 3;
export type PlayerIndex = 0 | 1 | 2;
export type ScoreKind = 'pegging' | 'hand' | 'crib' | 'heels' | 'other';
export type SkunkLevel = 'none' | 'skunk' | 'doubleSkunk';

export interface CribbageConfig {
  /** Points needed to win (the game hole). */
  target: number;
  /** A loser finishing below this line is skunked. */
  skunkLine: number;
  /** A loser finishing below this line is double-skunked; null when the variant has none. */
  doubleSkunkLine: number | null;
}

export interface GameContext {
  playerCount: PlayerCount;
  firstDealer: PlayerIndex;
  config: CribbageConfig;
}

export interface ScoreInput {
  player: PlayerIndex;
  kind: ScoreKind;
  points: number;
  /** 1-based deal number the points were scored in. */
  deal: number;
}

export interface ScoreEvent extends ScoreInput {
  id: string;
  /** 1-based order within the game. */
  number: number;
}

export interface ScoreEntry {
  id: string;
  input: ScoreInput;
}

export interface PegPosition {
  /** Player's current total (leading peg). */
  front: number;
  /** Total before the player's most recent event; 0 means off the board at the start. */
  back: number;
}

export interface GameResult {
  winner: PlayerIndex | null;
  totals: number[];
  skunk: SkunkLevel[];
  /** Winner total minus best opponent total; 0 when there is no winner. */
  margin: number;
}

export interface ScoreKindInfo {
  kind: ScoreKind;
  label: string;
  hint: string;
}
