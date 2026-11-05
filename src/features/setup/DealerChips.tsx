import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PlayerIndex } from '@/games/cribbage/engine';
import { colors, radius, spacing, typography } from '@/theme';

import type { FirstDealerChoice } from './cribbageSetup';

interface DealerChipsProps {
  players: readonly string[];
  value: FirstDealerChoice;
  onChange: (value: FirstDealerChoice) => void;
}

/** One chip per player plus "Random"; chips wrap so long names and large fonts never overflow. */
export function DealerChips({ players, value, onChange }: DealerChipsProps) {
  const options: { value: FirstDealerChoice; label: string; description: string }[] = [
    ...players.map((name, index) => ({
      value: index as PlayerIndex,
      label: name,
      description: `${name} deals first`,
    })),
    { value: 'random', label: 'Random', description: 'Random first dealer' },
  ];

  return (
    <View style={styles.row} accessibilityRole="radiogroup" accessibilityLabel="First dealer">
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityLabel={option.description}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            style={[styles.chip, selected && styles.selected]}
          >
            <Text numberOfLines={1} style={[styles.label, selected && styles.labelSelected]}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    minHeight: 48,
    maxWidth: '100%',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selected: { backgroundColor: colors.gold, borderColor: colors.gold },
  label: { ...typography.bodyStrong, color: colors.textPrimary },
  labelSelected: { color: colors.textOnAccent },
});
