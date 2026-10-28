import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

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
  const scoreSize = dense ? 36 : scale(typography.display.fontSize);
  const scoreLine = dense ? 42 : scale(typography.display.lineHeight);
  const percent = Math.round(progressFraction(total, target) * 100);

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
        {leading ? <Text style={styles.badge}>LEADING</Text> : null}
      </View>
      <Text
        style={[
          styles.score,
          { fontSize: scoreSize, lineHeight: scoreLine },
          leading && styles.scoreLeading,
        ]}
        adjustsFontSizeToFit
        numberOfLines={1}
      >
        {total}
      </Text>
      <View
        style={styles.track}
        accessibilityRole="progressbar"
        accessibilityLabel={`Progress toward ${target}`}
        accessibilityValue={{ min: 0, max: 100, now: percent }}
      >
        <View style={[styles.fill, leading && styles.fillLeading, { width: `${percent}%` }]} />
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
    ...typography.label,
    fontSize: 10,
    color: colors.textOnAccent,
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    overflow: 'hidden',
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
