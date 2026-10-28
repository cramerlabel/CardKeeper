import { OUTCOME_LABELS } from '@/features/scoreboard/history';
import {
  DEFAULT_SCORING_CONFIG,
  computeTotals,
  scoreHand,
  validateHandInput,
  type HandInput,
  type HandKind,
  type HandRecord,
  type HandResult,
  type PlayerId,
} from '@/games/ginRummy/engine';

export interface EntryState {
  knocker: PlayerId;
  kind: HandKind;
  /** Typed digits per player; '' when nothing entered. Locked fields (knocker on gin / big gin) stay ''. */
  deadwood: [string, string];
}

export const HAND_KINDS: readonly { kind: HandKind; label: string; hint: string }[] = [
  { kind: 'knock', label: 'Knock', hint: 'Knocker has 10 or less deadwood' },
  { kind: 'gin', label: 'Gin', hint: 'Knocker has 0 deadwood' },
  { kind: 'bigGin', label: 'Big Gin', hint: '11 cards, 0 deadwood' },
];

export const otherPlayer = (player: PlayerId): PlayerId => (player === 0 ? 1 : 0);

export function initialEntryState(): EntryState {
  return { knocker: 0, kind: 'knock', deadwood: ['', ''] };
}

/** True for the knocker's field on gin / big gin, which is always 0. */
export function isLocked(state: Pick<EntryState, 'knocker' | 'kind'>, player: PlayerId): boolean {
  return state.kind !== 'knock' && state.knocker === player;
}

export function entryStateFromHand(hand: HandRecord): EntryState {
  const state: EntryState = {
    knocker: hand.input.knocker,
    kind: hand.input.kind,
    deadwood: [String(hand.input.deadwood[0]), String(hand.input.deadwood[1])],
  };
  if (isLocked(state, state.knocker)) state.deadwood[state.knocker] = '';
  return state;
}

function clearLocked(state: EntryState): EntryState {
  if (!isLocked(state, state.knocker) || state.deadwood[state.knocker] === '') return state;
  const deadwood: [string, string] = [...state.deadwood];
  deadwood[state.knocker] = '';
  return { ...state, deadwood };
}

export function changeKind(state: EntryState, kind: HandKind): EntryState {
  return clearLocked({ ...state, kind });
}

export function changeKnocker(state: EntryState, knocker: PlayerId): EntryState {
  return clearLocked({ ...state, knocker });
}

/** The field to edit first: the knocker's, unless it is locked. */
export function firstEditable(state: EntryState): PlayerId {
  return isLocked(state, state.knocker) ? otherPlayer(state.knocker) : state.knocker;
}

/** Numeric deadwood per player; null while a field is still empty. */
export function resolvedDeadwood(state: EntryState): [number | null, number | null] {
  const value = (player: PlayerId): number | null => {
    if (isLocked(state, player)) return 0;
    const text = state.deadwood[player];
    return text === '' ? null : Number(text);
  };
  return [value(0), value(1)];
}

/** Appends a digit to the typed text; ignores input that would exceed the maximum deadwood. */
export function appendDigit(
  text: string,
  digit: string,
  max: number = DEFAULT_SCORING_CONFIG.maxDeadwood,
): string {
  const next = text === '0' ? digit : text + digit;
  return Number(next) > max ? text : next;
}

export function removeLastDigit(text: string): string {
  return text.slice(0, -1);
}

/** Adds `delta` to the field; an empty field counts as 0 when increasing and stays empty when decreasing. */
export function stepDeadwood(
  text: string,
  delta: number,
  max: number = DEFAULT_SCORING_CONFIG.maxDeadwood,
): string {
  if (text === '' && delta < 0) return text;
  const next = Math.min(max, Math.max(0, Number(text || 0) + delta));
  return String(next);
}

export function setDeadwood(state: EntryState, player: PlayerId, text: string): EntryState {
  if (isLocked(state, player) || state.deadwood[player] === text) return state;
  const deadwood: [string, string] = [...state.deadwood];
  deadwood[player] = text;
  return { ...state, deadwood };
}

export type Evaluation =
  | { status: 'incomplete'; missing: PlayerId[] }
  | { status: 'invalid'; errors: string[] }
  | { status: 'ready'; input: HandInput; result: HandResult; message: string; endsGame: boolean };

const plural = (n: number) => `${n} ${n === 1 ? 'point' : 'points'}`;

export function describeResult(result: HandResult, players: readonly [string, string]): string {
  const winner = players[result.winner];
  if (result.outcome === 'undercut') return `Undercut! ${winner} wins ${result.points}`;
  return `${winner} wins ${plural(result.points)} (${OUTCOME_LABELS[result.outcome]})`;
}

/**
 * Validates the entry with the scoring engine. Knocker problems (e.g. knock over 10) are reported
 * as soon as the knocker's deadwood is typed, before the opponent's is.
 * `priorHands` are the hands before this one, used to tell whether it ends the game.
 */
export function evaluateEntry(
  state: EntryState,
  players: readonly [string, string],
  priorHands: readonly HandRecord[],
): Evaluation {
  const resolved = resolvedDeadwood(state);
  const opponent = otherPlayer(state.knocker);

  if (resolved[state.knocker] !== null) {
    const probe: HandInput = {
      knocker: state.knocker,
      kind: state.kind,
      deadwood: [resolved[0] ?? 0, resolved[1] ?? 0],
    };
    const errors = validateHandInput(probe);
    if (errors.length > 0) return { status: 'invalid', errors };
  }

  const missing = ([state.knocker, opponent] as PlayerId[]).filter((p) => resolved[p] === null);
  if (missing.length > 0) return { status: 'incomplete', missing };

  const input: HandInput = {
    knocker: state.knocker,
    kind: state.kind,
    deadwood: [resolved[0] ?? 0, resolved[1] ?? 0],
  };
  const result = scoreHand(input);
  const totals = computeTotals(priorHands);
  totals[result.winner] += result.points;
  return {
    status: 'ready',
    input,
    result,
    message: describeResult(result, players),
    endsGame: totals[result.winner] >= DEFAULT_SCORING_CONFIG.targetScore,
  };
}
