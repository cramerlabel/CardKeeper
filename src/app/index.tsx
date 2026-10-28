import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { ContinueGameCard } from '@/features/home/ContinueGameCard';
import { GameGrid } from '@/features/home/GameGrid';
import {
  selectHasSavedGame,
  selectTotals,
  useGinHydrated,
  useGinStore,
} from '@/games/ginRummy/store';
import { games, getGame } from '@/games/registry';
import type { GameDefinition } from '@/games/types';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, radius, spacing, typography } from '@/theme';

export default function HomeScreen() {
  const { scale, width, height } = useResponsive();
  // Size the title from the short side so landscape phones don't get a huge heading.
  const titleSize = Math.min(
    scale(typography.display.fontSize),
    (Math.min(width, height) / 360) * 44,
  );
  const hydrated = useGinHydrated();
  const hasSavedGame = useGinStore(selectHasSavedGame);
  const currentGame = useGinStore((s) => s.currentGame);
  const totals = useGinStore(selectTotals);

  const openGame = (game: GameDefinition) => {
    if (game.available) router.push(game.route as never);
  };

  return (
    <ScreenContainer scroll>
      <View style={styles.header} accessibilityRole="header">
        <View style={styles.logo}>
          <MaterialCommunityIcons
            name="cards-playing-outline"
            size={scale(32)}
            color={colors.gold}
          />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.18 }]}>
            Card Keeper
          </Text>
          <Text style={styles.subtitle}>Score keeping for your card games</Text>
        </View>
      </View>

      {hydrated && hasSavedGame && currentGame && (
        <View style={styles.section}>
          <ContinueGameCard
            gameName={getGame('ginRummy')?.name ?? 'Gin Rummy'}
            players={currentGame.players}
            totals={totals}
            handCount={currentGame.hands.length}
            onContinue={() => router.push('/gin/scoreboard' as never)}
            onDiscard={() => useGinStore.getState().abandonGame()}
          />
        </View>
      )}

      <Text style={styles.sectionLabel} accessibilityRole="header">
        CHOOSE A GAME
      </Text>
      <GameGrid games={games} onSelect={openGame} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: radius.lg,
    backgroundColor: colors.feltDark,
    borderWidth: 1.5,
    borderColor: colors.goldDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flexShrink: 1 },
  title: { color: colors.cream, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { ...typography.body, color: colors.textSecondary },
  section: { marginBottom: spacing.xl },
  sectionLabel: { ...typography.label, color: colors.gold, marginBottom: spacing.md },
});
