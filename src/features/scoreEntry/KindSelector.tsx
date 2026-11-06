import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SCORE_KINDS, type ScoreKind } from '@/games/cribbage/engine';
import { colors, radius, spacing, typography } from '@/theme';

import { isDealerOnly } from './scoreEntry';

interface KindSelectorProps {
  value: ScoreKind;
  onChange: (kind: ScoreKind) => void;
}

/** Score kinds as chips that wrap onto a second row when the column is narrow or text is large. */
export function KindSelector({ value, onChange }: KindSelectorProps) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="Score type">
      {SCORE_KINDS.map(({ kind, label }) => {
        const selected = kind === value;
        return (
          <Pressable
            key={kind}
            accessibilityRole="radio"
            accessibilityLabel={label}
            accessibilityHint={isDealerOnly(kind) ? 'Dealer only' : undefined}
            accessibilityState={{ selected }}
            onPress={() => onChange(kind)}
            style={[styles.chip, selected && styles.selected]}
          >
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
              maxFontSizeMultiplier={1.3}
              style={[styles.label, selected && styles.labelSelected]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 52,
    minHeight: 48,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.gold, borderColor: colors.gold },
  label: { ...typography.bodyStrong, fontSize: 14, color: colors.textPrimary },
  labelSelected: { color: colors.textOnAccent },
});
