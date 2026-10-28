import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text } from 'react-native';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { colors, spacing, typography } from '@/theme';

/** Stub until Step 7 (hand entry). `handId` is set when editing an existing hand. */
export default function GinHandEntryScreen() {
  const { handId } = useLocalSearchParams<{ handId?: string }>();
  return (
    <ScreenContainer style={styles.container}>
      <Text style={styles.title}>{handId ? 'Edit hand' : 'Add hand'}</Text>
      <Text style={styles.body}>The hand entry screen arrives in Step 7.</Text>
      <Button label="Back" variant="secondary" onPress={() => router.back()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { justifyContent: 'center', gap: spacing.lg },
  title: { ...typography.title, color: colors.textPrimary },
  body: { ...typography.body, color: colors.textSecondary },
});
