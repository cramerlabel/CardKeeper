export type PlayerId = 0 | 1;
export type HandKind = 'knock' | 'gin' | 'bigGin';
export type HandOutcome = 'knock' | 'undercut' | 'gin' | 'bigGin';

export interface HandInput {
  knocker: PlayerId;
  kind: HandKind;
  /** Deadwood per player, indexed by PlayerId. Must be 0 for the knocker on gin / big gin. */
  deadwood: [number, number];
}

export interface HandResult {
  /** Player who scores the points (the opponent on an undercut). */
  winner: PlayerId;
  points: number;
  outcome: HandOutcome;
}

/** Persistable record of a scored hand. */
export interface HandRecord extends HandResult {
  id: string;
  /** 1-based position in the game. */
  number: number;
  input: HandInput;
}

export interface ScoringConfig {
  ginBonus: number;
  bigGinBonus: number;
  undercutBonus: number;
  gameBonus: number;
  shutoutGameBonus: number;
  boxBonus: number;
  targetScore: number;
  maxKnockDeadwood: number;
  /** Highest deadwood a player can hold (10 cards worth 10 each). */
  maxDeadwood: number;
}

export type Pair = [number, number];

export interface FinalScore {
  /** Player who reached the target score first (receives the game bonus); null while the game is not over. */
  winner: PlayerId | null;
  /** Player with the higher final total (after bonuses); null on a tie. May differ from `winner`. */
  finalLeader: PlayerId | null;
  raw: Pair;
  handsWon: Pair;
  boxBonus: Pair;
  gameBonus: Pair;
  shutout: boolean;
  final: Pair;
}
