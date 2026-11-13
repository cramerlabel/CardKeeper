import { memo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { laneColor } from '@/features/cribbageBoard/laneColors';
import { useTextScale } from '@/features/scoreboard/useTextScale';
import { colors, spacing, typography } from '@/theme';

import type { HistoryListItem, HistoryRow, HistorySection } from './history';
import { flattenHistory } from './history';

interface CribbageHistoryProps {
  /** From `buildHistorySections`: newest deal first. */
  sections: readonly HistorySection[];
  onSelectScore: (id: string) => void;
}

interface RowViewProps {
  row: HistoryRow;
  fontSize: number;
  onSelectScore: (id: string) => void;
}

const RowView = memo(function RowView({ row, fontSize, onSelectScore }: RowViewProps) {
  return (
    <Pressable
      onPress={() => onSelectScore(row.id)}
      accessibilityRole="button"
      accessibilityLabel={`${row.description}. ${row.playerName} now has ${row.total}.`}
      accessibilityHint="Opens this score for editing"
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View
        style={[styles.swatch, { backgroundColor: laneColor(row.player) }]}
        importantForAccessibility="no-hide-descendants"
      />
      <View style={styles.who}>
        <Text maxFontSizeMultiplier={1.2} numberOfLines={1} style={[styles.player, { fontSize }]}>
          {row.playerName}
        </Text>
        <Text
          maxFontSizeMultiplier={1.2}
          numberOfLines={1}
          style={[styles.kind, { fontSize: fontSize - 2 }]}
        >
          {row.kindLabel}
        </Text>
      </View>
      <Text maxFontSizeMultiplier={1.2} style={[styles.points, { fontSize }]}>
        +{row.points}
      </Text>
      <Text maxFontSizeMultiplier={1.2} style={[styles.total, { fontSize }]}>
        {row.total}
      </Text>
    </Pressable>
  );
});

/** Scores grouped under "Deal N" headers, newest first; tapping a score opens it for editing. */
export function CribbageHistory({ sections, onSelectScore }: CribbageHistoryProps) {
  const scale = useTextScale();
  const fontSize = scale(typography.body.fontSize);
  const captionSize = scale(typography.caption.fontSize);
  const items = flattenHistory(sections);
  const currentDeal = sections.find((section) => section.isCurrent)?.deal;

  const renderItem = ({ item }: { item: HistoryListItem }) => {
    if (item.type === 'row') {
      return <RowView row={item.row} fontSize={fontSize} onSelectScore={onSelectScore} />;
    }
    if (item.type === 'empty') {
      return (
        <Text maxFontSizeMultiplier={1.2} style={[styles.empty, { fontSize: captionSize }]}>
          No scores yet this deal.
        </Text>
      );
    }
    const { deal, dealerName } = item.section;
    return (
      <View style={styles.header} accessibilityRole="header">
        <Text maxFontSizeMultiplier={1.2} style={[styles.headerText, { fontSize: captionSize }]}>
          DEAL {deal}
        </Text>
        <Text
          maxFontSizeMultiplier={1.2}
          numberOfLines={1}
          style={[styles.dealer, { fontSize: captionSize }]}
        >
          {dealerName} {deal === currentDeal ? 'deals' : 'dealt'}
        </Text>
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      <FlatList
        data={items}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerText: {
    color: colors.gold,
    fontWeight: typography.label.fontWeight,
    letterSpacing: typography.label.letterSpacing,
  },
  dealer: { flexShrink: 1, color: colors.textSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
    paddingHorizontal: spacing.xs,
    borderRadius: 8,
  },
  pressed: { backgroundColor: colors.surfaceRaised },
  swatch: { width: 10, height: 10, borderRadius: 5 },
  who: { flex: 1 },
  player: { color: colors.textPrimary, fontWeight: typography.bodyStrong.fontWeight },
  kind: { color: colors.textSecondary },
  points: {
    minWidth: 40,
    textAlign: 'right',
    color: colors.success,
    fontWeight: typography.bodyStrong.fontWeight,
    fontVariant: ['tabular-nums'],
  },
  total: {
    minWidth: 44,
    textAlign: 'right',
    color: colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  empty: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xs,
    color: colors.textSecondary,
  },
});
