import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { useTextScale } from '@/features/scoreboard/useTextScale';
import { colors, radius, shadows, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';

interface CribbagePlayerPanelProps {
  name: string;
  total: number;
  /** Lane/peg colour of the player (`laneColor(index)`). */
  color: string;
  dealer: boolean;
  leading: boolean;
  /** Shorter panel for short (landscape phone) windows. */
  dense?: boolean;
  /** Opens score entry for this player. The whole panel is the touch target. */
  onAddScore: () => void;
  style?: StyleProp<ViewStyle>;
}

export function describePanel(
  name: string,
  total: number,
  dealer: boolean,
  leading: boolean,
): string {
  return `${name}: ${total} ${total === 1 ? 'point' : 'points'}${dealer ? ', dealer, has the crib' : ''}${
    leading ? ', leading' : ''
  }`;
}

/** Player name, score, dealer/crib badge and a "+ Score" affordance; tapping anywhere adds a score. */
export function CribbagePlayerPanel({
  name,
  total,
  color,
  dealer,
  leading,
  dense,
  onAddScore,
  style,
}: CribbagePlayerPanelProps) {
  const scale = useTextScale();
  const totalSize = dense ? 28 : scale(34);

  const totalText = (
    <Text
      maxFontSizeMultiplier={1.2}
      adjustsFontSizeToFit
      numberOfLines={1}
      style={[
        styles.total,
        dense && styles.totalDense,
        { fontSize: totalSize, lineHeight: totalSize + 4 },
        leading && styles.totalLeading,
      ]}
    >
      {total}
    </Text>
  );

  const badge = dealer ? (
    <View style={[styles.badge, dense && styles.badgeDense]}>
      <Text
        maxFontSizeMultiplier={1.2}
        adjustsFontSizeToFit
        minimumFontScale={0.7}
        numberOfLines={1}
        style={styles.badgeText}
      >
        {dense ? 'Dealer' : 'Dealer · crib'}
      </Text>
    </View>
  ) : null;

  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onAddScore();
      }}
      accessibilityRole="button"
      accessibilityLabel={describePanel(name, total, dealer, leading)}
      accessibilityHint={`Adds a score for ${name}`}
      style={({ pressed }) => [
        styles.panel,
        dense && styles.dense,
        leading && styles.leading,
        pressed && styles.pressed,
        style,
      ]}
    >
      <View style={styles.nameRow}>
        <View style={[styles.swatch, { backgroundColor: color }]} />
        <Text
          maxFontSizeMultiplier={1.2}
          numberOfLines={1}
          style={[styles.name, { fontSize: scale(typography.bodyStrong.fontSize) }]}
        >
          {name}
        </Text>
      </View>
      {dense ? (
        <View style={styles.totalRow}>
          {totalText}
          {badge}
        </View>
      ) : (
        <>
          {totalText}
          <View style={styles.badgeSlot}>{badge}</View>
          <View style={styles.addPill}>
            <Text maxFontSizeMultiplier={1.2} numberOfLines={1} style={styles.addText}>
              + Score
            </Text>
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  panel: {
    minHeight: 48,
    gap: spacing.xs,
    padding: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    ...shadows.card,
  },
  dense: { gap: 2, padding: spacing.xs },
  leading: { borderColor: colors.gold, backgroundColor: colors.surfaceRaised },
  pressed: { backgroundColor: colors.surfaceRaised },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  name: {
    flexShrink: 1,
    color: colors.textPrimary,
    fontWeight: typography.bodyStrong.fontWeight,
  },
  total: {
    color: colors.textPrimary,
    fontWeight: typography.display.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  totalLeading: { color: colors.gold },
  totalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 4 },
  totalDense: { flexShrink: 1 },
  badgeSlot: { minHeight: 18, alignItems: 'flex-start' },
  badge: {
    maxWidth: '100%',
    backgroundColor: colors.gold,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
  },
  badgeDense: { flexShrink: 1 },
  badgeText: {
    fontSize: 11,
    lineHeight: 18,
    fontWeight: typography.label.fontWeight,
    color: colors.textOnAccent,
  },
  addPill: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 28,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
  },
  addText: { ...typography.caption, color: colors.textPrimary },
});
