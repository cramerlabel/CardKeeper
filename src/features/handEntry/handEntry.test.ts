import { createHandRecord, type HandInput } from '@/games/ginRummy/engine';

import {
  appendDigit,
  changeKind,
  changeKnocker,
  entryStateFromHand,
  evaluateEntry,
  firstEditable,
  initialEntryState,
  isLocked,
  removeLastDigit,
  resolvedDeadwood,
  setDeadwood,
  stepDeadwood,
  type EntryState,
} from './handEntry';

const names: [string, string] = ['Alice', 'Bob'];
const hand = (n: number, input: HandInput) => createHandRecord(`h${n}`, n, input);
const state = (over: Partial<EntryState>): EntryState => ({ ...initialEntryState(), ...over });

describe('digit entry', () => {
  it('appends digits without leading zeros', () => {
    expect(appendDigit('', '5')).toBe('5');
    expect(appendDigit('0', '7')).toBe('7');
    expect(appendDigit('0', '0')).toBe('0');
    expect(appendDigit('1', '2')).toBe('12');
  });

  it('ignores digits that would exceed the maximum deadwood', () => {
    expect(appendDigit('10', '0')).toBe('100');
    expect(appendDigit('100', '1')).toBe('100');
    expect(appendDigit('55', '5')).toBe('55');
  });

  it('removes the last digit', () => {
    expect(removeLastDigit('42')).toBe('4');
    expect(removeLastDigit('')).toBe('');
  });

  it('steps within 0..max and keeps an empty field empty when decreasing', () => {
    expect(stepDeadwood('', 1)).toBe('1');
    expect(stepDeadwood('', -1)).toBe('');
    expect(stepDeadwood('0', -1)).toBe('0');
    expect(stepDeadwood('9', 1)).toBe('10');
    expect(stepDeadwood('100', 1)).toBe('100');
  });
});

describe('gin / big gin locking', () => {
  it('locks only the knocker on gin and big gin', () => {
    expect(isLocked(state({ kind: 'knock' }), 0)).toBe(false);
    expect(isLocked(state({ kind: 'gin', knocker: 1 }), 1)).toBe(true);
    expect(isLocked(state({ kind: 'gin', knocker: 1 }), 0)).toBe(false);
    expect(isLocked(state({ kind: 'bigGin' }), 0)).toBe(true);
  });

  it('treats the locked knocker as 0 and clears typed text when locking', () => {
    const typed = state({ deadwood: ['7', '12'] });
    const gin = changeKind(typed, 'gin');
    expect(gin.deadwood).toEqual(['', '12']);
    expect(resolvedDeadwood(gin)).toEqual([0, 12]);
  });

  it('ignores typing into a locked field', () => {
    const gin = state({ kind: 'gin' });
    expect(setDeadwood(gin, 0, '5')).toBe(gin);
  });

  it('clears the new knocker when switching under gin, and leaves the old one editable', () => {
    const gin = state({ kind: 'gin', deadwood: ['', '8'] });
    const switched = changeKnocker(gin, 1);
    expect(switched.deadwood).toEqual(['', '']);
    expect(resolvedDeadwood(switched)).toEqual([null, 0]);
  });

  it('starts on the knocker, or the opponent when the knocker is locked', () => {
    expect(firstEditable(state({ knocker: 1 }))).toBe(1);
    expect(firstEditable(state({ knocker: 1, kind: 'gin' }))).toBe(0);
  });
});

describe('evaluateEntry', () => {
  it('is incomplete until both fields are filled', () => {
    expect(evaluateEntry(initialEntryState(), names, [])).toEqual({
      status: 'incomplete',
      missing: [0, 1],
    });
    expect(evaluateEntry(state({ deadwood: ['3', ''] }), names, [])).toEqual({
      status: 'incomplete',
      missing: [1],
    });
  });

  it('scores a knock', () => {
    const e = evaluateEntry(state({ deadwood: ['4', '18'] }), names, []);
    expect(e).toMatchObject({
      status: 'ready',
      message: 'Alice wins 14 points (Knock)',
      result: { winner: 0, points: 14, outcome: 'knock' },
      endsGame: false,
    });
  });

  it('scores an undercut for the opponent, including equal deadwood', () => {
    const e = evaluateEntry(state({ deadwood: ['8', '5'] }), names, []);
    expect(e).toMatchObject({ status: 'ready', message: 'Undercut! Bob wins 28' });
    const tie = evaluateEntry(state({ deadwood: ['6', '6'] }), names, []);
    expect(tie).toMatchObject({ status: 'ready', message: 'Undercut! Bob wins 25' });
  });

  it('scores gin and big gin with the knocker locked at 0', () => {
    const gin = evaluateEntry(state({ kind: 'gin', knocker: 1, deadwood: ['12', ''] }), names, []);
    expect(gin).toMatchObject({ status: 'ready', message: 'Bob wins 37 points (Gin)' });
    const big = evaluateEntry(state({ kind: 'bigGin', deadwood: ['', '9'] }), names, []);
    expect(big).toMatchObject({ status: 'ready', message: 'Alice wins 40 points (Big Gin)' });
  });

  it('uses the singular for one point', () => {
    const e = evaluateEntry(state({ deadwood: ['4', '5'] }), names, []);
    expect(e).toMatchObject({ status: 'ready', message: 'Alice wins 1 point (Knock)' });
  });

  it('reports engine errors as soon as the knocker is entered', () => {
    const over = evaluateEntry(state({ deadwood: ['11', ''] }), names, []);
    expect(over).toEqual({
      status: 'invalid',
      errors: ["Knocker's deadwood cannot exceed 10."],
    });
    const zero = evaluateEntry(state({ deadwood: ['0', '5'] }), names, []);
    expect(zero).toMatchObject({ status: 'invalid' });
  });

  it('flags a hand that reaches the target', () => {
    const prior = [hand(1, { knocker: 0, kind: 'gin', deadwood: [0, 30] })]; // Alice 55
    const e = evaluateEntry(state({ kind: 'gin', deadwood: ['', '25'] }), names, prior); // +50
    expect(e).toMatchObject({ status: 'ready', endsGame: true });
  });
});

describe('entryStateFromHand', () => {
  it('restores a knock', () => {
    const s = entryStateFromHand(hand(1, { knocker: 1, kind: 'knock', deadwood: [15, 4] }));
    expect(s).toEqual({ knocker: 1, kind: 'knock', deadwood: ['15', '4'] });
  });

  it('leaves the locked knocker empty for gin', () => {
    const s = entryStateFromHand(hand(1, { knocker: 0, kind: 'gin', deadwood: [0, 20] }));
    expect(s).toEqual({ knocker: 0, kind: 'gin', deadwood: ['', '20'] });
  });
});
