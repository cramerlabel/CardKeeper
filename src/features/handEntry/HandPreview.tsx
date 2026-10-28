import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useResponsive } from '@/hooks/useResponsive';
import { useTextScale } from '@/features/scoreboard/useTextScale';
import { colors, radius, spacing, typography } from '@/theme';

import type { Evaluation } from './handEntry';

interface HandPreviewProps {
  evaluation: Evaluation;
  players: readonly [string, string];
  /** Errors returned by the store when saving failed. */
  saveErrors?: readonly string[];
}

export function HandPreview({ evaluation, players, saveErrors = [] }: HandPreviewProps) {
  const scale = useTextScale();
  const { isDense } = useResponsive();
  const size = scale(typography.bodyStrong.fontSize);

  let tone: 'neutral' | 'ok' | 'error' = 'neutral';
  const lines: string[] = [];
  let note: string | null = null;

  if (saveErrors.length > 0) {
    tone = 'error';
    lines.push(...saveErrors);
  } else if (evaluation.status === 'invalid') {
    tone = 'error';
    lines.push(...evaluation.errors);
  } else if (evaluation.status === 'incomplete') {
    lines.push(`Enter deadwood for ${evaluation.missing.map((p) => players[p]).join(' and ')}`);
  } else {
    tone = 'ok';
    lines.push(evaluation.message);
    if (evaluation.endsGame)
      note = `${players[evaluation.result.winner]} reaches 100 and wins the game`;
  }

  const color =
    tone === 'error' ? colors.danger : tone === 'ok' ? colors.gold : colors.textSecondary;
  const icon =
    tone === 'error'
      ? 'alert-circle'
      : tone === 'ok'
        ? 'checkmark-circle'
        : 'information-circle-outline';

  return (
    <View
      style={[
        styles.box,
        { minHeight: size * 1.35 * (isDense ? 1 : 2) + spacing.md * 2 + 2 },
        tone === 'error' && styles.boxError,
        tone === 'ok' && styles.boxOk,
      ]}
      accessibilityRole={tone === 'error' ? 'alert' : 'summary'}
      accessibilityLiveRegion="polite"
    >
      <Ionicons name={icon} size={scale(22)} color={color} />
      <View style={styles.texts}>
        {lines.map((line) => (
          <Text
            key={line}
            style={[styles.line, { fontSize: size, lineHeight: size * 1.35, color }]}
          >
            {line}
          </Text>
        ))}
        {note ? (
          <Text style={[styles.note, { fontSize: scale(typography.caption.fontSize) }]}>
            {note}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    minHeight: 56,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.feltDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boxError: { borderColor: colors.danger },
  boxOk: { borderColor: colors.gold },
  texts: { flex: 1, gap: spacing.xxs },
  line: { fontWeight: '700' },
  note: { color: colors.textSecondary, fontWeight: '500' },
});
