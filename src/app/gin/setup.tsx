import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useRef, useState, type Ref } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import {
  MAX_NAME_LENGTH,
  defaultName,
  loadLastNames,
  saveLastNames,
  validateNames,
} from '@/features/setup/playerNames';
import { selectHasSavedGame, useGinHydrated, useGinStore } from '@/games/ginRummy/store';
import { colors, radius, spacing, typography } from '@/theme';

interface NameFieldProps extends Pick<TextInputProps, 'returnKeyType' | 'onSubmitEditing'> {
  label: string;
  value: string;
  placeholder: string;
  error: string | null;
  onChangeText: (text: string) => void;
  inputRef?: Ref<TextInputInstance>;
}

function NameField({ label, value, placeholder, error, inputRef, ...input }: NameFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        ref={inputRef}
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        maxLength={MAX_NAME_LENGTH}
        autoCapitalize="words"
        autoCorrect={false}
        selectionColor={colors.gold}
        accessibilityLabel={label}
        accessibilityHint={`Leave empty to use ${placeholder}`}
        style={[styles.input, error ? styles.inputError : null]}
        {...input}
      />
      {error ? (
        <Text style={styles.error} accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

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
        <Text style={styles.title}>New Gin Rummy game</Text>
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
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase' },
  input: {
    ...typography.body,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.feltDark,
    color: colors.textPrimary,
  },
  inputError: { borderColor: colors.danger },
  error: { ...typography.caption, color: colors.danger },
  actions: { gap: spacing.md },
});
