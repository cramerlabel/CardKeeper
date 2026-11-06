import { Pressable, StyleSheet, Text, View } from 'react-native';

import { laneColor } from '@/features/cribbageBoard/laneColors';
import { useTextScale } from '@/features/scoreboard/useTextScale';
import type { PlayerIndex } from '@/games/cribbage/engine';
import { colors, radius, spacing, typography } from '@/theme';

interface PlayerChipsProps {
  names: readonly string[];
  totals: readonly number[];
  selected: PlayerIndex;
  /** Dealer of the deal being scored; marked on their chip. */
  dealer: PlayerIndex;
  onSelect: (player: PlayerIndex) => void;
}

/** One chip per player (2–3) with the peg colour, name, current total and a dealer mark. */
export function PlayerChips({ names, totals, selected, dealer, onSelect }: PlayerChipsProps) {
  const scale = useTextScale();

  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Player">
      {names.map((name, index) => {
        const player = index as PlayerIndex;
        const isSelected = player === selected;
        const isDealer = player === dealer;
        return (
          <Pressable
            key={index}
            accessibilityRole="radio"
            accessibilityLabel={`${name}, ${totals[index] ?? 0} points${isDealer ? ', dealer' : ''}`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => onSelect(player)}
            style={[styles.chip, isSelected && styles.selected]}
          >
            <View style={styles.nameRow}>
              <View style={[styles.swatch, { backgroundColor: laneColor(index) }]} />
              <Text
                numberOfLines={1}
                maxFontSizeMultiplier={1.3}
                style={[styles.name, { fontSize: scale(typography.caption.fontSize) }]}
              >
                {name}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text
                maxFontSizeMultiplier={1.3}
                style={[styles.total, { fontSize: scale(18), lineHeight: scale(22) }]}
              >
                {totals[index] ?? 0}
              </Text>
              {isDealer ? (
                <Text
                  maxFontSizeMultiplier={1.2}
                  style={[styles.dealer, { fontSize: scale(10) }]}
                  numberOfLines={1}
                >
                  DEALER
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  chip: {
    flex: 1,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.gold, backgroundColor: colors.surfaceRaised },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  name: { flexShrink: 1, color: colors.textPrimary, fontWeight: '700' },
  totalRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  total: { color: colors.textPrimary, fontWeight: '800', fontVariant: ['tabular-nums'] },
  dealer: { color: colors.gold, fontWeight: '800', letterSpacing: 0.8 },
});
