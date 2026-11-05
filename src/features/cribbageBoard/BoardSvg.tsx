import { memo, useMemo } from 'react';
import { View } from 'react-native';
import Svg, { G, Line, Path, Rect, Text as SvgText } from 'react-native-svg';

import { colors } from '@/theme';
import {
  holesPathData,
  polylinePathData,
  showSkunkLabels,
  skunkLines,
  SKUNK_LABEL_FONT_SIZE,
} from './boardLayout';
import type { BoardGeometry } from './geometry';
import { laneColor } from './laneColors';

const RIM_WIDTH = 2;

interface BoardSvgProps {
  board: BoardGeometry;
}

/**
 * The static part of the board: wood, lane grooves, holes, start/game holes and skunk lines.
 * Memoised on the geometry so peg and dealer updates never redraw it.
 */
export const BoardSvg = memo(function BoardSvg({ board }: BoardSvgProps) {
  const { width, height, holeRadius } = board;
  const target = board.lanes[0].holes.length - 1;
  const startRadius = Math.max(holeRadius * 1.7, 3.5);
  const gameRadius = Math.max(holeRadius * 2.3, 4.5);
  const grooveWidth = holeRadius * 2 + 3;

  const lanes = useMemo(
    () =>
      board.lanes.map((lane, index) => ({
        color: laneColor(index),
        groove: polylinePathData(lane.holes.slice(1)),
        holes: holesPathData(lane.holes.slice(1, target), holeRadius),
        start: lane.holes[0],
        backStart: board.backStartPoints[index],
        game: lane.holes[target],
      })),
    [board, holeRadius, target],
  );
  const lines = useMemo(() => skunkLines(board), [board]);
  const labels = showSkunkLabels(board);

  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={width} height={height}>
        <Rect
          x={RIM_WIDTH / 2}
          y={RIM_WIDTH / 2}
          width={width - RIM_WIDTH}
          height={height - RIM_WIDTH}
          rx={Math.min(width, height) / 2}
          fill={colors.boardWood}
          stroke={colors.boardRim}
          strokeWidth={RIM_WIDTH}
        />
        {lanes.map((lane, index) => (
          <G key={index}>
            <Path
              d={lane.groove}
              fill="none"
              stroke={lane.color}
              strokeOpacity={0.45}
              strokeWidth={grooveWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Path d={lane.holes} fill={colors.boardHole} />
            {[lane.start, lane.backStart].map((point, slot) => (
              <Path
                key={slot}
                d={holesPathData([point], startRadius)}
                fill={colors.boardHole}
                stroke={lane.color}
                strokeWidth={1.5}
              />
            ))}
            <Path
              d={holesPathData([lane.game], gameRadius)}
              fill={colors.boardHole}
              stroke={colors.gold}
              strokeWidth={2}
            />
          </G>
        ))}
        {lines.map((line) => (
          <G key={line.kind}>
            <Line
              x1={line.from.x}
              y1={line.from.y}
              x2={line.to.x}
              y2={line.to.y}
              stroke={colors.boardLine}
              strokeWidth={line.kind === 'doubleSkunk' ? 3 : 2}
              strokeLinecap="round"
            />
            {labels ? (
              <SvgText
                x={line.text.x}
                y={line.text.y}
                fill={colors.boardLine}
                fontSize={SKUNK_LABEL_FONT_SIZE}
                fontWeight="700"
                textAnchor={line.anchor}
              >
                {line.label}
              </SvgText>
            ) : null}
          </G>
        ))}
      </Svg>
    </View>
  );
});
