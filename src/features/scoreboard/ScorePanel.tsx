import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { Card } from '@/components/Card';
import { colors, radius, spacing, typography } from '@/theme';

import { progressFraction } from './history';
import { useTextScale } from './useTextScale';

interface ScorePanelProps {
  name: string;
  total: number;
  handsWon: number;
  target: number;
  leading: boolean;
  /** Shorter panel for short (landscape phone) windows. */
  dense?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ScorePanel({
  name,
  total,
  handsWon,
  target,
  leading,
  dense,
  style,
}: ScorePanelProps) {
  const scale = useTextScale();
  const scoreSize = dense ? 30 : scale(typography.display.fontSize);
  const scoreLine = dense ? 34 : scale(typography.display.lineHeight);
  const percent = Math.round(progressFraction(total, target) * 100);

  const [pulse] = useState(() => new Animated.Value(1));
  const [progress] = useState(() => new Animated.Value(percent));
  const previousTotal = useRef(total);

  // Pulse the score when it changes (not on first render) and glide the progress bar to its new fill.
  useEffect(() => {
    if (previousTotal.current !== total) {
      previousTotal.current = total;
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 140, useNativeDriver: true }),
        Animated.spring(pulse, { toValue: 1, friction: 4, useNativeDriver: true }),
      ]).start();
    }
    Animated.timing(progress, { toValue: percent, duration: 400, useNativeDriver: false }).start();
  }, [total, percent, pulse, progress]);

  return (
    <Card
      style={[styles.panel, dense && styles.dense, leading && styles.leading, style]}
      accessible
      accessibilityLabel={`${name}: ${total} points, ${handsWon} ${handsWon === 1 ? 'hand' : 'hands'} won${
        leading ? ', leading' : ''
      }`}
    >
      <View style={styles.nameRow}>
        <Text
          numberOfLines={1}
          style={[styles.name, { fontSize: scale(typography.bodyStrong.fontSize) }]}
        >
          {name}
        </Text>
        {leading ? (
          <View style={styles.badge} importantForAccessibility="no-hide-descendants">
            <MaterialCommunityIcons name="crown" size={scale(14)} color={colors.textOnAccent} />
          </View>
        ) : null}
      </View>
      <Animated.Text
        style={[
          styles.score,
          { fontSize: scoreSize, lineHeight: scoreLine, transform: [{ scale: pulse }] },
          leading && styles.scoreLeading,
        ]}
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {total}
      </Animated.Text>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityLabel={`Progress toward ${target}`}
        accessibilityValue={{ min: 0, max: 100, now: percent }}
      >
        <Animated.View
          style={[
            styles.fill,
            leading && styles.fillLeading,
            { width: progress.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) },
          ]}
        />
      </View>
      <Text style={[styles.meta, { fontSize: scale(typography.caption.fontSize) }]}>
        {handsWon} {handsWon === 1 ? 'hand' : 'hands'} won · to {target}
      </Text>
    </Card>
  );
}

const styles = StyleSheet.create({
  panel: {
    gap: spacing.xs,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dense: { padding: spacing.sm, gap: 2 },
  leading: {
    borderColor: colors.gold,
    backgroundColor: colors.surfaceRaised,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    flexShrink: 1,
    fontWeight: typography.bodyStrong.fontWeight,
    color: colors.textPrimary,
  },
  badge: {
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    padding: spacing.xs,
  },
  score: {
    color: colors.textPrimary,
    fontWeight: typography.display.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  scoreLeading: { color: colors.gold },
  track: {
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.feltDark,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: radius.pill,
    backgroundColor: colors.textSecondary,
  },
  fillLeading: { backgroundColor: colors.gold },
  meta: {
    color: colors.textSecondary,
    fontWeight: typography.caption.fontWeight,
  },
});
