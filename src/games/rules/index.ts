import { euchreRules } from './euchre';
import { ginRummyRules } from './ginRummy';
import { heartsRules } from './hearts';
import { spadesRules } from './spades';
import type { GameRules } from './types';

export type { GameRules, RulesSection, ScoreRow } from './types';

/** Rules content keyed by game id; every game in the registry must have an entry. */
const rulesByGame: Record<string, GameRules> = {
  ginRummy: ginRummyRules,
  hearts: heartsRules,
  spades: spadesRules,
  euchre: euchreRules,
};

export function getRules(gameId: string): GameRules | undefined {
  return rulesByGame[gameId];
}
