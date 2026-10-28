import { router } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, spacing, typography } from '@/theme';

/** Stub until Step 5 (new game setup). */
export default function GinSetupScreen() {
  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.title}>New Gin Rummy game</Text>
      <Text style={styles.body}>Player setup arrives in Step 5.</Text>
      <Button label="Back" variant="secondary" onPress={() => router.back()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', gap: spacing.lg },
  title: { ...typography.title, color: colors.textPrimary },
  body: { ...typography.body, color: colors.textSecondary },
});
