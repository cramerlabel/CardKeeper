import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, spacing, typography } from '@/theme';

/** Stub until Step 8 (game over). */
export default function GinGameOverScreen() {
  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.title}>Game over</Text>
      <Text style={styles.body}>The Gin Rummy results screen arrives in Step 8.</Text>
      <Button label="Back to menu" variant="secondary" onPress={() => router.replace('/')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', gap: spacing.lg },
  title: { ...typography.title, color: colors.textPrimary },
  body: { ...typography.body, color: colors.textSecondary },
});
