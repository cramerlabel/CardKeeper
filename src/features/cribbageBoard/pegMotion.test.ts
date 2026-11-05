import { STANDARD_CONFIG } from '@/games/cribbage/engine';
import { buildBoard, pegPathPoints, pegPoint } from './geometry';
import {
  BACK_START_POSITION,
  initialPegSlots,
  laneKeyframes,
  MAX_MOVE_MS,
  MIN_MOVE_MS,
  moveDurationMs,
  planPegMoves,
  trackPositions,
  type PegSlots,
} from './pegMotion';

const ANIMATE = { animate: true, reduceMotion: false };

function settle(slots: PegSlots, front: number, back: number): PegSlots {
  return planPegMoves(slots, { front, back }).slots;
}

function roles(slots: PegSlots): { front: number; back: number } {
  return {
    front: slots.positions[slots.front],
    back: slots.positions[slots.front === 0 ? 1 : 0],
  };
}

describe('trackPositions', () => {
  it('parks a back peg of 0 in the second start hole', () => {
    expect(trackPositions({ front: 0, back: 0 })).toEqual({ front: 0, back: BACK_START_POSITION });
    expect(trackPositions({ front: 12, back: 0 })).toEqual({
      front: 12,
      back: BACK_START_POSITION,
    });
    expect(trackPositions({ front: 12, back: 7 })).toEqual({ front: 12, back: 7 });
  });
});

describe('initialPegSlots', () => {
  it('places both pegs without any move', () => {
    expect(initialPegSlots({ front: 40, back: 33 })).toEqual({ positions: [40, 33], front: 0 });
    expect(initialPegSlots({ front: 0, back: 0 })).toEqual({
      positions: [0, BACK_START_POSITION],
      front: 0,
    });
  });
});

describe('planPegMoves', () => {
  it('does nothing when the positions are unchanged and keeps the same slots object', () => {
    const slots = initialPegSlots({ front: 40, back: 33 });
    const plan = planPegMoves(slots, { front: 40, back: 33 });
    expect(plan.moves).toEqual([]);
    expect(plan.slots).toBe(slots);
  });

  it('moves only the front peg for the first score of a player', () => {
    const slots = initialPegSlots({ front: 0, back: 0 });
    const plan = planPegMoves(slots, { front: 8, back: 0 });
    expect(plan.moves).toEqual([{ slot: 0, from: 0, to: 8 }]);
    expect(plan.slots).toEqual({ positions: [8, BACK_START_POSITION], front: 0 });
  });

  it('leapfrogs: the old back peg jumps ahead while the old front peg stays put', () => {
    const slots = initialPegSlots({ front: 8, back: 0 });
    const plan = planPegMoves(slots, { front: 13, back: 8 });
    expect(plan.moves).toEqual([{ slot: 1, from: BACK_START_POSITION, to: 13 }]);
    expect(plan.slots).toEqual({ positions: [8, 13], front: 1 });
  });

  it('keeps leapfrogging between the two physical pegs on later scores', () => {
    let slots = initialPegSlots({ front: 0, back: 0 });
    slots = settle(slots, 8, 0);
    slots = settle(slots, 13, 8);
    const plan = planPegMoves(slots, { front: 20, back: 13 });
    expect(plan.moves).toEqual([{ slot: 0, from: 8, to: 20 }]);
    expect(plan.slots).toEqual({ positions: [20, 13], front: 0 });
  });

  it('moves only the front peg when the gap is untouched (front-only edit)', () => {
    const slots = initialPegSlots({ front: 12, back: 10 });
    const plan = planPegMoves(slots, { front: 15, back: 10 });
    expect(plan.moves).toEqual([{ slot: 0, from: 12, to: 15 }]);
    expect(plan.slots.front).toBe(0);
  });

  it('reverses a leapfrog on undo: the front peg drops back, the back peg stays', () => {
    const slots = initialPegSlots({ front: 13, back: 8 });
    const plan = planPegMoves(slots, { front: 8, back: 0 });
    expect(plan.moves).toEqual([{ slot: 0, from: 13, to: BACK_START_POSITION }]);
    expect(plan.slots).toEqual({ positions: [BACK_START_POSITION, 8], front: 1 });
  });

  it('returns the pegs to the start holes when everything is undone', () => {
    const slots = settle(initialPegSlots({ front: 0, back: 0 }), 8, 0);
    const plan = planPegMoves(slots, { front: 0, back: 0 });
    expect(plan.moves).toEqual([{ slot: 0, from: 8, to: 0 }]);
    expect(plan.slots).toEqual({ positions: [0, BACK_START_POSITION], front: 0 });
  });

  it('moves both pegs when an edit changes both positions', () => {
    const slots = initialPegSlots({ front: 40, back: 30 });
    const plan = planPegMoves(slots, { front: 52, back: 45 });
    expect(plan.moves.map((move) => move.slot).sort()).toEqual([0, 1]);
    expect(roles(plan.slots)).toEqual({ front: 52, back: 45 });
  });

  it('always ends with the front and back pegs where the engine says, across a sequence', () => {
    const steps = [
      { front: 5, back: 0 },
      { front: 9, back: 5 },
      { front: 9, back: 5 },
      { front: 30, back: 9 },
      { front: 4, back: 0 },
      { front: 121, back: 112 },
    ];
    let slots = initialPegSlots({ front: 0, back: 0 });
    for (const step of steps) {
      slots = settle(slots, step.front, step.back);
      expect(roles(slots)).toEqual(trackPositions(step));
    }
  });
});

describe('moveDurationMs', () => {
  it('scales with the distance travelled', () => {
    const short = moveDurationMs({ from: 10, to: 12 }, ANIMATE);
    const long = moveDurationMs({ from: 10, to: 20 }, ANIMATE);
    expect(short).toBeGreaterThanOrEqual(MIN_MOVE_MS);
    expect(long).toBeGreaterThan(short);
  });

  it('is the same for forward and backward moves', () => {
    expect(moveDurationMs({ from: 30, to: 20 }, ANIMATE)).toBe(
      moveDurationMs({ from: 20, to: 30 }, ANIMATE),
    );
  });

  it('is capped', () => {
    expect(moveDurationMs({ from: 0, to: 120 }, ANIMATE)).toBe(MAX_MOVE_MS);
    expect(moveDurationMs({ from: -1, to: 29 }, ANIMATE)).toBeLessThanOrEqual(MAX_MOVE_MS);
  });

  it('is 0 (an immediate jump) when reduce motion is on, animation is off, or nothing moves', () => {
    expect(moveDurationMs({ from: 5, to: 20 }, { animate: true, reduceMotion: true })).toBe(0);
    expect(moveDurationMs({ from: 5, to: 20 }, { animate: false, reduceMotion: false })).toBe(0);
    expect(moveDurationMs({ from: 5, to: 5 }, ANIMATE)).toBe(0);
  });
});

describe('laneKeyframes', () => {
  const board = buildBoard({ width: 360, height: 780, playerCount: 3, config: STANDARD_CONFIG });

  it('covers the second start hole, the start hole and every score hole in order', () => {
    const { input, x, y } = laneKeyframes(board, 1);
    expect(input).toHaveLength(STANDARD_CONFIG.target + 2);
    expect(input[0]).toBe(BACK_START_POSITION);
    expect(input[1]).toBe(0);
    expect(input[input.length - 1]).toBe(STANDARD_CONFIG.target);
    expect(input.every((value, index) => index === 0 || value > input[index - 1])).toBe(true);
    expect({ x: x[0], y: y[0] }).toEqual(board.backStartPoints[1]);
    expect({ x: x[1], y: y[1] }).toEqual(board.lanes[1].holes[0]);
  });

  it('follows the same route as pegPathPoints for a move to the game hole', () => {
    const { x, y } = laneKeyframes(board, 2);
    const at = (position: number) => ({
      x: x[position - BACK_START_POSITION],
      y: y[position - BACK_START_POSITION],
    });
    const route = pegPathPoints(board, 2, 100, 121);
    route.forEach((point, offset) => expect(at(100 + offset)).toEqual(point));
    expect(at(121)).toEqual(pegPoint(board, 2, 121));
  });
});
