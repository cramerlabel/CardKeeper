import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams, usePreventRemove } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { Keypad } from '@/features/handEntry/Keypad';
import { KindSelector } from '@/features/scoreEntry/KindSelector';
import { PlayerChips } from '@/features/scoreEntry/PlayerChips';
import { PointsReadout } from '@/features/scoreEntry/PointsReadout';
import { QuickPoints } from '@/features/scoreEntry/QuickPoints';
import {
  HEELS_NOTE,
  appendDigit,
  buildMessage,
  changeKind,
  describeDropped,
  describeScore,
  errorsFor,
  initialFormFor,
  isDirty,
  kindHint,
  parsePlayerParam,
  parsePoints,
  previewTotals,
  quickPointsFor,
  removeLastDigit,
  toInput,
  type ScoreForm,
} from '@/features/scoreEntry/scoreEntry';
import { useTextScale } from '@/features/scoreboard/useTextScale';
import {
  dealerOf,
  type GameContext,
  type PlayerIndex,
  type ScoreEvent,
} from '@/games/cribbage/engine';
import {
  selectContext,
  selectTotals,
  useCribbageHydrated,
  useCribbageStore,
  type ActionResult,
  type CribbageGame,
} from '@/games/cribbage/store';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';

const BOARD_ROUTE = '/cribbage/board';
// Between the 4dp and 8dp spacing tokens; keeps a 3-player form on a 640dp-tall phone in view.
const TIGHT_GAP = 6;

const goBack = () => (router.canGoBack() ? router.back() : router.replace(BOARD_ROUTE as never));

/** Add a score, or edit/delete one when `eventId` is given; `player` preselects who scored. */
export default function CribbageScoreScreen() {
  const hydrated = useCribbageHydrated();
  const { eventId, player } = useLocalSearchParams<{ eventId?: string; player?: string }>();
  if (!hydrated) return <ScreenContainer>{null}</ScreenContainer>;
  return <ScoreEntry eventId={Array.isArray(eventId) ? eventId[0] : eventId} player={player} />;
}

interface ScoreEntryProps {
  eventId?: string;
  player?: string | string[];
}

function ScoreEntry({ eventId, player }: ScoreEntryProps) {
  // The modal works on a snapshot taken at mount: while it is open only its own actions change the
  // game, and saving or deleting removes/renumbers the event while we navigate back, which must
  // not make the form flash recalculated totals or redirect.
  const [snapshot] = useState(() => {
    const game = useCribbageStore.getState().currentGame;
    return {
      game,
      editing: game?.events.find((e) => e.id === eventId) ?? null,
      finished: game?.status === 'finished',
    };
  });
  const { game, editing, finished } = snapshot;

  if (!game) return <Redirect href="/" />;
  if ((eventId && !editing) || (!editing && finished)) {
    return <Redirect href={BOARD_ROUTE as never} />;
  }
  return <ScoreEntryForm initialGame={game} editing={editing} playerParam={player} />;
}

interface ScoreEntryFormProps {
  initialGame: CribbageGame;
  editing: ScoreEvent | null;
  playerParam?: string | string[];
}

function ScoreEntryForm({ initialGame, editing, playerParam }: ScoreEntryFormProps) {
  const addScore = useCribbageStore((s) => s.addScore);
  const updateScore = useCribbageStore((s) => s.updateScore);
  const deleteScore = useCribbageStore((s) => s.deleteScore);
  const { isLandscape, isDense, height } = useResponsive();
  const scale = useTextScale();

  const [game, setGame] = useState(initialGame);
  const state = { currentGame: game };
  const ctx = selectContext(state) as GameContext;
  const totals = selectTotals(state);
  const players = game.players;
  const deal = editing ? editing.deal : game.deal;
  const dealer = dealerOf(deal, game.firstDealer, ctx.playerCount);

  const [baseline, setBaseline] = useState<ScoreForm>(() =>
    initialFormFor(
      editing ?? undefined,
      dealer,
      ctx.playerCount,
      parsePlayerParam(playerParam, ctx.playerCount),
    ),
  );
  const [form, setForm] = useState<ScoreForm>(baseline);
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [allowLeave, setAllowLeave] = useState(false);

  const dirty = isDirty(form, baseline);
  const disablePrevention = usePreventRemove(dirty && !allowLeave, ({ repeat }) => {
    Alert.alert('Discard changes?', 'This score has not been saved.', [
      { text: 'Keep editing', style: 'cancel' },
      {
        text: 'Discard',
        style: 'destructive',
        onPress: () => {
          setAllowLeave(true);
          repeat();
        },
      },
    ]);
  });

  const errors = errorsFor(form, deal, ctx);
  const preview = previewTotals(game.events, form, deal, ctx, editing ?? undefined);
  const message = buildMessage({
    errors,
    saveErrors,
    preview,
    playerName: players[form.player],
    notice,
  });
  const points = parsePoints(form.pointsText);
  const heels = form.kind === 'heels';

  const update = (next: ScoreForm) => {
    setForm(next);
    setSaveErrors([]);
    setNotice(null);
  };

  const leave = () => {
    setAllowLeave(true);
    disablePrevention();
    goBack();
  };

  /** Runs a store action; on success `stay` keeps the screen open, otherwise it closes. */
  const commit = (action: () => ActionResult, stay: boolean, onStay?: () => void) => {
    const result = action();
    if (!result.ok) {
      setSaveErrors(result.errors);
      haptics.warning();
      return;
    }
    haptics.success();
    if (stay) onStay?.();
    else leave();
  };

  const submit = (another: boolean) => {
    if (!preview) return;
    const input = toInput(form, deal);
    const run = () => {
      if (editing) return commit(() => updateScore(editing.id, input), false);
      // A winning score ends the game, so there is nothing left to add.
      const stay = another && !preview.wins;
      commit(
        () => addScore(input),
        stay,
        () => {
          const next = initialFormFor(undefined, dealer, ctx.playerCount);
          setGame(useCribbageStore.getState().currentGame ?? game);
          setBaseline(next);
          setForm(next);
          setSaveErrors([]);
          setNotice(`Added ${describeScore(input, players)}`);
        },
      );
    };
    if (editing && preview.dropped > 0) {
      Alert.alert('Save changes?', describeDropped(preview.dropped), [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Save', style: 'destructive', onPress: run },
      ]);
    } else {
      run();
    }
  };

  const confirmDelete = () => {
    if (!editing) return;
    Alert.alert(
      `Delete score ${editing.number}?`,
      `${describeScore(editing, players)} will be removed and the totals recalculated.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => commit(() => deleteScore(editing.id), false),
        },
      ],
    );
  };

  const tight = !isLandscape && height < 720;
  const gap = tight || isDense ? TIGHT_GAP : spacing.md;
  const showHint = !isDense && !tight;
  const stacked = !isLandscape && !isDense;
  const title = editing ? `Edit score ${editing.number}` : `Add score · Deal ${deal}`;

  const buttons = (style?: object): ReactNode[] => [
    editing ? (
      <Button
        key="delete"
        label="Delete"
        variant="secondary"
        onPress={confirmDelete}
        style={style}
      />
    ) : (
      <Button
        key="another"
        label="Save & add another"
        variant="secondary"
        onPress={() => submit(true)}
        disabled={!preview}
        style={style}
      />
    ),
    <Button
      key="save"
      label={editing ? 'Save changes' : 'Save'}
      onPress={() => submit(false)}
      disabled={!preview}
      style={style}
    />,
  ];

  const formBlock = (
    <View style={[styles.column, { gap }, stacked && styles.natural]}>
      <PlayerChips
        names={players}
        totals={totals}
        selected={form.player}
        dealer={dealer}
        onSelect={(next: PlayerIndex) => update({ ...form, player: next })}
      />
      <View style={styles.kinds}>
        <KindSelector
          value={form.kind}
          onChange={(kind) => update(changeKind(form, kind, dealer))}
        />
        {showHint ? <Text style={styles.hint}>{kindHint(form.kind, players[dealer])}</Text> : null}
      </View>
      <PointsReadout pointsText={form.pointsText} message={message} />
      {heels ? (
        <View style={styles.fixedPoints}>
          <Text style={styles.hint}>{HEELS_NOTE}</Text>
        </View>
      ) : (
        <QuickPoints
          values={quickPointsFor(form.kind)}
          selected={points}
          onSelect={(value) => update({ ...form, pointsText: String(value) })}
        />
      )}
    </View>
  );

  const inputBlock = (
    <View style={[styles.column, { gap }, stacked && styles.pinned, isDense && styles.denseInput]}>
      <Keypad
        disabled={heels}
        keyHeight={tight ? 48 : undefined}
        onDigit={(d) => update({ ...form, pointsText: appendDigit(form.pointsText, d) })}
        onBackspace={() => update({ ...form, pointsText: removeLastDigit(form.pointsText) })}
        onClear={() => update({ ...form, pointsText: '' })}
      />
      {isDense ? null : <View style={styles.actions}>{buttons(styles.action)}</View>}
    </View>
  );

  return (
    <ScreenContainer scroll={!isDense} style={{ gap }}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          hitSlop={8}
          style={[styles.iconButton, tight && styles.iconButtonTight]}
        >
          <Ionicons name="close" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text
          numberOfLines={1}
          style={[styles.title, { fontSize: scale(typography.heading.fontSize) }]}
        >
          {title}
        </Text>
        {isDense ? <View style={styles.headerActions}>{buttons(styles.headerButton)}</View> : null}
      </View>
      {isDense ? (
        // Short landscape: keep the keypad on screen and let only the form scroll.
        <View style={styles.denseBody}>
          <ScrollView
            style={styles.denseForm}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {formBlock}
          </ScrollView>
          {inputBlock}
        </View>
      ) : isLandscape ? (
        <View style={styles.twoColumn}>
          {formBlock}
          {inputBlock}
        </View>
      ) : (
        <>
          {formBlock}
          {inputBlock}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  // Tight portrait: a 40dp icon plus hitSlop keeps the touch target while saving height.
  iconButtonTight: { width: 40, height: 40 },
  title: { flex: 1, fontWeight: typography.heading.fontWeight, color: colors.textPrimary },
  headerActions: { flexDirection: 'row', gap: spacing.sm },
  headerButton: { paddingHorizontal: spacing.lg },
  // Stacked portrait: natural heights, with the keypad block pinned to the bottom of tall screens.
  natural: { flex: 0 },
  pinned: { flex: 0, marginTop: 'auto' },
  denseBody: { flex: 1, flexDirection: 'row', gap: spacing.lg },
  // Lets the form's scroll area use the screen's bottom padding so the quick row is not clipped.
  denseForm: { flex: 1, marginBottom: -spacing.lg },
  // The keypad needs less width than the form, whose five score kinds fit on one row.
  denseInput: { flex: 0.8 },
  twoColumn: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  column: { flex: 1 },
  kinds: { gap: spacing.xs },
  hint: { ...typography.caption, color: colors.textSecondary },
  fixedPoints: { minHeight: 48, justifyContent: 'center', alignItems: 'center' },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { flex: 1, paddingHorizontal: spacing.sm },
});
