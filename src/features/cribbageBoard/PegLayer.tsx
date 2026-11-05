import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';

import type { PegPosition, PlayerIndex } from '@/games/cribbage/engine';
import { colors } from '@/theme';
import { DEALER_BADGE_RADIUS_RATIO, type BoardGeometry } from './geometry';
import { laneColor } from './laneColors';
import {
  initialPegSlots,
  laneKeyframes,
  moveDurationMs,
  planPegMoves,
  type PegPlan,
  type PegSlot,
} from './pegMotion';

const LIFT_SCALE = 1.45;

interface SlotMotion {
  /** Track position of the peg; interpolated into screen coordinates on the native thread. */
  position: Animated.Value;
  /** 0..1 pulse that enlarges a peg while it travels so the jumping peg is easy to follow. */
  lift: Animated.Value;
}

interface PegLayerProps {
  board: BoardGeometry;
  pegs: PegPosition[];
  dealer?: PlayerIndex;
  animate: boolean;
  reduceMotion: boolean;
}

/** Pegs and dealer badge, drawn over the static board and kept out of the accessibility tree. */
export function PegLayer({ board, pegs, dealer, animate, reduceMotion }: PegLayerProps) {
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {dealer !== undefined && dealer < board.laneCount ? (
        <DealerBadge board={board} lane={dealer} />
      ) : null}
      {pegs.slice(0, board.laneCount).map((peg, lane) => (
        <PlayerPegs
          key={lane}
          board={board}
          lane={lane}
          peg={peg}
          animate={animate}
          reduceMotion={reduceMotion}
        />
      ))}
    </View>
  );
}

function DealerBadge({ board, lane }: { board: BoardGeometry; lane: number }) {
  const radius = board.pegRadius * DEALER_BADGE_RADIUS_RATIO;
  const point = board.dealerPoints[lane];
  return (
    <View
      style={[
        styles.badge,
        {
          width: radius * 2,
          height: radius * 2,
          borderRadius: radius,
          left: point.x - radius,
          top: point.y - radius,
        },
      ]}
    >
      <Text allowFontScaling={false} style={[styles.badgeText, { fontSize: radius * 1.25 }]}>
        D
      </Text>
    </View>
  );
}

interface PlayerPegsProps {
  board: BoardGeometry;
  lane: number;
  peg: PegPosition;
  animate: boolean;
  reduceMotion: boolean;
}

function PlayerPegs({ board, lane, peg, animate, reduceMotion }: PlayerPegsProps) {
  // The first render places the pegs directly (no moves), so nothing animates from the start.
  const [plan, setPlan] = useState<PegPlan>(() => ({ slots: initialPegSlots(peg), moves: [] }));
  const next = planPegMoves(plan.slots, peg);
  if (next.slots !== plan.slots) setPlan(next);

  const [motion] = useState<[SlotMotion, SlotMotion]>(() => [
    { position: new Animated.Value(plan.slots.positions[0]), lift: new Animated.Value(0) },
    { position: new Animated.Value(plan.slots.positions[1]), lift: new Animated.Value(0) },
  ]);

  const transforms = useMemo(() => {
    const { input, x, y } = laneKeyframes(board, lane);
    const offset = board.pegRadius;
    return motion.map(({ position, lift }) => ({
      translateX: position.interpolate({
        inputRange: input,
        outputRange: x.map((value) => value - offset),
        extrapolate: 'clamp',
      }),
      translateY: position.interpolate({
        inputRange: input,
        outputRange: y.map((value) => value - offset),
        extrapolate: 'clamp',
      }),
      scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, LIFT_SCALE] }),
    }));
  }, [board, lane, motion]);

  const applied = useRef(plan);
  useEffect(() => {
    if (applied.current === plan) return;
    applied.current = plan;
    for (const move of plan.moves) {
      const { position, lift } = motion[move.slot];
      const duration = moveDurationMs(move, { animate, reduceMotion });
      position.stopAnimation();
      lift.stopAnimation();
      if (duration === 0) {
        position.setValue(move.to);
        lift.setValue(0);
        continue;
      }
      Animated.parallel([
        Animated.timing(position, {
          toValue: move.to,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(lift, {
            toValue: 1,
            duration: duration * 0.4,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(lift, {
            toValue: 0,
            duration: duration * 0.6,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    }
  }, [plan, animate, reduceMotion, motion]);

  useEffect(
    () => () => {
      motion.forEach(({ position, lift }) => {
        position.stopAnimation();
        lift.stopAnimation();
      });
    },
    [motion],
  );

  const color = laneColor(lane);
  const diameter = board.pegRadius * 2;
  return (
    <>
      {([0, 1] as PegSlot[]).map((slot) => {
        const isFront = plan.slots.front === slot;
        const { translateX, translateY, scale } = transforms[slot];
        return (
          <Animated.View
            key={slot}
            testID={`peg-${lane}-${isFront ? 'front' : 'back'}`}
            style={[
              styles.peg,
              { width: diameter, height: diameter, borderRadius: board.pegRadius },
              isFront
                ? [styles.frontPeg, { backgroundColor: color }]
                : [styles.backPeg, { borderColor: color }],
              { transform: [{ translateX }, { translateY }, { scale }] },
            ]}
          />
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  peg: {
    position: 'absolute',
    left: 0,
    top: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.45,
    shadowRadius: 1.5,
  },
  // Front peg: solid lane colour with a light ring. Back peg: a dark, hollow ring in the lane colour.
  frontPeg: {
    zIndex: 2,
    elevation: 4,
    borderWidth: 2,
    borderColor: colors.cream,
  },
  backPeg: {
    zIndex: 1,
    elevation: 2,
    borderWidth: 3,
    backgroundColor: colors.boardHole,
  },
  badge: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gold,
  },
  badgeText: {
    color: colors.textOnAccent,
    fontWeight: '800',
    includeFontPadding: false,
  },
});
