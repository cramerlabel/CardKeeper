import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { colors, radius, shadows, spacing } from '@/theme';

interface CardProps extends Pick<ViewProps, 'accessibilityLabel' | 'accessible'> {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, style, ...a11y }: CardProps) {
  return (
    <View style={[styles.card, style]} {...a11y}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.lg,
    ...shadows.card,
  },
});
