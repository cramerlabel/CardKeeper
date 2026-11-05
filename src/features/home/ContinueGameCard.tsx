import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Fragment } from 'react';
import { Alert, StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { formatNameList } from '@/features/home/savedGames';
import { colors, spacing, typography } from '@/theme';

interface ContinueGameCardProps {
  gameName: string;
  /** 2–3 players; `totals` is in the same order. */
  players: readonly string[];
  totals: readonly number[];
  /** Short progress text such as "3 hands played". */
  progressLabel: string;
  onContinue: () => void;
  onDiscard: () => void;
}

export function ContinueGameCard({
  gameName,
  players,
  totals,
  progressLabel,
  onContinue,
  onDiscard,
}: ContinueGameCardProps) {
  // Side-by-side buttons don't fit once the system font is enlarged.
  const stackActions = useWindowDimensions().fontScale > 1.25;

  const confirmDiscard = () =>
    Alert.alert(
      'Discard game?',
      `The in-progress ${gameName} game between ${formatNameList(players)} will be deleted. This can't be undone.`,
      [
        { text: 'Keep game', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onDiscard },
      ],
    );

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="play-circle-outline" size={18} color={colors.gold} />
        <Text style={styles.label}>CONTINUE GAME</Text>
      </View>
      <Text style={styles.title}>{gameName}</Text>
      <View
        style={styles.scoreRow}
        accessible
        accessibilityLabel={`${players.map((p, i) => `${p} ${totals[i]}`).join(', ')}. ${progressLabel}.`}
      >
        {players.map((name, i) => (
          <Fragment key={i}>
            {i > 0 && players.length === 2 && <Text style={styles.vs}>vs</Text>}
            <View style={styles.player}>
              <Text style={styles.playerName} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.score}>{totals[i]}</Text>
            </View>
          </Fragment>
        ))}
      </View>
      <Text style={styles.meta}>{progressLabel}</Text>
      <View style={[styles.actions, stackActions && styles.actionsStacked]}>
        <Button
          label="Continue"
          onPress={onContinue}
          style={stackActions ? undefined : styles.action}
        />
        <Button
          label="Discard"
          variant="secondary"
          onPress={confirmDiscard}
          style={stackActions ? undefined : styles.action}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surfaceRaised, borderColor: colors.gold, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { ...typography.label, color: colors.gold },
  title: { ...typography.heading, color: colors.textPrimary },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  player: { flex: 1, alignItems: 'center' },
  playerName: { ...typography.caption, color: colors.textSecondary },
  score: { ...typography.title, color: colors.cream },
  vs: { ...typography.caption, color: colors.textSecondary },
  meta: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  actionsStacked: { flexDirection: 'column' },
  action: { flex: 1 },
});
