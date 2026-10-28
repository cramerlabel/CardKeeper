import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { GameMenu, type MenuAction } from '@/features/scoreboard/GameMenu';
import { HandHistory } from '@/features/scoreboard/HandHistory';
import { ScorePanel } from '@/features/scoreboard/ScorePanel';
import { buildHistoryRows, leaderOf } from '@/features/scoreboard/history';
import { useTextScale } from '@/features/scoreboard/useTextScale';
import { DEFAULT_SCORING_CONFIG } from '@/games/ginRummy/engine';
import { selectHandsWon, selectTotals, useGinHydrated, useGinStore } from '@/games/ginRummy/store';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, spacing, typography } from '@/theme';

const TARGET = DEFAULT_SCORING_CONFIG.targetScore;

const goHome = () => (router.canGoBack() ? router.back() : router.replace('/'));
const openHandEntry = (handId?: string) =>
  router.push((handId ? `/gin/hand?handId=${handId}` : '/gin/hand') as never);

export default function GinScoreboardScreen() {
  const hydrated = useGinHydrated();
  const game = useGinStore((s) => s.currentGame);
  const totals = useGinStore(selectTotals);
  const won = useGinStore(selectHandsWon);
  const undoLastHand = useGinStore((s) => s.undoLastHand);
  const finishGame = useGinStore((s) => s.finishGame);
  const abandonGame = useGinStore((s) => s.abandonGame);
  const { isLandscape, sizeClass, isDense: dense } = useResponsive();
  const scale = useTextScale();
  const [menuOpen, setMenuOpen] = useState(false);

  const status = game?.status;
  // Only redirect while focused so the hand-entry screen can save and pop back before we leave.
  useFocusEffect(
    useCallback(() => {
      if (status === 'finished') router.replace('/gin/game-over' as never);
    }, [status]),
  );

  const players = game?.players;
  const hands = game?.hands;
  const rows = useMemo(
    () => (players && hands ? buildHistoryRows(hands, players) : []),
    [players, hands],
  );

  if (!hydrated) return <ScreenContainer>{null}</ScreenContainer>;
  if (!game) return <Redirect href="/" />;

  const hasHands = game.hands.length > 0;
  const leader = leaderOf(totals);
  const sideBySide = isLandscape || sizeClass === 'expanded';

  const confirmUndo = () => {
    const last = game.hands[game.hands.length - 1];
    Alert.alert(`Undo hand ${last.number}?`, 'The last hand will be removed and scores restored.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Undo', style: 'destructive', onPress: () => undoLastHand() },
    ]);
  };

  const confirmEnd = () =>
    Alert.alert(
      'End game now?',
      'The game finishes with the hands played so far and final scores are calculated.',
      [
        { text: 'Keep playing', style: 'cancel' },
        { text: 'End game', onPress: () => finishGame() },
      ],
    );

  const confirmAbandon = () =>
    Alert.alert('Abandon game?', 'This discards the game without saving it to history.', [
      { text: 'Keep playing', style: 'cancel' },
      { text: 'Abandon', style: 'destructive', onPress: () => abandonGame() },
    ]);

  const actions: MenuAction[] = [
    { key: 'undo', label: 'Undo last hand', onPress: confirmUndo, disabled: !hasHands },
    { key: 'end', label: 'End game now', onPress: confirmEnd, disabled: !hasHands },
    { key: 'abandon', label: 'Abandon game', onPress: confirmAbandon, destructive: true },
    { key: 'home', label: 'Back to menu', onPress: goHome },
  ];

  const panels = ([0, 1] as const).map((id) => (
    <ScorePanel
      key={id}
      name={game.players[id]}
      total={totals[id]}
      handsWon={won[id]}
      target={TARGET}
      leading={leader === id}
      dense={dense}
      style={sideBySide ? undefined : styles.panelSlot}
    />
  ));

  const addHand = (
    <Button
      label="Add hand"
      onPress={() => openHandEntry()}
      style={dense ? styles.headerAdd : undefined}
    />
  );

  const history = <HandHistory rows={rows} players={game.players} onSelectHand={openHandEntry} />;

  return (
    <ScreenContainer style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={goHome}
          accessibilityRole="button"
          accessibilityLabel="Back to menu"
          hitSlop={8}
          style={styles.iconButton}
        >
          <Ionicons name="chevron-back" size={26} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { fontSize: scale(typography.heading.fontSize) }]}>
            Gin Rummy
          </Text>
          <Text style={styles.subtitle}>
            {hasHands ? `Hand ${game.hands.length + 1}` : 'First hand'} · first to {TARGET}
          </Text>
        </View>
        {dense ? addHand : null}
        <Pressable
          onPress={() => setMenuOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Game menu"
          hitSlop={8}
          style={styles.iconButton}
        >
          <Ionicons name="ellipsis-vertical" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>

      {sideBySide ? (
        <View style={styles.bodyRow}>
          <View style={styles.leftColumn}>
            <View style={styles.panelsColumn}>{panels}</View>
            {dense ? null : addHand}
          </View>
          <View style={styles.rightColumn}>{history}</View>
        </View>
      ) : (
        <>
          <View style={styles.panelsRow}>{panels}</View>
          <View style={styles.historyPortrait}>{history}</View>
          {addHand}
        </>
      )}

      <GameMenu visible={menuOpen} actions={actions} onClose={() => setMenuOpen(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: { flex: 1 },
  title: { fontWeight: typography.heading.fontWeight, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  headerAdd: { minHeight: 40, paddingHorizontal: spacing.lg },
  panelSlot: { flex: 1 },
  panelsRow: { flexDirection: 'row', gap: spacing.md },
  historyPortrait: { flex: 1 },
  bodyRow: { flex: 1, flexDirection: 'row', gap: spacing.lg },
  leftColumn: { flex: 2, gap: spacing.md },
  panelsColumn: { gap: spacing.md },
  rightColumn: { flex: 3 },
});
