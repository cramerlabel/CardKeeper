import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/theme';

import { Button } from './Button';
import { ScreenContainer } from './ScreenContainer';

interface ErrorFallbackProps {
  error: Error;
  onRetry: () => void;
  /** Wipes saved games so a corrupted save can't keep crashing the app. */
  onReset: () => void;
}

export function ErrorFallback({ error, onRetry, onReset }: ErrorFallbackProps) {
  return (
    <ScreenContainer scroll style={styles.container}>
      <View style={styles.icon}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={colors.gold} />
      </View>
      <Text style={styles.title} accessibilityRole="header">
        Something went wrong
      </Text>
      <Text style={styles.body}>
        Card Keeper hit an unexpected problem. Your saved game is untouched — try again first.
      </Text>
      {__DEV__ ? <Text style={styles.detail}>{error.message}</Text> : null}
      <View style={styles.actions}>
        <Button label="Try again" onPress={onRetry} />
        <Button label="Reset saved data" variant="secondary" onPress={onReset} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', alignItems: 'center', gap: spacing.lg },
  icon: { alignItems: 'center' },
  title: { ...typography.title, color: colors.textPrimary, textAlign: 'center' },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  detail: { ...typography.caption, color: colors.danger, textAlign: 'center' },
  actions: { alignSelf: 'stretch', gap: spacing.md },
});
