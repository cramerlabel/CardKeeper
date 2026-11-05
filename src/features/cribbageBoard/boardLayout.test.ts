import { SHORT_CONFIG, STANDARD_CONFIG } from '@/games/cribbage/engine';
import {
  describeBoard,
  holesPathData,
  polylinePathData,
  showSkunkLabels,
  skunkLines,
  SKUNK_LABEL_FONT_SIZE,
} from './boardLayout';
import { buildBoard, type Point } from './geometry';

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

describe('holesPathData', () => {
  it('draws one closed circle sub-path per hole', () => {
    const d = holesPathData(
      [
        { x: 10, y: 20 },
        { x: 30, y: 20 },
      ],
      2,
    );
    expect(d.match(/M/g)).toHaveLength(2);
    expect(d.startsWith('M8 20a2 2 0 1 0 4 0a2 2 0 1 0 -4 0')).toBe(true);
  });

  it('is empty for no holes', () => {
    expect(holesPathData([], 2)).toBe('');
  });
});

describe('polylinePathData', () => {
  it('starts with a move and connects the rest with lines', () => {
    expect(
      polylinePathData([
        { x: 1.234, y: 2 },
        { x: 3, y: 4.5 },
        { x: 5, y: 6 },
      ]),
    ).toBe('M1.23 2L3 4.5L5 6');
  });
});

describe('skunkLines', () => {
  it.each([
    [360, 780],
    [780, 360],
  ])('puts each line between the holes before and at the mark (%ix%i)', (width, height) => {
    const board = buildBoard({ width, height, playerCount: 3, config: STANDARD_CONFIG });
    const lines = skunkLines(board);
    expect(lines.map(({ kind, index }) => [kind, index])).toEqual([
      ['doubleSkunk', 61],
      ['skunk', 91],
    ]);
    for (const line of lines) {
      const before = board.lanes[1].holes[line.index - 1];
      const at = board.lanes[1].holes[line.index];
      const centre = { x: (line.from.x + line.to.x) / 2, y: (line.from.y + line.to.y) / 2 };
      // The line crosses the middle lane in the gap between the two holes.
      expect(distance(centre, before) + distance(centre, at)).toBeLessThan(
        distance(before, at) + board.pegRadius,
      );
      // It spans every lane.
      expect(distance(line.from, line.to)).toBeGreaterThan(
        distance(board.lanes[0].holes[line.index], board.lanes[2].holes[line.index]),
      );
    }
  });

  it('labels the lines and keeps them inside the board', () => {
    const board = buildBoard({ width: 360, height: 780, playerCount: 2, config: STANDARD_CONFIG });
    const lines = skunkLines(board);
    expect(lines.map((line) => line.label)).toEqual(['Double skunk 61', 'Skunk 91']);
    for (const line of lines) {
      for (const point of [line.from, line.to]) {
        expect(point.x).toBeGreaterThanOrEqual(0);
        expect(point.x).toBeLessThanOrEqual(board.width);
        expect(point.y).toBeGreaterThanOrEqual(0);
        expect(point.y).toBeLessThanOrEqual(board.height);
      }
      expect(['start', 'middle', 'end']).toContain(line.anchor);
    }
  });

  it('draws only the skunk line for the short game', () => {
    const board = buildBoard({ width: 360, height: 780, playerCount: 2, config: SHORT_CONFIG });
    expect(skunkLines(board).map((line) => line.label)).toEqual(['Skunk 31']);
  });

  it('places the label on the inner side of the innermost lane', () => {
    const board = buildBoard({ width: 360, height: 780, playerCount: 3, config: STANDARD_CONFIG });
    for (const line of skunkLines(board)) {
      const baseline = { x: line.text.x, y: line.text.y - SKUNK_LABEL_FONT_SIZE * 0.35 };
      expect(distance(baseline, line.to)).toBeGreaterThan(distance(line.from, line.to));
    }
  });

  it('crosses every lane at a right angle', () => {
    const board = buildBoard({ width: 360, height: 780, playerCount: 3, config: STANDARD_CONFIG });
    for (const line of skunkLines(board)) {
      const hole = board.lanes[1].holes[line.index];
      const previous = board.lanes[1].holes[line.index - 1];
      const along = { x: hole.x - previous.x, y: hole.y - previous.y };
      const across = { x: line.to.x - line.from.x, y: line.to.y - line.from.y };
      const cosine =
        (along.x * across.x + along.y * across.y) /
        (Math.hypot(along.x, along.y) * Math.hypot(across.x, across.y));
      expect(Math.abs(cosine)).toBeLessThan(0.1);
    }
  });
});

describe('showSkunkLabels', () => {
  it('shows labels on normal boards and hides them when the middle is too small', () => {
    const roomy = buildBoard({ width: 360, height: 780, playerCount: 3, config: STANDARD_CONFIG });
    const cramped = buildBoard({
      width: 300,
      height: 180,
      playerCount: 3,
      config: STANDARD_CONFIG,
    });
    expect(showSkunkLabels(roomy)).toBe(true);
    expect(showSkunkLabels(cramped)).toBe(false);
  });
});

describe('describeBoard', () => {
  const pegs = [
    { front: 87, back: 80 },
    { front: 79, back: 70 },
  ];

  it('lists scores and the dealer', () => {
    expect(describeBoard({ playerNames: ['Alice', 'Bob'], pegs, dealer: 0 })).toBe(
      'Cribbage board. Alice 87, Bob 79. Alice is dealing.',
    );
  });

  it('omits the dealer when unknown or out of range', () => {
    expect(describeBoard({ playerNames: ['Alice', 'Bob'], pegs })).toBe(
      'Cribbage board. Alice 87, Bob 79.',
    );
    expect(describeBoard({ playerNames: ['Alice', 'Bob'], pegs, dealer: 2 })).toBe(
      'Cribbage board. Alice 87, Bob 79.',
    );
  });

  it('falls back to generic names and supports three players', () => {
    expect(
      describeBoard({
        playerNames: ['Alice', '  '],
        pegs: [...pegs, { front: 0, back: 0 }],
        dealer: 2,
      }),
    ).toBe('Cribbage board. Alice 87, Player 2 79, Player 3 0. Player 3 is dealing.');
  });
});
