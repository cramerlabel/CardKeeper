import type { PegPosition } from '@/games/cribbage/engine';
import type { BoardGeometry } from './geometry';

/** Track position of the second start hole, where a back peg waits before its first move. */
export const BACK_START_POSITION = -1;

export const MIN_MOVE_MS = 220;
export const MOVE_MS_PER_HOLE = 18;
export const MAX_MOVE_MS = 600;

export type PegSlot = 0 | 1;

/** The two physical pegs of one player, tracked by identity so a leapfrog moves only one. */
export interface PegSlots {
  /** Track position of each physical peg (see BACK_START_POSITION for the waiting back peg). */
  positions: readonly [number, number];
  /** Which physical peg currently leads. */
  front: PegSlot;
}

export interface PegMove {
  slot: PegSlot;
  from: number;
  to: number;
}

export interface PegPlan {
  slots: PegSlots;
  moves: PegMove[];
}

export interface MotionOptions {
  animate: boolean;
  reduceMotion: boolean;
}

export interface LaneKeyframes {
  input: number[];
  x: number[];
  y: number[];
}

/** Where the leading and trailing pegs sit; a back peg of 0 waits in the second start hole. */
export function trackPositions(peg: PegPosition): { front: number; back: number } {
  return { front: peg.front, back: peg.back > 0 ? peg.back : BACK_START_POSITION };
}

export function initialPegSlots(peg: PegPosition): PegSlots {
  const { front, back } = trackPositions(peg);
  return { positions: [front, back], front: 0 };
}

function moveCost(moves: PegMove[]): number {
  return moves.reduce((total, move) => total + Math.abs(move.to - move.from), 0);
}

function assign(current: PegSlots, frontSlot: PegSlot, target: PegPosition): PegPlan {
  const { front, back } = trackPositions(target);
  const backSlot: PegSlot = frontSlot === 0 ? 1 : 0;
  const positions: [number, number] = [0, 0];
  positions[frontSlot] = front;
  positions[backSlot] = back;
  const moves = ([0, 1] as const)
    .map((slot) => ({ slot, from: current.positions[slot], to: positions[slot] }))
    .filter((move) => move.from !== move.to);
  return { slots: { positions, front: frontSlot }, moves };
}

/**
 * Decide which physical peg goes where after a change in a player's front/back positions.
 * Picks the assignment with the least total travel and, on a tie, the one that moves fewer
 * pegs — so a normal score is a leapfrog (the old back peg jumps ahead, the old front stays)
 * and an undo reverses it. Returns the same `slots` object when nothing changed.
 */
export function planPegMoves(current: PegSlots, target: PegPosition): PegPlan {
  const keep = assign(current, current.front, target);
  const swapped = assign(current, current.front === 0 ? 1 : 0, target);
  const keepCost = moveCost(keep.moves);
  const swappedCost = moveCost(swapped.moves);
  const useSwapped =
    swappedCost < keepCost ||
    (swappedCost === keepCost && swapped.moves.length < keep.moves.length);
  const plan = useSwapped ? swapped : keep;

  const unchanged =
    plan.moves.length === 0 &&
    plan.slots.positions[0] === current.positions[0] &&
    plan.slots.positions[1] === current.positions[1] &&
    plan.slots.front === current.front;
  return unchanged ? { slots: current, moves: [] } : plan;
}

/** Animation time for a move: grows with distance and is capped; 0 means jump immediately. */
export function moveDurationMs(move: Pick<PegMove, 'from' | 'to'>, options: MotionOptions): number {
  const distance = Math.abs(move.to - move.from);
  if (distance === 0 || !options.animate || options.reduceMotion) return 0;
  return Math.min(MAX_MOVE_MS, MIN_MOVE_MS + MOVE_MS_PER_HOLE * distance);
}

/**
 * Interpolation keyframes for one lane: track position -1 (second start), 0 (start) and
 * 1..target (score holes) mapped to coordinates. Interpolating a peg's position through these
 * follows the same route as pegPathPoints, so a native-driven value can animate along the track.
 */
export function laneKeyframes(board: BoardGeometry, lane: number): LaneKeyframes {
  const points = [board.backStartPoints[lane], ...board.lanes[lane].holes];
  return {
    input: points.map((_, index) => index + BACK_START_POSITION),
    x: points.map((point) => point.x),
    y: points.map((point) => point.y),
  };
}
