import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ScreenContainer';
import { ContinueGameCard } from '@/features/home/ContinueGameCard';
import { GameGrid } from '@/features/home/GameGrid';
import { buildSavedGames, type SavedGameId } from '@/features/home/savedGames';
import {
  selectHasSavedGame as selectHasSavedCribbage,
  selectTotals as selectCribbageTotals,
  useCribbageHydrated,
  useCribbageStore,
} from '@/games/cribbage/store';
import {
  selectHasSavedGame as selectHasSavedGin,
  selectTotals as selectGinTotals,
  useGinHydrated,
  useGinStore,
} from '@/games/ginRummy/store';
import { games } from '@/games/registry';
import type { GameDefinition } from '@/games/types';
import { openRules } from '@/features/rules/openRules';
import { useResponsive } from '@/hooks/useResponsive';
import { useSettingsStore } from '@/settings';
import { colors, radius, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';

export default function HomeScreen() {
  const { scale, width, height } = useResponsive();
  // Size the title from the short side so landscape phones don't get a huge heading.
  const titleSize = Math.min(
    scale(typography.display.fontSize),
    (Math.min(width, height) / 360) * 44,
  );
  const ginHydrated = useGinHydrated();
  const ginSaved = useGinStore(selectHasSavedGin);
  const ginGame = useGinStore((s) => s.currentGame);
  const ginTotals = useGinStore(selectGinTotals);
  const cribbageHydrated = useCribbageHydrated();
  const cribbageSaved = useCribbageStore(selectHasSavedCribbage);
  const cribbageGame = useCribbageStore((s) => s.currentGame);
  const cribbageTotals = useCribbageStore(selectCribbageTotals);

  const savedGames = useMemo(
    () =>
      buildSavedGames({
        ginRummy:
          ginHydrated && ginSaved && ginGame
            ? { players: ginGame.players, totals: ginTotals, handCount: ginGame.hands.length }
            : null,
        cribbage:
          cribbageHydrated && cribbageSaved && cribbageGame
            ? { players: cribbageGame.players, totals: cribbageTotals, deal: cribbageGame.deal }
            : null,
      }),
    [
      ginHydrated,
      ginSaved,
      ginGame,
      ginTotals,
      cribbageHydrated,
      cribbageSaved,
      cribbageGame,
      cribbageTotals,
    ],
  );

  const discardActions: Record<SavedGameId, () => void> = {
    ginRummy: () => useGinStore.getState().abandonGame(),
    cribbage: () => useCribbageStore.getState().abandonGame(),
  };
  const hapticsEnabled = useSettingsStore((s) => s.hapticsEnabled);
  const setHapticsEnabled = useSettingsStore((s) => s.setHapticsEnabled);

  const toggleHaptics = () => {
    setHapticsEnabled(!hapticsEnabled);
    // Confirm the new state with a buzz only when turning it on.
    if (!hapticsEnabled) haptics.tap();
  };

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
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            style={[styles.title, { fontSize: titleSize, lineHeight: titleSize * 1.18 }]}
          >
            Card Keeper
          </Text>
          <Text style={styles.subtitle}>Score keeping for your card games</Text>
        </View>
        <Pressable
          onPress={toggleHaptics}
          accessibilityRole="switch"
          accessibilityLabel="Haptic feedback"
          accessibilityState={{ checked: hapticsEnabled }}
          hitSlop={4}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons
            name={hapticsEnabled ? 'vibrate' : 'vibrate-off'}
            size={24}
            color={hapticsEnabled ? colors.gold : colors.textSecondary}
          />
        </Pressable>
      </View>

      {savedGames.map((saved) => (
        <View key={saved.gameId} style={styles.section}>
          <ContinueGameCard
            gameName={saved.gameName}
            players={saved.players}
            totals={saved.totals}
            progressLabel={saved.progressLabel}
            onContinue={() => router.push(saved.continueRoute as never)}
            onDiscard={discardActions[saved.gameId]}
          />
        </View>
      ))}

      <Text style={styles.sectionLabel} accessibilityRole="header">
        CHOOSE A GAME
      </Text>
      <GameGrid games={games} onSelect={openGame} onShowRules={(game) => openRules(game.id)} />
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
  headerText: { flex: 1 },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  title: { color: colors.cream, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { ...typography.body, color: colors.textSecondary },
  section: { marginBottom: spacing.xl },
  sectionLabel: { ...typography.label, color: colors.gold, marginBottom: spacing.md },
});
