import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  View,
  type TextInputInstance,
} from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { SegmentedControl } from '@/components/SegmentedControl';
import { openRules } from '@/features/rules/openRules';
import {
  buildSetup,
  describeGameLength,
  normalizeDealerChoice,
  type CribbageTarget,
  type FirstDealerChoice,
} from '@/features/setup/cribbageSetup';
import { DealerChips } from '@/features/setup/DealerChips';
import { NameField } from '@/features/setup/NameField';
import {
  CRIBBAGE_NAMES_STORAGE_KEY,
  defaultName,
  loadLastNameList,
  saveLastNameList,
  validateNameList,
} from '@/features/setup/playerNames';
import type { PlayerCount } from '@/games/cribbage/engine';
import { selectHasSavedGame, useCribbageHydrated, useCribbageStore } from '@/games/cribbage/store';
import { MEDIUM_MIN_WIDTH, useResponsive } from '@/hooks/useResponsive';
import { colors, spacing, typography } from '@/theme';

const PLAYER_OPTIONS = [
  { value: 2, label: '2 players' },
  { value: 3, label: '3 players' },
] as const;

const LENGTH_OPTIONS = [
  { value: 121, label: '121 (standard)' },
  { value: 61, label: '61 (short)' },
] as const;

const MAX_PLAYERS = 3;

export default function CribbageSetupScreen() {
  const hydrated = useCribbageHydrated();
  const startGame = useCribbageStore((s) => s.startGame);
  const { width, isLandscape } = useResponsive();
  const sideBySide = isLandscape && width >= MEDIUM_MIN_WIDTH;

  const [playerCount, setPlayerCount] = useState<PlayerCount>(2);
  // Text for every possible player is kept so switching 2 <-> 3 players never loses what was typed.
  const [rawNames, setRawNames] = useState<string[]>(() => Array<string>(MAX_PLAYERS).fill(''));
  const [target, setTarget] = useState<CribbageTarget>(121);
  const [dealer, setDealer] = useState<FirstDealerChoice>('random');
  const inputRefs = useRef<(TextInputInstance | null)[]>([]);
  const edited = useRef(false);

  // Prefill with the last-used players unless the user has already started changing things.
  useEffect(() => {
    let active = true;
    void loadLastNameList(AsyncStorage, CRIBBAGE_NAMES_STORAGE_KEY).then((saved) => {
      if (!active || !saved || edited.current) return;
      setPlayerCount(saved.length as PlayerCount);
      setRawNames(Array.from({ length: MAX_PLAYERS }, (_, i) => saved[i] ?? ''));
    });
    return () => {
      active = false;
    };
  }, []);

  const names = rawNames.slice(0, playerCount);
  const { valid, errors, names: effectiveNames } = validateNameList(names);

  const begin = () => {
    // Resolved here, not on render, so "Random" is drawn when the game actually starts.
    const setup = buildSetup({ names, target, dealer });
    if (!setup.valid) return;
    const result = startGame({
      names: setup.names,
      target: setup.target,
      firstDealer: setup.firstDealer,
    });
    if (!result.ok) {
      Alert.alert('Couldn\u2019t start game', result.errors.join('\n'));
      return;
    }
    void saveLastNameList(
      names.map((name) => name.trim()),
      AsyncStorage,
      CRIBBAGE_NAMES_STORAGE_KEY,
    );
    router.replace('/cribbage/board' as never);
  };

  const submit = () => {
    if (!valid || !hydrated) return;
    // Read at press time so a game saved after this screen opened is still caught.
    if (selectHasSavedGame(useCribbageStore.getState())) {
      Alert.alert(
        'Replace saved game?',
        'Starting a new game will delete the Cribbage game in progress. This can\u2019t be undone.',
        [
          { text: 'Keep saved game', style: 'cancel' },
          { text: 'Start new game', style: 'destructive', onPress: begin },
        ],
      );
      return;
    }
    begin();
  };

  const changePlayerCount = (count: PlayerCount) => {
    edited.current = true;
    setPlayerCount(count);
    setDealer((current) => normalizeDealerChoice(current, count));
  };

  const changeName = (index: number) => (text: string) => {
    edited.current = true;
    setRawNames((current) => current.map((name, i) => (i === index ? text : name)));
  };

  const changeTarget = (value: CribbageTarget) => {
    edited.current = true;
    setTarget(value);
  };

  const changeDealer = (value: FirstDealerChoice) => {
    edited.current = true;
    setDealer(value);
  };

  const columnStyle = sideBySide ? styles.column : null;

  return (
    <KeyboardAvoidingView style={styles.avoider} behavior="padding">
      <ScreenContainer scroll style={styles.container}>
        <Text style={styles.title} accessibilityRole="header">
          New Cribbage game
        </Text>
        <View style={[styles.sections, sideBySide && styles.sectionsRow]}>
          <Card style={[styles.card, columnStyle]}>
            <Text style={styles.sectionLabel}>Players</Text>
            <SegmentedControl
              options={PLAYER_OPTIONS}
              value={playerCount}
              onChange={changePlayerCount}
              accessibilityLabel="Number of players"
            />
            {names.map((name, index) => {
              const last = index === names.length - 1;
              return (
                <NameField
                  key={index}
                  label={`Player ${index + 1}`}
                  value={name}
                  placeholder={defaultName(index)}
                  error={errors[index]}
                  inputRef={(input) => {
                    inputRefs.current[index] = input;
                  }}
                  onChangeText={changeName(index)}
                  returnKeyType={last ? 'done' : 'next'}
                  onSubmitEditing={last ? submit : () => inputRefs.current[index + 1]?.focus()}
                />
              );
            })}
          </Card>
          <Card style={[styles.card, columnStyle]}>
            <Text style={styles.sectionLabel}>Game length</Text>
            <SegmentedControl
              options={LENGTH_OPTIONS}
              value={target}
              onChange={changeTarget}
              accessibilityLabel="Game length"
            />
            <Text style={styles.caption}>{describeGameLength(target)}</Text>
            <Text style={styles.sectionLabel}>First dealer</Text>
            <DealerChips players={effectiveNames} value={dealer} onChange={changeDealer} />
          </Card>
        </View>
        <View style={styles.actions}>
          <Button label="Start game" onPress={submit} disabled={!valid || !hydrated} />
          <View style={styles.secondaryActions}>
            <Button
              label="How to play"
              variant="secondary"
              style={styles.secondaryButton}
              onPress={() => openRules('cribbage')}
            />
            <Button
              label="Back"
              variant="secondary"
              style={styles.secondaryButton}
              onPress={() => router.back()}
            />
          </View>
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  avoider: { flex: 1, backgroundColor: colors.felt },
  container: { justifyContent: 'center', gap: spacing.lg },
  title: { ...typography.title, color: colors.textPrimary },
  sections: { gap: spacing.lg },
  sectionsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  column: { flex: 1 },
  card: { gap: spacing.md },
  sectionLabel: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase' },
  caption: { ...typography.caption, color: colors.textSecondary },
  actions: { gap: spacing.md },
  secondaryActions: { flexDirection: 'row', gap: spacing.md },
  secondaryButton: { flex: 1 },
});
