import { DEFAULT_SCORING_CONFIG } from './config';
import { createHandRecord, InvalidHandError, scoreHand, validateHandInput } from './scoring';
import type { HandInput } from './types';

const knock = (knocker: 0 | 1, k: number, o: number): HandInput => ({
  knocker,
  kind: 'knock',
  deadwood: knocker === 0 ? [k, o] : [o, k],
});
const gin = (knocker: 0 | 1, o: number): HandInput => ({
  knocker,
  kind: 'gin',
  deadwood: knocker === 0 ? [0, o] : [o, 0],
});
const bigGin = (knocker: 0 | 1, o: number): HandInput => ({
  knocker,
  kind: 'bigGin',
  deadwood: knocker === 0 ? [0, o] : [o, 0],
});

describe('scoreHand', () => {
  it('knock 3 vs 9 scores 6 to the knocker', () => {
    expect(scoreHand(knock(0, 3, 9))).toEqual({ winner: 0, points: 6, outcome: 'knock' });
    expect(scoreHand(knock(1, 3, 9))).toEqual({ winner: 1, points: 6, outcome: 'knock' });
  });

  it('knock 8 vs 5 is an undercut worth 25 + 3 to the opponent', () => {
    expect(scoreHand(knock(0, 8, 5))).toEqual({ winner: 1, points: 28, outcome: 'undercut' });
    expect(scoreHand(knock(1, 8, 5))).toEqual({ winner: 0, points: 28, outcome: 'undercut' });
  });

  it('equal deadwood is an undercut worth just the bonus', () => {
    expect(scoreHand(knock(0, 4, 4))).toEqual({ winner: 1, points: 25, outcome: 'undercut' });
  });

  it('undercut with opponent at 0 deadwood', () => {
    expect(scoreHand(knock(0, 10, 0))).toEqual({ winner: 1, points: 35, outcome: 'undercut' });
  });

  it('knock at the maximum deadwood is allowed', () => {
    expect(scoreHand(knock(0, 10, 11))).toEqual({ winner: 0, points: 1, outcome: 'knock' });
  });

  it('gin vs 12 scores 37', () => {
    expect(scoreHand(gin(0, 12))).toEqual({ winner: 0, points: 37, outcome: 'gin' });
    expect(scoreHand(gin(1, 12))).toEqual({ winner: 1, points: 37, outcome: 'gin' });
  });

  it('gin vs 0 deadwood still scores the bonus', () => {
    expect(scoreHand(gin(0, 0))).toEqual({ winner: 0, points: 25, outcome: 'gin' });
  });

  it('big gin vs 12 scores 43', () => {
    expect(scoreHand(bigGin(1, 12))).toEqual({ winner: 1, points: 43, outcome: 'bigGin' });
  });

  it('big gin vs 0 deadwood scores 31', () => {
    expect(scoreHand(bigGin(0, 0))).toEqual({ winner: 0, points: 31, outcome: 'bigGin' });
  });

  it('honours a custom config', () => {
    const config = { ...DEFAULT_SCORING_CONFIG, ginBonus: 20, undercutBonus: 10 };
    expect(scoreHand(gin(0, 5), config).points).toBe(25);
    expect(scoreHand(knock(0, 5, 5), config).points).toBe(10);
  });

  it('throws InvalidHandError with the validation messages', () => {
    let caught: unknown;
    try {
      scoreHand(knock(0, 0, 5));
    } catch (error) {
      caught = error;
    }
    expect(caught).toBeInstanceOf(InvalidHandError);
    expect((caught as InvalidHandError).errors).toEqual([
      'A knock with 0 deadwood is a Gin. Use Gin.',
    ]);
    expect((caught as InvalidHandError).message).toContain('Use Gin');
  });
});

describe('validateHandInput', () => {
  it('accepts valid hands', () => {
    expect(validateHandInput(knock(0, 3, 9))).toEqual([]);
    expect(validateHandInput(gin(1, 0))).toEqual([]);
    expect(validateHandInput(bigGin(0, 100))).toEqual([]);
  });

  it('rejects a knock above the maximum', () => {
    expect(validateHandInput(knock(0, 11, 20))).toEqual(["Knocker's deadwood cannot exceed 10."]);
  });

  it('rejects a knock with zero deadwood', () => {
    expect(validateHandInput(knock(1, 0, 20))).toEqual([
      'A knock with 0 deadwood is a Gin. Use Gin.',
    ]);
  });

  it('rejects gin / big gin with non-zero knocker deadwood', () => {
    expect(validateHandInput({ knocker: 0, kind: 'gin', deadwood: [2, 10] })).toEqual([
      'Gin requires the knocker to have 0 deadwood.',
    ]);
    expect(validateHandInput({ knocker: 1, kind: 'bigGin', deadwood: [10, 3] })).toEqual([
      'Big Gin requires the knocker to have 0 deadwood.',
    ]);
  });

  it('rejects negative deadwood', () => {
    expect(validateHandInput(knock(0, 3, -1))).toEqual([
      'Deadwood for player 2 cannot be negative.',
    ]);
  });

  it('rejects deadwood above the maximum possible', () => {
    expect(validateHandInput(gin(0, 101))).toEqual(['Deadwood for player 2 cannot exceed 100.']);
  });

  it('rejects non-integers', () => {
    expect(validateHandInput(knock(0, 3, 4.5))).toEqual([
      'Deadwood for player 2 must be a whole number.',
    ]);
    expect(validateHandInput(knock(0, Number.NaN, 4))).toEqual([
      'Deadwood for player 1 must be a whole number.',
    ]);
  });

  it('rejects a malformed deadwood tuple', () => {
    const bad = { knocker: 0, kind: 'knock', deadwood: [3] } as unknown as HandInput;
    expect(validateHandInput(bad)).toEqual(['Deadwood must be given for both players.']);
  });

  it('rejects an invalid knocker or kind', () => {
    const badKnocker = { knocker: 2, kind: 'knock', deadwood: [3, 9] } as unknown as HandInput;
    expect(validateHandInput(badKnocker)).toEqual(['Knocker must be player 0 or 1.']);
    const badKind = { knocker: 0, kind: 'oops', deadwood: [3, 9] } as unknown as HandInput;
    expect(validateHandInput(badKind)).toEqual(['Hand type must be knock, gin or big gin.']);
  });

  it('reports multiple problems at once', () => {
    expect(validateHandInput(knock(0, -1, 200))).toHaveLength(2);
  });
});

describe('createHandRecord', () => {
  it('combines the result with id, number and a copy of the input', () => {
    const input = knock(0, 3, 9);
    const record = createHandRecord('h1', 1, input);
    expect(record).toEqual({
      id: 'h1',
      number: 1,
      input,
      winner: 0,
      points: 6,
      outcome: 'knock',
    });
    expect(record.input.deadwood).not.toBe(input.deadwood);
  });

  it('throws on invalid input', () => {
    expect(() => createHandRecord('h1', 1, gin(0, -5))).toThrow(InvalidHandError);
  });
});
