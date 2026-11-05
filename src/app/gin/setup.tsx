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
import { openRules } from '@/features/rules/openRules';
import { NameField } from '@/features/setup/NameField';
import {
  defaultName,
  loadLastNames,
  saveLastNames,
  validateNames,
} from '@/features/setup/playerNames';
import { selectHasSavedGame, useGinHydrated, useGinStore } from '@/games/ginRummy/store';
import { colors, spacing, typography } from '@/theme';

export default function GinSetupScreen() {
  const hydrated = useGinHydrated();
  const startGame = useGinStore((s) => s.startGame);
  const [first, setFirst] = useState('');
  const [second, setSecond] = useState('');
  const secondRef = useRef<TextInputInstance>(null);
  const edited = useRef(false);

  // Prefill with the last-used names unless the user has already started typing.
  useEffect(() => {
    let active = true;
    void loadLastNames(AsyncStorage).then((names) => {
      if (!active || !names || edited.current) return;
      setFirst(names[0]);
      setSecond(names[1]);
    });
    return () => {
      active = false;
    };
  }, []);

  const { valid, errors, names } = validateNames([first, second]);

  const begin = () => {
    startGame(names);
    void saveLastNames([first.trim(), second.trim()], AsyncStorage);
    router.replace('/gin/scoreboard' as never);
  };

  const submit = () => {
    if (!valid || !hydrated) return;
    // Read at press time so a game saved after this screen opened is still caught.
    if (selectHasSavedGame(useGinStore.getState())) {
      Alert.alert(
        'Replace saved game?',
        'Starting a new game will delete the Gin Rummy game in progress. This can\u2019t be undone.',
        [
          { text: 'Keep saved game', style: 'cancel' },
          { text: 'Start new game', style: 'destructive', onPress: begin },
        ],
      );
      return;
    }
    begin();
  };

  const change = (set: (text: string) => void) => (text: string) => {
    edited.current = true;
    set(text);
  };

  return (
    <KeyboardAvoidingView style={styles.avoider} behavior="padding">
      <ScreenContainer scroll style={styles.container}>
        <Text style={styles.title} accessibilityRole="header">
          New Gin Rummy game
        </Text>
        <Card style={styles.card}>
          <NameField
            label="Player 1"
            value={first}
            placeholder={defaultName(0)}
            error={errors[0]}
            onChangeText={change(setFirst)}
            returnKeyType="next"
            onSubmitEditing={() => secondRef.current?.focus()}
          />
          <NameField
            label="Player 2"
            value={second}
            placeholder={defaultName(1)}
            error={errors[1]}
            inputRef={secondRef}
            onChangeText={change(setSecond)}
            returnKeyType="done"
            onSubmitEditing={submit}
          />
        </Card>
        <View style={styles.actions}>
          <Button label="Start game" onPress={submit} disabled={!valid || !hydrated} />
          <Button label="How to play" variant="secondary" onPress={() => openRules('ginRummy')} />
          <Button label="Back" variant="secondary" onPress={() => router.back()} />
        </View>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  avoider: { flex: 1, backgroundColor: colors.felt },
  container: { justifyContent: 'center', gap: spacing.lg },
  title: { ...typography.title, color: colors.textPrimary },
  card: { gap: spacing.lg },
  actions: { gap: spacing.md },
});
