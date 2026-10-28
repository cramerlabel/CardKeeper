import type { ScoringConfig } from './types';

export const DEFAULT_SCORING_CONFIG: Readonly<ScoringConfig> = Object.freeze({
  ginBonus: 25,
  bigGinBonus: 31,
  undercutBonus: 25,
  gameBonus: 100,
  shutoutGameBonus: 200,
  boxBonus: 25,
  targetScore: 100,
  maxKnockDeadwood: 10,
  maxDeadwood: 100,
});
