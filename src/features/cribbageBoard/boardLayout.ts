import type { PegPosition, PlayerIndex } from '@/games/cribbage/engine';
import type { BoardGeometry, Point, SkunkMark } from './geometry';

export const SKUNK_LABEL_FONT_SIZE = 10;
/** Below this inner-lane radius the middle of the board is too small for the skunk labels. */
const MIN_LABEL_INNER_RADIUS = 28;

export function showSkunkLabels(board: BoardGeometry): boolean {
  return board.innerRadius >= MIN_LABEL_INNER_RADIUS;
}

export type LabelAnchor = 'start' | 'middle' | 'end';

export interface SkunkLine {
  kind: SkunkMark['kind'];
  index: number;
  /** Inner end of the line (on the side of the innermost lane). */
  from: Point;
  /** Outer end of the line. */
  to: Point;
  label: string;
  /** Position of the label text baseline anchor, just inside the innermost lane. */
  text: Point;
  anchor: LabelAnchor;
}

const round = (value: number): number => Math.round(value * 100) / 100;

/** One path of tiny filled circles; far cheaper than a native view per hole. */
export function holesPathData(points: Point[], radius: number): string {
  const r = round(radius);
  return points
    .map(
      ({ x, y }) =>
        `M${round(x - radius)} ${round(y)}a${r} ${r} 0 1 0 ${round(2 * radius)} 0a${r} ${r} 0 1 0 ${round(-2 * radius)} 0`,
    )
    .join('');
}

export function polylinePathData(points: Point[]): string {
  return points
    .map(({ x, y }, index) => `${index === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`)
    .join('');
}

const midpoint = (a: Point, b: Point): Point => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });

/**
 * Skunk and double-skunk lines. A line sits between hole index - 1 and hole index (a player
 * must reach the line's hole to be safe), spans all lanes and overshoots them slightly.
 */
export function skunkLines(board: BoardGeometry): SkunkLine[] {
  const innermost = board.lanes[0].holes;
  const outermost = board.lanes[board.lanes.length - 1].holes;
  // The inner end must clear the innermost lane's groove and pegs so the label is not on them.
  const innerOvershoot = board.pegRadius * 1.1;
  const outerOvershoot = board.pegRadius * 0.6;
  const labelGap = 3;

  return board.skunkMarks.map(({ index, kind }) => {
    const inner = midpoint(innermost[index - 1], innermost[index]);
    const outer = midpoint(outermost[index - 1], outermost[index]);
    const length = Math.hypot(outer.x - inner.x, outer.y - inner.y) || 1;
    // Unit vector pointing from the innermost lane towards the outermost one.
    const ux = (outer.x - inner.x) / length;
    const uy = (outer.y - inner.y) / length;
    const from = { x: inner.x - ux * innerOvershoot, y: inner.y - uy * innerOvershoot };
    const to = { x: outer.x + ux * outerOvershoot, y: outer.y + uy * outerOvershoot };
    // The label continues the line towards the middle of the board.
    const ax = from.x - ux * labelGap;
    const ay = from.y - uy * labelGap;
    const inwardX = -ux;
    const inwardY = -uy;
    const anchor: LabelAnchor = inwardX > 0.5 ? 'start' : inwardX < -0.5 ? 'end' : 'middle';
    const textY =
      inwardY > 0.5
        ? ay + SKUNK_LABEL_FONT_SIZE
        : inwardY < -0.5
          ? ay - 2
          : ay + SKUNK_LABEL_FONT_SIZE * 0.35;
    return {
      kind,
      index,
      from,
      to,
      label: `${kind === 'doubleSkunk' ? 'Double skunk' : 'Skunk'} ${index}`,
      text: { x: ax, y: textY },
      anchor,
    };
  });
}

export interface BoardDescriptionInput {
  playerNames: string[];
  pegs: PegPosition[];
  dealer?: PlayerIndex;
}

/** Screen-reader summary, e.g. "Cribbage board. Alice 87, Bob 79. Alice is dealing." */
export function describeBoard({ playerNames, pegs, dealer }: BoardDescriptionInput): string {
  const name = (player: number): string => playerNames[player]?.trim() || `Player ${player + 1}`;
  const scores = pegs.map((peg, player) => `${name(player)} ${peg.front}`).join(', ');
  const parts = ['Cribbage board.'];
  if (scores) parts.push(`${scores}.`);
  if (dealer !== undefined && dealer < pegs.length) parts.push(`${name(dealer)} is dealing.`);
  return parts.join(' ');
}
