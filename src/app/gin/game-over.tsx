import { Redirect, Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { ScoreBreakdown } from '@/features/gameOver/ScoreBreakdown';
import { WinnerBanner } from '@/features/gameOver/WinnerBanner';
import { buildSummary } from '@/features/gameOver/summary';
import { selectFinalScore, useGinHydrated, useGinStore } from '@/games/ginRummy/store';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, spacing, typography } from '@/theme';

/**
 * Results screen. The finished game stays in `currentGame` (and in `history`) while this screen is
 * showing; every way out either discards `currentGame` or replaces it, so Continue never offers it.
 */
export default function GinGameOverScreen() {
  const hydrated = useGinHydrated();
  const game = useGinStore((s) => s.currentGame);
  const finalScore = useGinStore(selectFinalScore);
  const { isLandscape, sizeClass, isDense } = useResponsive();
  // Set before leaving so the redirects below don't fire while the screen is transitioning out.
  const [leaving, setLeaving] = useState(false);

  const players = game?.players;
  const handCount = game?.hands.length ?? 0;
  const summary = useMemo(
    () => (players ? buildSummary(finalScore, players, handCount) : null),
    [finalScore, players, handCount],
  );

  const goMenu = useCallback(() => {
    setLeaving(true);
    useGinStore.getState().abandonGame();
    router.replace('/');
  }, []);

  // The hardware back button leaves for the menu instead of returning to the ended game.
  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        goMenu();
        return true;
      });
      return () => subscription.remove();
    }, [goMenu]),
  );

  if (!hydrated || leaving) return <ScreenContainer>{null}</ScreenContainer>;
  if (!game || !summary) return <Redirect href="/" />;
  if (game.status !== 'finished') return <Redirect href="/gin/scoreboard" />;

  const twoColumn = isLandscape || sizeClass === 'expanded';

  const rematch = () => {
    setLeaving(true);
    useGinStore.getState().startGame(game.players);
    router.replace('/gin/scoreboard' as never);
  };

  const newGame = () => {
    setLeaving(true);
    useGinStore.getState().abandonGame();
    router.replace('/gin/setup' as never);
  };

  const confirmUndo = () => {
    const last = game.hands[game.hands.length - 1];
    Alert.alert(
      `Reopen the game?`,
      `Hand ${last.number} will be removed and play resumes from the previous scores.`,
      [
        { text: 'Keep result', style: 'cancel' },
        {
          text: 'Undo hand',
          style: 'destructive',
          onPress: () => {
            setLeaving(true);
            useGinStore.getState().undoLastHand();
            router.replace('/gin/scoreboard' as never);
          },
        },
      ],
    );
  };

  const banner = (
    <WinnerBanner
      headline={summary.headline}
      subline={summary.subline}
      hasChampion={summary.champion !== null}
    />
  );
  const breakdown = (
    <ScoreBreakdown players={game.players} rows={summary.rows} champion={summary.champion} />
  );
  const actions = (
    <View style={styles.actions}>
      <Button label="Rematch" onPress={rematch} style={isDense ? styles.denseButton : undefined} />
      <Button
        label="New game"
        variant="secondary"
        onPress={newGame}
        style={isDense ? styles.denseButton : undefined}
      />
      <Button
        label="Return to menu"
        variant="secondary"
        onPress={goMenu}
        style={isDense ? styles.denseButton : undefined}
      />
      <Pressable
        onPress={confirmUndo}
        accessibilityRole="button"
        accessibilityLabel="Undo last hand and reopen the game"
        style={styles.link}
      >
        <Text style={styles.linkText}>Undo last hand</Text>
      </Pressable>
    </View>
  );

  return (
    <ScreenContainer scroll style={isDense ? styles.containerDense : styles.container}>
      {/* Swipe-back would return to an ended game. */}
      <Stack.Screen options={{ gestureEnabled: false }} />
      {isDense ? (
        // Short landscape: banner across the top, actions beside the table so the result is on screen.
        <>
          {banner}
          <View style={styles.denseRow}>
            <View style={styles.denseColumn}>{actions}</View>
            <View style={[styles.denseColumn, styles.denseTable]}>{breakdown}</View>
          </View>
        </>
      ) : twoColumn ? (
        <View style={styles.twoColumn}>
          <View style={styles.column}>
            {banner}
            {actions}
          </View>
          <View style={styles.column}>{breakdown}</View>
        </View>
      ) : (
        <>
          {banner}
          {breakdown}
          {actions}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, justifyContent: 'center' },
  containerDense: { gap: spacing.sm, justifyContent: 'center', paddingVertical: spacing.sm },
  twoColumn: { flexDirection: 'row', gap: spacing.xl, alignItems: 'center' },
  column: { flex: 1, gap: spacing.lg },
  actions: { gap: spacing.md },
  denseRow: { flexDirection: 'row', gap: spacing.lg, alignItems: 'center' },
  denseColumn: { flex: 1 },
  denseTable: { flex: 1.2 },
  denseButton: { minHeight: 40 },
  link: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  linkText: {
    ...typography.bodyStrong,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
});
