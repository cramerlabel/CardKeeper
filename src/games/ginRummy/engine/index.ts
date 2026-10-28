export { DEFAULT_SCORING_CONFIG } from './config';
export { computeFinalScore, computeTotals, gameWinner, handsWon, isGameOver } from './game';
export { createHandRecord, InvalidHandError, scoreHand, validateHandInput } from './scoring';
export type {
  FinalScore,
  HandInput,
  HandKind,
  HandOutcome,
  HandRecord,
  HandResult,
  Pair,
  PlayerId,
  ScoringConfig,
} from './types';
