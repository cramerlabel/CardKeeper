import { memo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { colors, spacing, typography } from '@/theme';

import type { HistoryRow } from './history';
import { useTextScale } from './useTextScale';

interface HandHistoryProps {
  /** Rows in play order (oldest first); shown newest first. */
  rows: readonly HistoryRow[];
  players: readonly [string, string];
  onSelectHand: (id: string) => void;
}

interface RowViewProps {
  row: HistoryRow;
  fontSize: number;
  players: readonly [string, string];
  onSelectHand: (id: string) => void;
}

const RowView = memo(function RowView({ row, fontSize, players, onSelectHand }: RowViewProps) {
  return (
    <Pressable
      onPress={() => onSelectHand(row.id)}
      accessibilityRole="button"
      accessibilityLabel={`Hand ${row.number}: ${row.winnerName} wins ${row.points} points by ${row.outcomeLabel}. Deadwood ${players[0]} ${row.deadwood[0]}, ${players[1]} ${row.deadwood[1]}. Totals ${row.totals[0]} to ${row.totals[1]}.`}
      accessibilityHint="Opens this hand for editing"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <Text style={[styles.number, { fontSize, width: fontSize * 2 }]}>{row.number}</Text>
      <View style={styles.winnerCell}>
        <Text numberOfLines={1} style={[styles.winner, { fontSize }]}>
          {row.winnerName}
        </Text>
        <Text
          style={[
            styles.outcome,
            { fontSize: fontSize - 2 },
            row.outcome === 'undercut' && styles.undercut,
          ]}
        >
          {row.outcomeLabel}
        </Text>
      </View>
      <Text style={[styles.deadwood, { fontSize }]}>
        {row.deadwood[0]} – {row.deadwood[1]}
      </Text>
      <Text style={[styles.points, { fontSize }]}>+{row.points}</Text>
      <Text style={[styles.total, { fontSize }]}>
        <Text style={row.winner === 0 ? styles.totalWinner : undefined}>{row.totals[0]}</Text>
        {' – '}
        <Text style={row.winner === 1 ? styles.totalWinner : undefined}>{row.totals[1]}</Text>
      </Text>
    </Pressable>
  );
});

export function HandHistory({ rows, players, onSelectHand }: HandHistoryProps) {
  const scale = useTextScale();
  const fontSize = scale(typography.body.fontSize);
  const labelSize = scale(typography.label.fontSize);
  const data = [...rows].reverse();

  return (
    <Card style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { fontSize: scale(typography.heading.fontSize) }]}>Hands</Text>
        {rows.length > 0 ? (
          <Text style={[styles.legend, { fontSize: scale(typography.caption.fontSize) }]}>
            {players[0]} – {players[1]}
          </Text>
        ) : null}
      </View>
      {rows.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, { fontSize: scale(typography.heading.fontSize) }]}>
            No hands yet
          </Text>
          <Text style={[styles.emptyBody, { fontSize }]}>
            Tap “Add hand” when the first hand ends. Scores will appear here.
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.number,
                styles.headerText,
                { fontSize: labelSize, width: fontSize * 2 },
              ]}
            >
              #
            </Text>
            <Text style={[styles.winnerCell, styles.headerText, { fontSize: labelSize }]}>
              WINNER
            </Text>
            <Text
              numberOfLines={1}
              adjustsFontSizeToFit
              style={[styles.deadwood, styles.headerText, { fontSize: labelSize }]}
            >
              DEADWOOD
            </Text>
            <Text style={[styles.points, styles.headerText, { fontSize: labelSize }]}>PTS</Text>
            <Text style={[styles.total, styles.headerText, { fontSize: labelSize }]}>TOTAL</Text>
          </View>
          <FlatList
            data={data}
            keyExtractor={(row) => row.id}
            renderItem={({ item }) => (
              <RowView
                row={item}
                fontSize={fontSize}
                players={players}
                onSelectHand={onSelectHand}
              />
            )}
            ItemSeparatorComponent={Separator}
            showsVerticalScrollIndicator={false}
          />
        </>
      )}
    </Card>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  card: { flex: 1, padding: spacing.md, gap: spacing.sm },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  title: { fontWeight: typography.heading.fontWeight, color: colors.textPrimary },
  legend: { flexShrink: 1, color: colors.textSecondary },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerText: {
    color: colors.textSecondary,
    fontWeight: typography.label.fontWeight,
    letterSpacing: typography.label.letterSpacing,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
    borderRadius: 8,
  },
  pressed: { backgroundColor: colors.surfaceRaised },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    opacity: 0.6,
  },
  number: { color: colors.textSecondary, fontVariant: ['tabular-nums'] },
  winnerCell: { flex: 1, paddingRight: spacing.xs },
  winner: { color: colors.textPrimary, fontWeight: typography.bodyStrong.fontWeight },
  outcome: { color: colors.textSecondary },
  undercut: { color: colors.gold, fontWeight: '700' },
  deadwood: {
    width: '22%',
    textAlign: 'center',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  points: {
    width: '14%',
    textAlign: 'right',
    color: colors.success,
    fontWeight: typography.bodyStrong.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  total: {
    width: '24%',
    textAlign: 'right',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  totalWinner: { color: colors.textPrimary, fontWeight: '700' },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.lg,
  },
  emptyTitle: { fontWeight: typography.heading.fontWeight, color: colors.textPrimary },
  emptyBody: { textAlign: 'center', color: colors.textSecondary },
});
