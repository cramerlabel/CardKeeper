import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useTextScale } from '@/features/scoreboard/useTextScale';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, radius, spacing, typography } from '@/theme';

import { WINS_NOTE, type ScoreMessage } from './scoreEntry';

interface PointsReadoutProps {
  /** Typed points; '' shows a dash. */
  pointsText: string;
  message: ScoreMessage;
}

/** Large points readout next to the live preview, validation or save errors. */
export function PointsReadout({ pointsText, message }: PointsReadoutProps) {
  const scale = useTextScale();
  const { isDense } = useResponsive();
  const { tone, lines, notes } = message;
  const size = scale(typography.bodyStrong.fontSize);

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
        isDense && styles.boxDense,
        tone === 'error' && styles.boxError,
        tone === 'ok' && styles.boxOk,
      ]}
      accessibilityRole={tone === 'error' ? 'alert' : 'summary'}
      accessibilityLiveRegion="polite"
    >
      <View
        style={styles.readout}
        accessible
        accessibilityLabel={`Points: ${pointsText === '' ? 'none entered' : pointsText}`}
      >
        <Text
          maxFontSizeMultiplier={1.2}
          style={[
            styles.points,
            { fontSize: scale(32), lineHeight: scale(38) },
            pointsText === '' && styles.placeholder,
          ]}
        >
          {pointsText === '' ? '–' : pointsText}
        </Text>
        <Text maxFontSizeMultiplier={1.2} style={[styles.unit, { fontSize: scale(11) }]}>
          pts
        </Text>
      </View>
      <View style={styles.texts}>
        {lines.map((line) => (
          <View key={line} style={styles.lineRow}>
            <Ionicons name={icon} size={scale(18)} color={color} />
            <Text
              maxFontSizeMultiplier={1.3}
              style={[styles.line, { fontSize: size, lineHeight: size * 1.3, color }]}
            >
              {line}
            </Text>
          </View>
        ))}
        {notes.map((note) => (
          <Text
            key={note}
            maxFontSizeMultiplier={1.3}
            style={[
              styles.note,
              { fontSize: scale(typography.caption.fontSize) },
              note === WINS_NOTE && styles.win,
            ]}
          >
            {note}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: 56,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.feltDark,
    borderWidth: 1,
    borderColor: colors.border,
  },
  boxDense: { minHeight: 48, paddingVertical: 0 },
  boxError: { borderColor: colors.danger },
  boxOk: { borderColor: colors.gold },
  readout: {
    minWidth: 64,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 2,
  },
  points: { color: colors.textPrimary, fontWeight: '800', fontVariant: ['tabular-nums'] },
  placeholder: { color: colors.textSecondary },
  unit: { color: colors.textSecondary, fontWeight: '700' },
  texts: { flex: 1, gap: spacing.xxs },
  lineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs },
  line: { flex: 1, fontWeight: '700' },
  note: { color: colors.textSecondary, fontWeight: '600' },
  win: { color: colors.gold, fontWeight: '800' },
});
