import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTextScale } from '@/features/scoreboard/useTextScale';
import { colors, radius, spacing, typography } from '@/theme';

interface DeadwoodFieldProps {
  name: string;
  /** Text to show; '' renders a placeholder. */
  value: string;
  active: boolean;
  locked: boolean;
  onSelect: () => void;
  onStep: (delta: number) => void;
  /** Hides the steppers and caption to save height. */
  dense?: boolean;
}

export function DeadwoodField({
  name,
  value,
  active,
  locked,
  onSelect,
  onStep,
  dense,
}: DeadwoodFieldProps) {
  const scale = useTextScale();
  const shown = locked ? '0' : value;

  return (
    <View style={[styles.field, active && styles.active, locked && styles.locked]}>
      <Pressable
        onPress={onSelect}
        disabled={locked}
        accessibilityRole="button"
        accessibilityLabel={`${name} deadwood`}
        accessibilityValue={{ text: locked ? '0, locked' : value === '' ? 'empty' : value }}
        accessibilityState={{ selected: active, disabled: locked }}
        style={styles.main}
      >
        <Text
          numberOfLines={1}
          style={[styles.name, { fontSize: scale(typography.caption.fontSize) }]}
        >
          {name}
        </Text>
        <Text
          style={[
            styles.value,
            dense
              ? { fontSize: 30, lineHeight: 34 }
              : { fontSize: scale(36), lineHeight: scale(42) },
            shown === '' && styles.placeholder,
          ]}
        >
          {shown === '' ? '–' : shown}
        </Text>
        {dense && !locked ? null : (
          <Text style={[styles.note, { fontSize: scale(11) }]}>
            {locked ? 'LOCKED AT 0' : 'DEADWOOD'}
          </Text>
        )}
      </Pressable>
      <View style={[styles.steppers, dense && styles.hidden]}>
        <Stepper
          icon="remove"
          label={`Decrease ${name} deadwood`}
          disabled={locked}
          onPress={() => onStep(-1)}
        />
        <Stepper
          icon="add"
          label={`Increase ${name} deadwood`}
          disabled={locked}
          onPress={() => onStep(1)}
        />
      </View>
    </View>
  );
}

interface StepperProps {
  icon: 'add' | 'remove';
  label: string;
  disabled: boolean;
  onPress: () => void;
}

function Stepper({ icon, label, disabled, onPress }: StepperProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [
        styles.stepper,
        pressed && styles.stepperPressed,
        disabled && styles.disabled,
      ]}
    >
      <Ionicons name={icon} size={22} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  active: { borderColor: colors.gold, backgroundColor: colors.surfaceRaised },
  locked: { opacity: 0.7 },
  main: { alignItems: 'center' },
  name: { color: colors.textPrimary, fontWeight: '700', maxWidth: '100%' },
  value: { color: colors.textPrimary, fontWeight: '800', fontVariant: ['tabular-nums'] },
  placeholder: { color: colors.textSecondary },
  note: { color: colors.textSecondary, fontWeight: '700', letterSpacing: 1 },
  steppers: { flexDirection: 'row', gap: spacing.sm },
  hidden: { display: 'none' },
  stepper: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.feltDark,
  },
  stepperPressed: { backgroundColor: colors.feltLight },
  disabled: { opacity: 0.4 },
});
