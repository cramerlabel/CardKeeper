import { DEFAULT_SCORING_CONFIG } from './config';
import type { HandInput, HandRecord, HandResult, PlayerId, ScoringConfig } from './types';

export class InvalidHandError extends Error {
  readonly errors: string[];

  constructor(errors: string[]) {
    super(errors.join('; '));
    this.name = 'InvalidHandError';
    this.errors = errors;
  }
}

const otherPlayer = (player: PlayerId): PlayerId => (player === 0 ? 1 : 0);

/** Returns a list of human-readable problems; empty when the input is valid. */
export function validateHandInput(
  input: HandInput,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): string[] {
  const errors: string[] = [];

  if (input.knocker !== 0 && input.knocker !== 1) {
    errors.push('Knocker must be player 0 or 1.');
  }
  if (input.kind !== 'knock' && input.kind !== 'gin' && input.kind !== 'bigGin') {
    errors.push('Hand type must be knock, gin or big gin.');
  }
  if (!Array.isArray(input.deadwood) || input.deadwood.length !== 2) {
    errors.push('Deadwood must be given for both players.');
    return errors;
  }

  let numbersValid = true;
  input.deadwood.forEach((value, index) => {
    if (!Number.isInteger(value)) {
      errors.push(`Deadwood for player ${index + 1} must be a whole number.`);
      numbersValid = false;
    } else if (value < 0) {
      errors.push(`Deadwood for player ${index + 1} cannot be negative.`);
      numbersValid = false;
    } else if (value > config.maxDeadwood) {
      errors.push(`Deadwood for player ${index + 1} cannot exceed ${config.maxDeadwood}.`);
      numbersValid = false;
    }
  });

  const kinds: string[] = ['knock', 'gin', 'bigGin'];
  if (
    !numbersValid ||
    (input.knocker !== 0 && input.knocker !== 1) ||
    !kinds.includes(input.kind)
  ) {
    return errors;
  }

  const knockerDeadwood = input.deadwood[input.knocker];
  if (input.kind === 'knock') {
    if (knockerDeadwood === 0) {
      errors.push('A knock with 0 deadwood is a Gin. Use Gin.');
    } else if (knockerDeadwood > config.maxKnockDeadwood) {
      errors.push(`Knocker's deadwood cannot exceed ${config.maxKnockDeadwood}.`);
    }
  } else if (knockerDeadwood !== 0) {
    errors.push(
      `${input.kind === 'gin' ? 'Gin' : 'Big Gin'} requires the knocker to have 0 deadwood.`,
    );
  }

  return errors;
}

/** Scores a single hand. Throws InvalidHandError when the input fails validation. */
export function scoreHand(
  input: HandInput,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): HandResult {
  const errors = validateHandInput(input, config);
  if (errors.length > 0) throw new InvalidHandError(errors);

  const knocker = input.knocker;
  const opponent = otherPlayer(knocker);
  const knockerDeadwood = input.deadwood[knocker];
  const opponentDeadwood = input.deadwood[opponent];

  switch (input.kind) {
    case 'gin':
      return {
        winner: knocker,
        points: config.ginBonus + opponentDeadwood,
        outcome: 'gin',
      };
    case 'bigGin':
      return {
        winner: knocker,
        points: config.bigGinBonus + opponentDeadwood,
        outcome: 'bigGin',
      };
    case 'knock':
      // Equal deadwood is an undercut: the opponent wins the hand.
      if (opponentDeadwood <= knockerDeadwood) {
        return {
          winner: opponent,
          points: config.undercutBonus + (knockerDeadwood - opponentDeadwood),
          outcome: 'undercut',
        };
      }
      return {
        winner: knocker,
        points: opponentDeadwood - knockerDeadwood,
        outcome: 'knock',
      };
  }
}

/** Scores the input and wraps it as a persistable record. */
export function createHandRecord(
  id: string,
  number: number,
  input: HandInput,
  config: ScoringConfig = DEFAULT_SCORING_CONFIG,
): HandRecord {
  return {
    ...scoreHand(input, config),
    id,
    number,
    input: { knocker: input.knocker, kind: input.kind, deadwood: [...input.deadwood] },
  };
}
