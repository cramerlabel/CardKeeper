import { StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';

import { PressableScale } from './PressableScale';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Button({ label, onPress, variant = 'primary', disabled, style }: ButtonProps) {
  const primary = variant === 'primary';
  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      pressedStyle={styles.pressed}
      style={[
        styles.base,
        primary ? styles.primary : styles.secondary,
        disabled && styles.disabled,
        style,
      ]}
    >
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[styles.label, { color: primary ? colors.textOnAccent : colors.textPrimary }]}
      >
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: { backgroundColor: colors.gold },
  secondary: { borderWidth: 1.5, borderColor: colors.borderStrong, backgroundColor: 'transparent' },
  pressed: { opacity: 0.8 },
  disabled: { opacity: 0.4 },
  label: { ...typography.bodyStrong },
});
