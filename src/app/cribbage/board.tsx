import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { AccessibilityInfo, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { CribbageBoard } from '@/features/cribbageBoard/CribbageBoard';
import { laneColor } from '@/features/cribbageBoard/laneColors';
import { CribbageHistory } from '@/features/cribbageHistory/CribbageHistory';
import {
  buildHistorySections,
  hasScoresInDeal,
  leaderOf,
} from '@/features/cribbageHistory/history';
import { CribbagePlayerPanel } from '@/features/cribbagePanel/CribbagePlayerPanel';
import { openRules } from '@/features/rules/openRules';
import { describeScore } from '@/features/scoreEntry/scoreEntry';
import { GameMenu, type MenuAction } from '@/features/scoreboard/GameMenu';
import { useTextScale } from '@/features/scoreboard/useTextScale';
import { getConfig } from '@/games/cribbage/engine';
import {
  selectDealer,
  selectPegs,
  selectTotals,
  useCribbageHydrated,
  useCribbageStore,
  type ActionResult,
} from '@/games/cribbage/store';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, spacing, typography } from '@/theme';

const goHome = () => (router.canGoBack() ? router.back() : router.replace('/'));
const openScoreEntry = (query?: string) =>
  router.push((query ? `/cribbage/score?${query}` : '/cribbage/score') as never);

const showFailure = (result: ActionResult) => {
  if (!result.ok) Alert.alert('Couldn’t do that', result.errors.join('\n'));
};

export default function CribbageBoardScreen() {
  const hydrated = useCribbageHydrated();
  const game = useCribbageStore((s) => s.currentGame);
  const totals = useCribbageStore(selectTotals);
  const pegs = useCribbageStore(selectPegs);
  const dealer = useCribbageStore(selectDealer);
  const nextDeal = useCribbageStore((s) => s.nextDeal);
  const undoLastScore = useCribbageStore((s) => s.undoLastScore);
  const finishGame = useCribbageStore((s) => s.finishGame);
  const abandonGame = useCribbageStore((s) => s.abandonGame);
  const { isLandscape, isDense: dense } = useResponsive();
  const scale = useTextScale();
  const [menuOpen, setMenuOpen] = useState(false);

  const status = game?.status;
  // Only redirect while focused so the score modal can save and pop back before we leave.
  useFocusEffect(
    useCallback(() => {
      if (status === 'finished') router.replace('/cribbage/game-over' as never);
    }, [status]),
  );

  const events = game?.events;
  const players = game?.players;
  const firstDealer = game?.firstDealer;
  const deal = game?.deal;
  const target = game?.target;
  const config = useMemo(() => (target ? getConfig(target) : null), [target]);
  const sections = useMemo(
    () =>
      events && players && firstDealer !== undefined && deal !== undefined && target
        ? buildHistorySections({ events, players, firstDealer, deal, target })
        : [],
    [events, players, firstDealer, deal, target],
  );

  if (!hydrated) return <ScreenContainer>{null}</ScreenContainer>;
  if (!game || !config || dealer === null) return <Redirect href="/" />;

  const hasScores = game.events.length > 0;
  const leader = leaderOf(totals);
  const sideBySide = isLandscape;

  const confirmNextDeal = () => {
    const advance = () => {
      showFailure(nextDeal());
      const next = useCribbageStore.getState();
      const newDealer = selectDealer(next);
      if (next.currentGame && newDealer !== null) {
        AccessibilityInfo.announceForAccessibility(
          `Deal ${next.currentGame.deal}. ${next.currentGame.players[newDealer]} is dealing.`,
        );
      }
    };
    if (hasScoresInDeal(game.events, game.deal)) {
      advance();
      return;
    }
    Alert.alert(
      `Skip deal ${game.deal}?`,
      'No scores were recorded this deal. Move on to the next deal anyway?',
      [
        { text: 'Stay', style: 'cancel' },
        { text: 'Next deal', onPress: advance },
      ],
    );
  };

  const confirmUndo = () => {
    const last = game.events[game.events.length - 1];
    if (!last) return;
    Alert.alert(
      'Undo last score?',
      `${describeScore(last, game.players)} will be removed and the pegs move back.`,
      [
        { text: 'Keep', style: 'cancel' },
        { text: 'Undo', style: 'destructive', onPress: () => showFailure(undoLastScore()) },
      ],
    );
  };

  const confirmEnd = () =>
    Alert.alert(
      'End game now?',
      'The game finishes with the scores so far and the result is calculated.',
      [
        { text: 'Keep playing', style: 'cancel' },
        { text: 'End game', onPress: () => showFailure(finishGame()) },
      ],
    );

  const confirmAbandon = () =>
    Alert.alert('Abandon game?', 'This discards the game without saving it to history.', [
      { text: 'Keep playing', style: 'cancel' },
      { text: 'Abandon', style: 'destructive', onPress: () => abandonGame() },
    ]);

  const actions: MenuAction[] = [
    { key: 'undo', label: 'Undo last score', onPress: confirmUndo, disabled: !hasScores },
    { key: 'end', label: 'End game now', onPress: confirmEnd, disabled: !hasScores },
    { key: 'abandon', label: 'Abandon game', onPress: confirmAbandon, destructive: true },
    { key: 'rules', label: 'How to play', onPress: () => openRules('cribbage') },
    { key: 'home', label: 'Back to menu', onPress: goHome },
  ];

  const board = (
    <CribbageBoard
      key={game.id}
      pegs={pegs}
      playerNames={game.players}
      config={config}
      dealer={dealer}
    />
  );

  const panels = game.players.map((name, index) => (
    <CribbagePlayerPanel
      key={index}
      name={name}
      total={totals[index]}
      color={laneColor(index)}
      dealer={dealer === index}
      leading={leader === index}
      dense={dense}
      onAddScore={() => openScoreEntry(`player=${index}`)}
      style={styles.panelSlot}
    />
  ));

  const buttonStyle = dense ? styles.headerButton : styles.actionButton;
  const addScore = (
    <Button label="Add score" onPress={() => openScoreEntry()} style={buttonStyle} />
  );
  const nextDealButton = (
    <Button label="Next deal" variant="secondary" onPress={confirmNextDeal} style={buttonStyle} />
  );

  const history = (
    <CribbageHistory sections={sections} onSelectScore={(id) => openScoreEntry(`eventId=${id}`)} />
  );

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
          <Text
            maxFontSizeMultiplier={1.3}
            style={[styles.title, { fontSize: scale(typography.heading.fontSize) }]}
          >
            Cribbage
          </Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.subtitle}>
            Deal {game.deal} · first to {game.target}
          </Text>
        </View>
        {dense ? (
          <>
            {nextDealButton}
            {addScore}
          </>
        ) : null}
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
          <View style={styles.boardLandscape}>{board}</View>
          <View style={styles.rightColumn}>
            <View style={styles.panelsRow}>{panels}</View>
            {dense ? null : (
              <View style={styles.actionsRow}>
                {nextDealButton}
                {addScore}
              </View>
            )}
            <View style={styles.history}>{history}</View>
          </View>
        </View>
      ) : (
        <>
          <View style={styles.boardPortrait}>{board}</View>
          <View style={styles.panelsRow}>{panels}</View>
          <View style={styles.historyPortrait}>{history}</View>
          <View style={styles.actionsRow}>
            {nextDealButton}
            {addScore}
          </View>
        </>
      )}

      <GameMenu visible={menuOpen} actions={actions} onClose={() => setMenuOpen(false)} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  titleBlock: { flex: 1 },
  title: { fontWeight: typography.heading.fontWeight, color: colors.textPrimary },
  subtitle: { ...typography.caption, color: colors.textSecondary },
  headerButton: { minHeight: 48, paddingHorizontal: spacing.lg },
  actionButton: { flex: 1 },
  actionsRow: { flexDirection: 'row', gap: spacing.md },
  panelsRow: { flexDirection: 'row', gap: spacing.sm },
  panelSlot: { flex: 1 },
  boardPortrait: { flex: 5 },
  historyPortrait: { flex: 3 },
  bodyRow: { flex: 1, flexDirection: 'row', gap: spacing.lg },
  boardLandscape: { flex: 1 },
  rightColumn: { flex: 1, gap: spacing.md },
  history: { flex: 1 },
});
