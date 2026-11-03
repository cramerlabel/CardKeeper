import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, radius, spacing, typography } from '@/theme';

import { useTextScale } from '@/features/scoreboard/useTextScale';
import { formatValue, type BreakdownRow } from './summary';

interface ScoreBreakdownProps {
  players: readonly [string, string];
  rows: readonly BreakdownRow[];
  champion: 0 | 1 | null;
}

export function ScoreBreakdown({ players, rows, champion }: ScoreBreakdownProps) {
  const scale = useTextScale();
  const { isDense } = useResponsive();
  const body = isDense ? 14 : scale(typography.body.fontSize);
  const colStyle = (player: 0 | 1) => [styles.col, champion === player && styles.championCol];

  return (
    <Card style={[styles.card, isDense && styles.cardDense]}>
      <View style={styles.row}>
        <View style={styles.labelCell} />
        {([0, 1] as const).map((p) => (
          <View key={p} style={colStyle(p)}>
            <Text
              numberOfLines={1}
              style={[styles.playerName, { fontSize: scale(typography.caption.fontSize + 1) }]}
            >
              {players[p]}
            </Text>
          </View>
        ))}
      </View>
      {rows.map((row) => {
        const fontSize = row.emphasis
          ? isDense
            ? 22
            : scale(typography.heading.fontSize + 4)
          : body;
        return (
          <View
            key={row.key}
            style={[
              styles.row,
              styles.dataRow,
              isDense && styles.dataRowDense,
              row.emphasis && styles.finalRow,
              row.emphasis && isDense && styles.finalRowDense,
            ]}
            accessible
            accessibilityLabel={`${row.label}: ${players[0]} ${formatValue(row.values[0], row.plus)}, ${players[1]} ${formatValue(row.values[1], row.plus)}`}
          >
            <View style={[styles.labelCell, isDense && styles.cellDense]}>
              <Text
                style={[
                  styles.label,
                  {
                    fontSize: row.emphasis
                      ? isDense
                        ? 16
                        : scale(typography.bodyStrong.fontSize + 2)
                      : body,
                  },
                  row.emphasis && styles.labelEmphasis,
                ]}
              >
                {row.label}
              </Text>
              {row.detail && !isDense ? (
                <Text style={[styles.detail, { fontSize: scale(typography.caption.fontSize - 1) }]}>
                  {row.detail}
                </Text>
              ) : null}
            </View>
            {([0, 1] as const).map((p) => (
              <View key={p} style={[...colStyle(p), isDense && styles.cellDense]}>
                <Text
                  style={[
                    styles.value,
                    { fontSize },
                    row.emphasis && styles.valueEmphasis,
                    row.emphasis && champion === p && styles.valueChampion,
                    row.plus && row.values[p] === 0 && styles.valueMuted,
                  ]}
                >
                  {formatValue(row.values[p], row.plus)}
                </Text>
              </View>
            ))}
          </View>
        );
      })}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: 0 },
  cardDense: { padding: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'stretch' },
  dataRow: {
    minHeight: 52,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  dataRowDense: { minHeight: 32 },
  finalRowDense: { minHeight: 40 },
  cellDense: { paddingVertical: spacing.xs },
  finalRow: { borderTopWidth: 2, borderTopColor: colors.border },
  labelCell: {
    flex: 1.3,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingRight: spacing.sm,
  },
  col: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm },
  championCol: { backgroundColor: colors.surfaceRaised },
  playerName: {
    color: colors.textPrimary,
    fontWeight: '700',
    paddingHorizontal: spacing.xs,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  label: { color: colors.textPrimary, fontWeight: '500' },
  labelEmphasis: { fontWeight: '800' },
  detail: { color: colors.textSecondary },
  value: { color: colors.textPrimary, fontWeight: '600', fontVariant: ['tabular-nums'] },
  valueMuted: { color: colors.textSecondary },
  valueEmphasis: { fontWeight: '800' },
  valueChampion: { color: colors.gold },
});
