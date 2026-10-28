import { Ionicons } from '@expo/vector-icons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SegmentedControl } from '@/components/SegmentedControl';
import { DeadwoodField } from '@/features/handEntry/DeadwoodField';
import { HandPreview } from '@/features/handEntry/HandPreview';
import { Keypad } from '@/features/handEntry/Keypad';
import {
  HAND_KINDS,
  appendDigit,
  changeKind,
  changeKnocker,
  entryStateFromHand,
  evaluateEntry,
  firstEditable,
  initialEntryState,
  isLocked,
  otherPlayer,
  removeLastDigit,
  setDeadwood,
  stepDeadwood,
  type EntryState,
} from '@/features/handEntry/handEntry';
import { useTextScale } from '@/features/scoreboard/useTextScale';
import type { HandKind, PlayerId } from '@/games/ginRummy/engine';
import { useGinHydrated, useGinStore } from '@/games/ginRummy/store';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, spacing, typography } from '@/theme';

/** Add a hand, or edit one when `handId` is given. */
export default function GinHandEntryScreen() {
  const hydrated = useGinHydrated();
  const { handId } = useLocalSearchParams<{ handId?: string }>();
  if (!hydrated) return <ScreenContainer>{null}</ScreenContainer>;
  return <HandEntryForm handId={handId} />;
}

function HandEntryForm({ handId }: { handId?: string }) {
  const game = useGinStore((s) => s.currentGame);
  const addHand = useGinStore((s) => s.addHand);
  const updateHand = useGinStore((s) => s.updateHand);
  const { isLandscape, sizeClass, isDense } = useResponsive();
  const scale = useTextScale();

  // Captured at mount: saving an edit can remove this hand from the store while we navigate back.
  const [editing] = useState(() => game?.hands.find((h) => h.id === handId) ?? null);
  const [entry, setEntry] = useState<EntryState>(() =>
    editing ? entryStateFromHand(editing) : initialEntryState(),
  );
  const [active, setActive] = useState<PlayerId>(() => firstEditable(entry));
  const [saveErrors, setSaveErrors] = useState<string[]>([]);
  const saved = useRef(false);

  if (!game || (handId && !editing)) return <Redirect href="/gin/scoreboard" />;

  const players = game.players;
  const priorHands = editing ? game.hands.slice(0, editing.number - 1) : game.hands;
  const evaluation = evaluateEntry(entry, players, priorHands);
  const twoColumn = isLandscape || sizeClass === 'expanded';
  const activeField: PlayerId = isLocked(entry, active) ? otherPlayer(active) : active;

  const update = (next: EntryState, nextActive?: PlayerId) => {
    setEntry(next);
    setSaveErrors([]);
    if (nextActive !== undefined) setActive(nextActive);
  };

  const onKnocker = (knocker: PlayerId) => {
    const next = changeKnocker(entry, knocker);
    update(next, firstEditable(next));
  };
  const onKind = (kind: HandKind) => {
    const next = changeKind(entry, kind);
    update(next, firstEditable(next));
  };

  const onDigit = (digit: string) =>
    update(setDeadwood(entry, activeField, appendDigit(entry.deadwood[activeField], digit)));
  const onBackspace = () =>
    update(setDeadwood(entry, activeField, removeLastDigit(entry.deadwood[activeField])));
  const onClear = () => update(setDeadwood(entry, activeField, ''));
  const onStep = (player: PlayerId, delta: number) =>
    update(setDeadwood(entry, player, stepDeadwood(entry.deadwood[player], delta)), player);

  const save = () => {
    if (evaluation.status !== 'ready' || saved.current) return;
    const run = () => {
      const result = editing ? updateHand(editing.id, evaluation.input) : addHand(evaluation.input);
      if (result.ok) {
        saved.current = true;
        router.back();
      } else {
        setSaveErrors(result.errors);
      }
    };
    if (editing && editing.number < game.hands.length) {
      Alert.alert(
        `Save changes to hand ${editing.number}?`,
        'Later hands are recalculated. If this changes who reaches 100, hands after the end of the game are removed.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Save', onPress: run },
        ],
      );
    } else {
      run();
    }
  };

  const selectedKind = HAND_KINDS.find((k) => k.kind === entry.kind);
  const title = editing ? `Edit hand ${editing.number}` : `Add hand ${game.hands.length + 1}`;

  const form = (
    <View style={styles.column}>
      <View style={isDense ? styles.pickerRow : styles.column}>
        <View style={styles.group}>
          {isDense ? null : <Text style={styles.label}>WHO WENT OUT?</Text>}
          <SegmentedControl
            accessibilityLabel="Who went out"
            options={[
              { value: 0, label: players[0] },
              { value: 1, label: players[1] },
            ]}
            value={entry.knocker}
            onChange={onKnocker}
          />
        </View>
        <View style={styles.group}>
          {isDense ? null : <Text style={styles.label}>HAND TYPE</Text>}
          <SegmentedControl
            accessibilityLabel="Hand type"
            options={HAND_KINDS.map((k) => ({ value: k.kind, label: k.label }))}
            value={entry.kind}
            onChange={onKind}
          />
          {isDense ? null : <Text style={styles.hint}>{selectedKind?.hint}</Text>}
        </View>
      </View>
      <View style={styles.fields}>
        {([0, 1] as const).map((player) => (
          <DeadwoodField
            key={player}
            name={players[player]}
            value={entry.deadwood[player]}
            active={activeField === player}
            locked={isLocked(entry, player)}
            onSelect={() => setActive(player)}
            onStep={(delta) => onStep(player, delta)}
            dense={isDense}
          />
        ))}
      </View>
      <HandPreview evaluation={evaluation} players={players} saveErrors={saveErrors} />
    </View>
  );

  const saveButton = (
    <Button
      label={editing ? 'Save changes' : 'Save hand'}
      onPress={save}
      disabled={evaluation.status !== 'ready'}
      style={isDense ? styles.headerSave : undefined}
    />
  );

  const input = (
    <View style={styles.column}>
      <Keypad onDigit={onDigit} onBackspace={onBackspace} onClear={onClear} />
      {isDense ? null : saveButton}
    </View>
  );

  return (
    <ScreenContainer scroll={!isDense} style={styles.container}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Cancel"
          hitSlop={8}
          style={styles.iconButton}
        >
          <Ionicons name="close" size={26} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { fontSize: scale(typography.heading.fontSize) }]}>
          {title}
        </Text>
        {isDense ? saveButton : null}
      </View>
      {isDense ? (
        // Short landscape: keep the keypad and Save on screen, let only the form scroll.
        <View style={styles.denseBody}>
          <ScrollView
            style={styles.denseForm}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {form}
          </ScrollView>
          {input}
        </View>
      ) : twoColumn ? (
        <View style={styles.twoColumn}>
          {form}
          {input}
        </View>
      ) : (
        <>
          {form}
          {input}
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontWeight: typography.heading.fontWeight, color: colors.textPrimary },
  headerSave: { minHeight: 40, paddingHorizontal: spacing.lg },
  denseBody: { flex: 1, flexDirection: 'row', gap: spacing.lg },
  denseForm: { flex: 1 },
  twoColumn: { flexDirection: 'row', gap: spacing.lg, alignItems: 'flex-start' },
  column: { flex: 1, gap: spacing.md },
  group: { flex: 1, gap: spacing.xs },
  pickerRow: { flexDirection: 'row', gap: spacing.md },
  label: { ...typography.label, color: colors.gold },
  hint: { ...typography.caption, color: colors.textSecondary },
  fields: { flexDirection: 'row', gap: spacing.md },
});
