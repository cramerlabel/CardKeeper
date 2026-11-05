import type { CribbageConfig, PlayerCount } from '@/games/cribbage/engine';

export const LANE_COLOR_KEYS = ['red', 'blue', 'green'] as const;

export type LaneColorKey = (typeof LANE_COLOR_KEYS)[number];
export type BoardOrientation = 'horizontal' | 'vertical';

export interface Point {
  x: number;
  y: number;
}

export interface BoardLane {
  /** Index 0 is the start hole (just before hole 1); indices 1..target are score holes. */
  holes: Point[];
}

export interface SkunkMark {
  index: number;
  kind: 'skunk' | 'doubleSkunk';
  from: Point;
  to: Point;
}

export interface BoardGeometry {
  orientation: BoardOrientation;
  width: number;
  height: number;
  laneCount: PlayerCount;
  holeRadius: number;
  pegRadius: number;
  /** Radius of the innermost lane's end arcs; the free space inside the board shrinks with it. */
  innerRadius: number;
  lanes: BoardLane[];
  startPoints: Point[];
  /** Second start hole per lane, behind the first one, where the waiting back peg sits. */
  backStartPoints: Point[];
  /** Where to draw the dealer badge for each lane, in the gap between the game hole and the start. */
  dealerPoints: Point[];
  /** Center of the per-lane game holes; use lanes[*].holes[target] for each peg destination. */
  gameHole: Point;
  skunkMarks: SkunkMark[];
}

export interface BuildBoardOptions {
  width: number;
  height: number;
  playerCount: PlayerCount;
  config: CribbageConfig;
}

const MIN_PEG_RADIUS = 7;
const MAX_PEG_RADIUS = 10;
const TRACK_MARGIN_EXTRA = 2;
const MAX_LANE_SPACING = 30;
const MIN_INNER_RADIUS_EXTRA = 1;
const GROUP_GAP_UNITS = 0.45;
const START_OFFSET_RADII = 1.5;
const BACK_START_SPACING_RADII = 2.2;
const DEALER_BADGE_CLEARANCE = 1;
// Room between the game hole and hole 1: both start holes, the dealer badge and clearances.
const TAIL_GAP_RADII = 8;

/** Radius of the dealer badge relative to the peg radius. */
export const DEALER_BADGE_RADIUS_RATIO = 0.9;

function assertPositiveFinite(value: number, name: string): void {
  if (!Number.isFinite(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive finite number.`);
  }
}

function pointAtDistance(
  distance: number,
  longSize: number,
  shortSize: number,
  margin: number,
  outerRadius: number,
  radius: number,
): Point {
  const centerY = shortSize / 2;
  const leftCenterX = margin + outerRadius;
  const rightCenterX = longSize - margin - outerRadius;
  const straightLength = rightCenterX - leftCenterX;
  const arcLength = Math.PI * radius;
  const perimeter = 2 * straightLength + 2 * arcLength;
  const normalizedDistance = ((distance % perimeter) + perimeter) % perimeter;

  if (normalizedDistance <= straightLength) {
    return { x: leftCenterX + normalizedDistance, y: centerY - radius };
  }

  const afterTop = normalizedDistance - straightLength;
  if (afterTop <= arcLength) {
    const angle = -Math.PI / 2 + afterTop / radius;
    return {
      x: rightCenterX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    };
  }

  const afterRightArc = afterTop - arcLength;
  if (afterRightArc <= straightLength) {
    return { x: rightCenterX - afterRightArc, y: centerY + radius };
  }

  const afterBottom = afterRightArc - straightLength;
  const angle = Math.PI / 2 + afterBottom / radius;
  return {
    x: leftCenterX + radius * Math.cos(angle),
    y: centerY + radius * Math.sin(angle),
  };
}

/**
 * Maps a distance along the reference (outermost) lane to the matching position on a lane of
 * the given radius: straights are shared, arcs shrink with the radius. Holes placed through this
 * line up radially across lanes, so a skunk line crosses every lane at a right angle.
 */
function laneDistance(
  referenceDistance: number,
  straightLength: number,
  referenceRadius: number,
  radius: number,
): number {
  const scale = radius / referenceRadius;
  const referenceArc = Math.PI * referenceRadius;
  const perimeter = 2 * straightLength + 2 * referenceArc;
  const distance = ((referenceDistance % perimeter) + perimeter) % perimeter;

  if (distance <= straightLength) return distance;
  const afterTop = distance - straightLength;
  if (afterTop <= referenceArc) return straightLength + afterTop * scale;
  const afterRightArc = afterTop - referenceArc;
  if (afterRightArc <= straightLength) return straightLength + referenceArc * scale + afterRightArc;
  const afterBottom = afterRightArc - straightLength;
  return 2 * straightLength + referenceArc * scale + afterBottom * scale;
}

function orientPoint(point: Point, orientation: BoardOrientation): Point {
  return orientation === 'horizontal' ? point : { x: point.y, y: point.x };
}

function getLaneIndex(board: BoardGeometry, lane: number): BoardLane {
  if (!Number.isInteger(lane) || lane < 0 || lane >= board.lanes.length) {
    throw new RangeError('Lane index is outside the board.');
  }
  return board.lanes[lane];
}

function clampPosition(board: BoardGeometry, position: number): number {
  if (!Number.isFinite(position)) {
    throw new RangeError('Peg position must be a finite number.');
  }
  const target = board.lanes[0]?.holes.length - 1;
  if (target === undefined || target < 1) {
    throw new RangeError('Board has no score positions.');
  }
  return Math.min(target, Math.max(0, position));
}

export function buildBoard({
  width,
  height,
  playerCount,
  config,
}: BuildBoardOptions): BoardGeometry {
  assertPositiveFinite(width, 'Width');
  assertPositiveFinite(height, 'Height');
  if (!Number.isInteger(config.target) || config.target < 2) {
    throw new RangeError('Config target must be an integer of at least 2.');
  }

  const orientation: BoardOrientation = width >= height ? 'horizontal' : 'vertical';
  const longSize = Math.max(width, height);
  const shortSize = Math.min(width, height);
  const pegRadius = Math.max(MIN_PEG_RADIUS, Math.min(MAX_PEG_RADIUS, shortSize * 0.025));
  const margin = pegRadius + TRACK_MARGIN_EXTRA;
  const outerRadius = shortSize / 2 - margin;
  const minimumLaneSpacing = 2 * pegRadius + 2;
  const availableLaneSpacing =
    (outerRadius - pegRadius - MIN_INNER_RADIUS_EXTRA) / (playerCount - 1);
  if (availableLaneSpacing < minimumLaneSpacing) {
    throw new RangeError('Board is too small to fit the requested number of player lanes.');
  }
  const laneSpacing = Math.min(MAX_LANE_SPACING, availableLaneSpacing);
  const radii = Array.from(
    { length: playerCount },
    (_, lane) => outerRadius - (playerCount - 1 - lane) * laneSpacing,
  );
  const groupCount = Math.floor((config.target - 1) / 5);
  const totalUnits = config.target - 1 + groupCount * GROUP_GAP_UNITS;
  const startOffset = START_OFFSET_RADII * pegRadius;
  const backStartOffset = startOffset + BACK_START_SPACING_RADII * pegRadius;
  const dealerOffset =
    backStartOffset + (1 + DEALER_BADGE_RADIUS_RATIO) * pegRadius + DEALER_BADGE_CLEARANCE;
  const tailGap = TAIL_GAP_RADII * pegRadius;
  const straightLength = longSize - 2 * margin - 2 * outerRadius;
  if (straightLength <= 0) {
    throw new RangeError('Board is too small to fit the requested track.');
  }
  // Holes are spaced along the outermost lane and mapped onto the others (see laneDistance).
  // The tail gap lies in the left arc, where the innermost lane is shortest, so size it for that.
  const innerScale = radii[0] / outerRadius;
  const tailGapOnReference = tailGap / innerScale;
  if (tailGapOnReference > Math.PI * outerRadius) {
    throw new RangeError('Board is too small to fit the requested track.');
  }
  const referenceTrack = 2 * straightLength + 2 * Math.PI * outerRadius - tailGapOnReference;
  const localLanes: BoardLane[] = [];
  const localStartPoints: Point[] = [];
  const localBackStartPoints: Point[] = [];
  const localDealerPoints: Point[] = [];

  for (const radius of radii) {
    const at = (distance: number) =>
      pointAtDistance(distance, longSize, shortSize, margin, outerRadius, radius);
    // The loop is closed, so points behind hole 1 (negative distances) lie in the tail gap that
    // separates the game hole from the start holes.
    const startPoint = at(-startOffset);
    const holes = [startPoint];

    for (let index = 1; index <= config.target; index += 1) {
      const progressUnits = index - 1 + Math.floor((index - 1) / 5) * GROUP_GAP_UNITS;
      const referenceDistance = (progressUnits / totalUnits) * referenceTrack;
      holes.push(at(laneDistance(referenceDistance, straightLength, outerRadius, radius)));
    }

    localLanes.push({ holes });
    localStartPoints.push(startPoint);
    localBackStartPoints.push(at(-backStartOffset));
    localDealerPoints.push(at(-dealerOffset));
  }

  const lanes = localLanes.map((lane) => ({
    holes: lane.holes.map((point) => orientPoint(point, orientation)),
  }));
  const startPoints = localStartPoints.map((point) => orientPoint(point, orientation));
  const backStartPoints = localBackStartPoints.map((point) => orientPoint(point, orientation));
  const dealerPoints = localDealerPoints.map((point) => orientPoint(point, orientation));
  const gameHolePoints = lanes.map((lane) => lane.holes[config.target]);
  const gameHole = {
    x: gameHolePoints.reduce((total, point) => total + point.x, 0) / gameHolePoints.length,
    y: gameHolePoints.reduce((total, point) => total + point.y, 0) / gameHolePoints.length,
  };
  const markIndexes: { index: number; kind: SkunkMark['kind'] }[] = [];
  if (
    Number.isInteger(config.skunkLine) &&
    config.skunkLine > 0 &&
    config.skunkLine < config.target
  ) {
    markIndexes.push({ index: config.skunkLine, kind: 'skunk' });
  }
  if (
    config.doubleSkunkLine !== null &&
    Number.isInteger(config.doubleSkunkLine) &&
    config.doubleSkunkLine > 0 &&
    config.doubleSkunkLine < config.target
  ) {
    markIndexes.push({ index: config.doubleSkunkLine, kind: 'doubleSkunk' });
  }
  const skunkMarks = markIndexes
    .sort((a, b) => a.index - b.index)
    .map(({ index, kind }) => ({
      index,
      kind,
      from: lanes[0].holes[index],
      to: lanes[lanes.length - 1].holes[index],
    }));

  const holeRadius = Math.max(
    1,
    Math.min(
      4,
      // Arcs of the innermost lane are the tightest, so they set the smallest hole spacing.
      (referenceTrack / totalUnits) * innerScale * 0.28,
      laneSpacing * 0.2,
    ),
  );

  return {
    orientation,
    width,
    height,
    laneCount: playerCount,
    holeRadius,
    pegRadius,
    innerRadius: radii[0],
    lanes,
    startPoints,
    backStartPoints,
    dealerPoints,
    gameHole,
    skunkMarks,
  };
}

export function pegPoint(board: BoardGeometry, lane: number, position: number): Point {
  const laneGeometry = getLaneIndex(board, lane);
  const clampedPosition = clampPosition(board, position);
  const lowerIndex = Math.floor(clampedPosition);
  const upperIndex = Math.min(laneGeometry.holes.length - 1, lowerIndex + 1);
  const fraction = clampedPosition - lowerIndex;
  const lowerPoint = laneGeometry.holes[lowerIndex];
  const upperPoint = laneGeometry.holes[upperIndex];

  return {
    x: lowerPoint.x + (upperPoint.x - lowerPoint.x) * fraction,
    y: lowerPoint.y + (upperPoint.y - lowerPoint.y) * fraction,
  };
}

export function pegPathPoints(
  board: BoardGeometry,
  lane: number,
  from: number,
  to: number,
): Point[] {
  const start = clampPosition(board, from);
  const end = clampPosition(board, to);
  const points = [pegPoint(board, lane, start)];
  if (start === end) return points;

  const direction = Math.sign(end - start);
  let nextPosition = direction > 0 ? Math.floor(start) + 1 : Math.ceil(start) - 1;
  while (direction > 0 ? nextPosition < end : nextPosition > end) {
    points.push(pegPoint(board, lane, nextPosition));
    nextPosition += direction;
  }
  points.push(pegPoint(board, lane, end));
  return points;
}
