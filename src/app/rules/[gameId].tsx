import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { RulesContent } from '@/features/rules/RulesContent';
import { getGame } from '@/games/registry';
import { getRules } from '@/games/rules';
import { colors, spacing, typography } from '@/theme';

export default function RulesScreen() {
  const { gameId } = useLocalSearchParams<{ gameId: string }>();
  const game = gameId ? getGame(gameId) : undefined;
  const rules = gameId ? getRules(gameId) : undefined;

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={8}
          style={styles.iconButton}
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={styles.label}>HOW TO PLAY</Text>
          <Text style={styles.title} accessibilityRole="header">
            {game?.name ?? 'Rules'}
          </Text>
        </View>
      </View>
      {rules ? (
        <RulesContent rules={rules} />
      ) : (
        <Text style={styles.missing}>Rules for this game aren{'\u2019'}t available.</Text>
      )}
      <Button label="Back" variant="secondary" onPress={goBack} style={styles.footer} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1 },
  label: { ...typography.label, color: colors.gold },
  title: { ...typography.title, color: colors.textPrimary },
  missing: { ...typography.body, color: colors.textSecondary },
  footer: { marginTop: spacing.xl },
});
