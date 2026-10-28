import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, spacing, typography } from '@/theme';

/** Stub until Step 6 (scoreboard). */
export default function GinScoreboardScreen() {
  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.title}>Scoreboard</Text>
      <Text style={styles.body}>The Gin Rummy scoreboard arrives in Step 6.</Text>
      <Button label="Back to menu" variant="secondary" onPress={() => router.back()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', gap: spacing.lg },
  title: { ...typography.title, color: colors.textPrimary },
  body: { ...typography.body, color: colors.textSecondary },
});
