import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';
import { useTextScale } from '@/features/scoreboard/useTextScale';
import { colors, radius, spacing, typography } from '@/theme';

interface KeypadProps {
  onDigit: (digit: string) => void;
  onBackspace: () => void;
  onClear: () => void;
  disabled?: boolean;
}

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
] as const;

/** Large on-screen numeric keypad (so the system keyboard never covers the form). */
export function Keypad({ onDigit, onBackspace, onClear, disabled }: KeypadProps) {
  const scale = useTextScale();
  const { isDense } = useResponsive();
  const keyHeight = isDense ? 44 : scale(52);
  const fontSize = scale(24);

  const key = (label: string, onPress: () => void, content: ReactNode, secondary = false) => (
    <Pressable
      key={label}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.key,
        { minHeight: keyHeight },
        secondary && styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      {content}
    </Pressable>
  );

  const digit = (d: string) =>
    key(d, () => onDigit(d), <Text style={[styles.digit, { fontSize }]}>{d}</Text>);

  return (
    <View style={styles.pad}>
      {ROWS.map((row) => (
        <View key={row[0]} style={styles.row}>
          {row.map(digit)}
        </View>
      ))}
      <View style={styles.row}>
        {key(
          'Clear',
          onClear,
          <Text style={[styles.action, { fontSize: scale(typography.bodyStrong.fontSize) }]}>
            Clear
          </Text>,
          true,
        )}
        {digit('0')}
        {key(
          'Backspace',
          onBackspace,
          <Ionicons name="backspace-outline" size={scale(26)} color={colors.textPrimary} />,
          true,
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pad: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.sm },
  key: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceRaised,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  secondary: { backgroundColor: colors.surface },
  pressed: { backgroundColor: colors.feltLight },
  disabled: { opacity: 0.4 },
  digit: { color: colors.textPrimary, fontWeight: '600', fontVariant: ['tabular-nums'] },
  action: { color: colors.textSecondary, fontWeight: '600' },
});
