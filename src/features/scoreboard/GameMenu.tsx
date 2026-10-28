import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResponsive } from '@/hooks/useResponsive';
import { colors, radius, shadows, spacing, typography } from '@/theme';

export interface MenuAction {
  key: string;
  label: string;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

interface GameMenuProps {
  visible: boolean;
  actions: readonly MenuAction[];
  onClose: () => void;
}

/** Bottom-aligned action sheet; closes itself before running the chosen action. */
export function GameMenu({ visible, actions, onClose }: GameMenuProps) {
  const insets = useSafeAreaInsets();
  const { isLandscape } = useResponsive();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <Pressable
        style={[
          styles.backdrop,
          {
            paddingTop: insets.top + spacing.lg,
            paddingBottom: insets.bottom + spacing.lg,
            justifyContent: isLandscape ? 'center' : 'flex-end',
          },
        ]}
        onPress={onClose}
        accessibilityLabel="Close menu"
        accessibilityRole="button"
      >
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          {actions.map((action) => (
            <Pressable
              key={action.key}
              disabled={action.disabled}
              accessibilityRole="button"
              accessibilityState={{ disabled: !!action.disabled }}
              onPress={() => {
                onClose();
                action.onPress();
              }}
              style={({ pressed }) => [
                styles.item,
                pressed && styles.pressed,
                action.disabled && styles.disabled,
              ]}
            >
              <Text style={[styles.label, action.destructive && styles.destructive]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [styles.item, styles.cancel, pressed && styles.pressed]}
          >
            <Text style={[styles.label, styles.cancelLabel]}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  sheet: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing.sm,
    ...shadows.raised,
  },
  item: {
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
  },
  pressed: { backgroundColor: colors.surfaceRaised },
  disabled: { opacity: 0.4 },
  label: { ...typography.bodyStrong, color: colors.textPrimary },
  destructive: { color: colors.danger },
  cancel: {
    marginTop: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  cancelLabel: { color: colors.textSecondary },
});
