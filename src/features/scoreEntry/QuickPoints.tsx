import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTextScale } from '@/features/scoreboard/useTextScale';
import { colors, radius, spacing, typography } from '@/theme';

interface QuickPointsProps {
  values: readonly number[];
  /** Points currently entered, highlighted when it matches a shortcut. */
  selected: number | null;
  disabled?: boolean;
  onSelect: (points: number) => void;
}

/** A single row of shortcut buttons for common point values. */
export function QuickPoints({ values, selected, disabled, onSelect }: QuickPointsProps) {
  const scale = useTextScale();

  return (
    <View style={styles.row} accessibilityRole="toolbar" accessibilityLabel="Common points">
      {values.map((value) => {
        const isSelected = value === selected;
        return (
          <Pressable
            key={value}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={`${value} ${value === 1 ? 'point' : 'points'}`}
            accessibilityState={{ selected: isSelected, disabled: !!disabled }}
            onPress={() => onSelect(value)}
            style={({ pressed }) => [
              styles.button,
              isSelected && styles.selected,
              pressed && styles.pressed,
              disabled && styles.disabled,
            ]}
          >
            <Text
              maxFontSizeMultiplier={1.3}
              style={[
                styles.label,
                { fontSize: scale(typography.bodyStrong.fontSize) },
                isSelected && styles.labelSelected,
              ]}
            >
              {value}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  button: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.feltDark,
  },
  selected: { backgroundColor: colors.gold, borderColor: colors.gold },
  pressed: { backgroundColor: colors.feltLight },
  disabled: { opacity: 0.4 },
  label: { color: colors.textPrimary, fontWeight: '700', fontVariant: ['tabular-nums'] },
  labelSelected: { color: colors.textOnAccent },
});
