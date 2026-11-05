import type { Ref } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputInstance,
  type TextInputProps,
} from 'react-native';

import { MAX_NAME_LENGTH } from '@/features/setup/playerNames';
import { colors, radius, spacing, typography } from '@/theme';

interface NameFieldProps extends Pick<TextInputProps, 'returnKeyType' | 'onSubmitEditing'> {
  label: string;
  value: string;
  placeholder: string;
  error: string | null;
  onChangeText: (text: string) => void;
  inputRef?: Ref<TextInputInstance>;
}

export function NameField({
  label,
  value,
  placeholder,
  error,
  inputRef,
  ...input
}: NameFieldProps) {
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

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary, textTransform: 'uppercase' },
  input: {
    ...typography.body,
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.feltDark,
    color: colors.textPrimary,
  },
  inputError: { borderColor: colors.danger },
  error: { ...typography.caption, color: colors.danger },
});
