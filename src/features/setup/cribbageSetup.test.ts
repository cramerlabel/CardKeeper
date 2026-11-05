import {
  buildSetup,
  describeGameLength,
  normalizeDealerChoice,
  resolveFirstDealer,
} from './cribbageSetup';

describe('resolveFirstDealer', () => {
  it('returns a specific choice without drawing', () => {
    const random = jest.fn(() => 0.99);
    expect(resolveFirstDealer(1, 3, random)).toBe(1);
    expect(random).not.toHaveBeenCalled();
  });

  it('maps the random draw onto the player count', () => {
    expect(resolveFirstDealer('random', 2, () => 0)).toBe(0);
    expect(resolveFirstDealer('random', 2, () => 0.49)).toBe(0);
    expect(resolveFirstDealer('random', 2, () => 0.5)).toBe(1);
    expect(resolveFirstDealer('random', 3, () => 0.34)).toBe(1);
    expect(resolveFirstDealer('random', 3, () => 0.99)).toBe(2);
  });

  it('stays in range even if the random source misbehaves', () => {
    expect(resolveFirstDealer('random', 3, () => 1)).toBe(2);
    expect(resolveFirstDealer('random', 3, () => -0.5)).toBe(0);
  });

  it('redraws when the chosen player no longer exists', () => {
    expect(resolveFirstDealer(2, 2, () => 0.9)).toBe(1);
  });

  it('uses Math.random by default', () => {
    const spy = jest.spyOn(Math, 'random').mockReturnValue(0.4);
    try {
      expect(resolveFirstDealer('random', 3)).toBe(1);
    } finally {
      spy.mockRestore();
    }
  });
});

describe('normalizeDealerChoice', () => {
  it('keeps a dealer that still exists', () => {
    expect(normalizeDealerChoice(1, 2)).toBe(1);
    expect(normalizeDealerChoice(2, 3)).toBe(2);
    expect(normalizeDealerChoice('random', 3)).toBe('random');
  });

  it('falls back to random when the player is gone', () => {
    expect(normalizeDealerChoice(2, 2)).toBe('random');
  });
});

describe('buildSetup', () => {
  it('trims names, fills defaults and resolves the dealer', () => {
    const setup = buildSetup(
      { names: ['  Ann ', '', 'Cy'], target: 61, dealer: 'random' },
      () => 0.7,
    );
    expect(setup).toEqual({
      valid: true,
      errors: [null, null, null],
      names: ['Ann', 'Player 2', 'Cy'],
      target: 61,
      firstDealer: 2,
    });
  });

  it('flags duplicates case-insensitively on the later field', () => {
    const setup = buildSetup({ names: ['Sam', 'Bob', ' sAM '], target: 121, dealer: 0 });
    expect(setup.valid).toBe(false);
    expect(setup.errors).toEqual([null, null, 'Players must have different names.']);
  });

  it('treats two blank names as distinct defaults', () => {
    expect(buildSetup({ names: ['', ' '], target: 121, dealer: 0 }).valid).toBe(true);
  });

  it('flags a typed name that clashes with a default for another blank field', () => {
    const setup = buildSetup({ names: ['', 'player 1'], target: 121, dealer: 0 });
    expect(setup.valid).toBe(false);
    expect(setup.errors).toEqual([null, 'Players must have different names.']);
  });

  it('only draws for a random dealer', () => {
    const random = jest.fn(() => 0);
    buildSetup({ names: ['A', 'B'], target: 121, dealer: 1 }, random);
    expect(random).not.toHaveBeenCalled();
    buildSetup({ names: ['A', 'B'], target: 121, dealer: 'random' }, random);
    expect(random).toHaveBeenCalledTimes(1);
  });

  it('is invalid for fewer than 2 or more than 3 players', () => {
    expect(buildSetup({ names: ['A'], target: 121, dealer: 0 }).valid).toBe(false);
    expect(buildSetup({ names: ['A', 'B', 'C', 'D'], target: 121, dealer: 0 }).valid).toBe(false);
  });
});

describe('describeGameLength', () => {
  it('explains both skunk lines for the standard game', () => {
    expect(describeGameLength(121)).toBe(
      'First to 121. Skunk if the loser has under 91, double skunk under 61.',
    );
  });

  it('explains the short game without a double skunk', () => {
    expect(describeGameLength(61)).toBe(
      'First to 61. Skunk if the loser has under 31; no double skunk.',
    );
  });
});
