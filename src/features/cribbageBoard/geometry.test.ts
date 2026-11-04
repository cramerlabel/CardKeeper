import { SHORT_CONFIG, STANDARD_CONFIG } from '@/games/cribbage/engine';
import { buildBoard, LANE_COLOR_KEYS, pegPathPoints, pegPoint } from './geometry';
import type { BoardGeometry, Point } from './geometry';

const SIZE_CASES = [
  [320, 480],
  [360, 780],
  [800, 1280],
  [480, 320],
  [780, 360],
  [1280, 800],
] as const;

function distance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function expectPointInBounds(point: Point, board: BoardGeometry): void {
  expect(point.x).toBeGreaterThanOrEqual(0);
  expect(point.x).toBeLessThanOrEqual(board.width);
  expect(point.y).toBeGreaterThanOrEqual(0);
  expect(point.y).toBeLessThanOrEqual(board.height);
}

describe('buildBoard', () => {
  it('exposes lane colors in player order', () => {
    expect(LANE_COLOR_KEYS).toEqual(['red', 'blue', 'green']);
  });

  it.each([STANDARD_CONFIG, SHORT_CONFIG])('creates target + 1 positions per lane', (config) => {
    for (const playerCount of [2, 3] as const) {
      const board = buildBoard({ width: 360, height: 780, playerCount, config });
      expect(board.lanes).toHaveLength(playerCount);
      expect(board.lanes.every((lane) => lane.holes.length === config.target + 1)).toBe(true);
      expect(board.startPoints).toHaveLength(playerCount);
      expect(board.lanes.map((lane) => lane.holes[0])).toEqual(board.startPoints);
    }
  });

  it.each([2, 3] as const)(
    'keeps lane paths separated and all geometry in bounds for playerCount=%i',
    (playerCount) => {
      for (const [width, height] of SIZE_CASES) {
        const board = buildBoard({
          width,
          height,
          playerCount,
          config: STANDARD_CONFIG,
        });
        const allPoints = [
          ...board.startPoints,
          ...board.lanes.flatMap((lane) => lane.holes.slice(1)),
          board.gameHole,
          ...board.skunkMarks.flatMap((mark) => [mark.from, mark.to]),
        ];
        allPoints.forEach((point) => expectPointInBounds(point, board));

        for (let firstLane = 0; firstLane < playerCount; firstLane += 1) {
          for (let secondLane = firstLane + 1; secondLane < playerCount; secondLane += 1) {
            for (const firstHole of board.lanes[firstLane].holes.slice(1)) {
              for (const secondHole of board.lanes[secondLane].holes.slice(1)) {
                expect(distance(firstHole, secondHole)).toBeGreaterThan(board.holeRadius * 2);
              }
            }
          }
        }
      }
    },
  );

  it('places score holes on stadium paths', () => {
    const board = buildBoard({
      width: 800,
      height: 1280,
      playerCount: 3,
      config: STANDARD_CONFIG,
    });
    const orientation = board.orientation;
    const longSize = Math.max(board.width, board.height);
    const shortSize = Math.min(board.width, board.height);
    const margin = board.pegRadius + 2;
    const outerRadius = shortSize / 2 - margin;
    const laneSpacing = Math.min(30, (outerRadius - board.pegRadius - 1) / (board.laneCount - 1));

    board.lanes.forEach((lane, laneIndex) => {
      const radius = outerRadius - (board.laneCount - 1 - laneIndex) * laneSpacing;
      const leftCenterX = margin + outerRadius;
      const rightCenterX = longSize - margin - outerRadius;
      for (const point of lane.holes.slice(1)) {
        const localPoint = orientation === 'horizontal' ? point : { x: point.y, y: point.x };
        const nearestX = Math.max(leftCenterX, Math.min(rightCenterX, localPoint.x));
        expect(
          Math.abs(Math.hypot(localPoint.x - nearestX, localPoint.y - shortSize / 2) - radius),
        ).toBeLessThan(1e-6);
      }
    });
  });

  it('makes every fifth-hole group gap wider than a regular gap', () => {
    const board = buildBoard({
      width: 800,
      height: 1280,
      playerCount: 2,
      config: STANDARD_CONFIG,
    });
    const holes = board.lanes[0].holes;
    expect(distance(holes[5], holes[6])).toBeGreaterThan(distance(holes[4], holes[5]) * 1.3);
    expect(distance(holes[10], holes[11])).toBeGreaterThan(distance(holes[9], holes[10]) * 1.3);
  });

  it('marks standard and short-game skunk lines between lane holes', () => {
    const standard = buildBoard({
      width: 360,
      height: 780,
      playerCount: 3,
      config: STANDARD_CONFIG,
    });
    expect(standard.skunkMarks.map(({ index, kind }) => [index, kind])).toEqual([
      [61, 'doubleSkunk'],
      [91, 'skunk'],
    ]);
    expect(standard.skunkMarks[0].from).toEqual(standard.lanes[0].holes[61]);
    expect(standard.skunkMarks[0].to).toEqual(standard.lanes[2].holes[61]);

    const short = buildBoard({
      width: 360,
      height: 780,
      playerCount: 2,
      config: SHORT_CONFIG,
    });
    expect(short.skunkMarks).toHaveLength(1);
    expect(short.skunkMarks[0].index).toBe(31);
    expect(short.skunkMarks[0].kind).toBe('skunk');
    expect(short.skunkMarks[0].from).toEqual(short.lanes[0].holes[31]);
    expect(short.skunkMarks[0].to).toEqual(short.lanes[1].holes[31]);
  });

  it('swaps orientation and coordinates between portrait and landscape', () => {
    const portrait = buildBoard({
      width: 360,
      height: 780,
      playerCount: 2,
      config: STANDARD_CONFIG,
    });
    const landscape = buildBoard({
      width: 780,
      height: 360,
      playerCount: 2,
      config: STANDARD_CONFIG,
    });
    expect(portrait.orientation).toBe('vertical');
    expect(landscape.orientation).toBe('horizontal');
    expect(portrait.lanes[0].holes[45].x).toBeCloseTo(landscape.lanes[0].holes[45].y);
    expect(portrait.lanes[0].holes[45].y).toBeCloseTo(landscape.lanes[0].holes[45].x);
  });

  it('uses the same track footprint for a short game with fewer, more widely spaced holes', () => {
    const standard = buildBoard({
      width: 360,
      height: 780,
      playerCount: 2,
      config: STANDARD_CONFIG,
    });
    const short = buildBoard({
      width: 360,
      height: 780,
      playerCount: 2,
      config: SHORT_CONFIG,
    });
    expect(short.lanes[0].holes).toHaveLength(62);
    expect(distance(short.lanes[0].holes[1], short.lanes[0].holes[2])).toBeGreaterThan(
      distance(standard.lanes[0].holes[1], standard.lanes[0].holes[2]),
    );
    expect(short.holeRadius).toBeGreaterThan(standard.holeRadius);
  });

  it('rejects dimensions that cannot fit a board', () => {
    expect(() =>
      buildBoard({ width: 0, height: 480, playerCount: 2, config: STANDARD_CONFIG }),
    ).toThrow(RangeError);
    expect(() =>
      buildBoard({ width: 60, height: 60, playerCount: 3, config: STANDARD_CONFIG }),
    ).toThrow(RangeError);
  });
});

describe('pegPoint', () => {
  const board = buildBoard({
    width: 360,
    height: 780,
    playerCount: 2,
    config: STANDARD_CONFIG,
  });

  it('clamps positions to start and game-hole positions', () => {
    expect(pegPoint(board, 0, -20)).toEqual(board.startPoints[0]);
    expect(pegPoint(board, 0, 500)).toEqual(board.lanes[0].holes[STANDARD_CONFIG.target]);
  });

  it('interpolates fractional positions between adjacent holes', () => {
    const first = board.lanes[0].holes[12];
    const second = board.lanes[0].holes[13];
    expect(pegPoint(board, 0, 12.5)).toEqual({
      x: (first.x + second.x) / 2,
      y: (first.y + second.y) / 2,
    });
  });

  it('rejects invalid lanes and non-finite positions', () => {
    expect(() => pegPoint(board, 2, 0)).toThrow(RangeError);
    expect(() => pegPoint(board, 0, Number.NaN)).toThrow(RangeError);
  });
});

describe('pegPathPoints', () => {
  const board = buildBoard({
    width: 360,
    height: 780,
    playerCount: 2,
    config: STANDARD_CONFIG,
  });

  it('includes the sampled holes for a forward move around the track', () => {
    expect(pegPathPoints(board, 0, 118, 122)).toEqual(board.lanes[0].holes.slice(118, 123));
  });

  it('preserves increasing score order across the full track', () => {
    expect(pegPathPoints(board, 0, 1, STANDARD_CONFIG.target)).toEqual(
      board.lanes[0].holes.slice(1),
    );
  });

  it('returns one point for a zero-length move', () => {
    expect(pegPathPoints(board, 0, 24, 24)).toEqual([board.lanes[0].holes[24]]);
  });

  it('supports backward and fractional moves', () => {
    expect(pegPathPoints(board, 0, 8, 5)).toEqual(board.lanes[0].holes.slice(5, 9).reverse());
    expect(pegPathPoints(board, 0, 4.5, 6.5)).toEqual([
      pegPoint(board, 0, 4.5),
      board.lanes[0].holes[5],
      board.lanes[0].holes[6],
      pegPoint(board, 0, 6.5),
    ]);
  });
});
