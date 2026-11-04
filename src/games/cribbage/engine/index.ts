export {
  HEELS_POINTS,
  MAX_EVENT_POINTS,
  SCORE_KINDS,
  SHORT_CONFIG,
  STANDARD_CONFIG,
  getConfig,
} from './config';
export {
  ERROR_CRIB_DEALER,
  ERROR_DEAL,
  ERROR_HEELS_DEALER,
  ERROR_HEELS_POINTS,
  ERROR_PLAYER_RANGE,
  ERROR_POINTS_RANGE,
  InvalidScoreError,
  createScoreEvent,
  dealerOf,
  rebuildEvents,
  validateScore,
} from './game';
export { computeResult, computeTotals, isGameOver, pegPositions } from './scoring';
export type {
  CribbageConfig,
  GameContext,
  GameResult,
  PegPosition,
  PlayerCount,
  PlayerIndex,
  ScoreEntry,
  ScoreEvent,
  ScoreInput,
  ScoreKind,
  ScoreKindInfo,
  SkunkLevel,
} from './types';
