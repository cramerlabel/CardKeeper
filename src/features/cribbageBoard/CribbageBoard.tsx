import { useCallback, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type {
  CribbageConfig,
  PegPosition,
  PlayerCount,
  PlayerIndex,
} from '@/games/cribbage/engine';
import { BoardSvg } from './BoardSvg';
import { describeBoard } from './boardLayout';
import { buildBoard, type BoardGeometry } from './geometry';
import { PegLayer } from './PegLayer';
import { useReduceMotion } from './useReduceMotion';

export interface CribbageBoardProps {
  /** One entry per player, from `selectPegs`: `front` is the player's total. */
  pegs: PegPosition[];
  playerNames: string[];
  config: CribbageConfig;
  dealer?: PlayerIndex;
  style?: StyleProp<ViewStyle>;
  /** Set to false to jump pegs instead of animating (e.g. a static final position). Default true. */
  animate?: boolean;
}

interface Size {
  width: number;
  height: number;
}

function tryBuildBoard(
  size: Size,
  playerCount: PlayerCount,
  config: CribbageConfig,
): BoardGeometry | null {
  if (size.width <= 0 || size.height <= 0) return null;
  try {
    return buildBoard({ ...size, playerCount, config });
  } catch (error) {
    // Too small to draw: show nothing rather than crash the screen.
    if (error instanceof RangeError) return null;
    throw error;
  }
}

/**
 * Racetrack cribbage board that fills its container (portrait => vertical, landscape =>
 * horizontal). Static drawing is memoised; pegs animate natively along the track.
 *
 * Key it by game id so a new game does not animate pegs back from the previous one.
 */
export function CribbageBoard({
  pegs,
  playerNames,
  config,
  dealer,
  style,
  animate = true,
}: CribbageBoardProps) {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const reduceMotion = useReduceMotion();

  const onLayout = useCallback((event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const next = { width: Math.floor(width), height: Math.floor(height) };
    setSize((current) =>
      current.width === next.width && current.height === next.height ? current : next,
    );
  }, []);

  const playerCount = pegs.length;
  const { target, skunkLine, doubleSkunkLine } = config;
  const board = useMemo(
    () =>
      playerCount === 2 || playerCount === 3
        ? tryBuildBoard(size, playerCount, { target, skunkLine, doubleSkunkLine })
        : null,
    [size, playerCount, target, skunkLine, doubleSkunkLine],
  );

  return (
    <View
      style={[styles.container, style]}
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={describeBoard({ playerNames, pegs, dealer })}
    >
      {board ? (
        <View
          style={{ width: board.width, height: board.height }}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <BoardSvg board={board} />
          <PegLayer
            board={board}
            pegs={pegs}
            dealer={dealer}
            animate={animate}
            reduceMotion={reduceMotion}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
