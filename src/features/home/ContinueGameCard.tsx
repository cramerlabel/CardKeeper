import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { colors, spacing, typography } from '@/theme';

interface ContinueGameCardProps {
  gameName: string;
  players: readonly [string, string];
  totals: readonly [number, number];
  handCount: number;
  onContinue: () => void;
  onDiscard: () => void;
}

export function ContinueGameCard({
  gameName,
  players,
  totals,
  handCount,
  onContinue,
  onDiscard,
}: ContinueGameCardProps) {
  const confirmDiscard = () =>
    Alert.alert(
      'Discard game?',
      `The in-progress ${gameName} game between ${players[0]} and ${players[1]} will be deleted. This can't be undone.`,
      [
        { text: 'Keep game', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onDiscard },
      ],
    );

  const handsLabel = `${handCount} ${handCount === 1 ? 'hand' : 'hands'} played`;

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
        accessibilityLabel={`${players[0]} ${totals[0]}, ${players[1]} ${totals[1]}. ${handsLabel}.`}
      >
        <View style={styles.player}>
          <Text style={styles.playerName} numberOfLines={1}>
            {players[0]}
          </Text>
          <Text style={styles.score}>{totals[0]}</Text>
        </View>
        <Text style={styles.vs}>vs</Text>
        <View style={styles.player}>
          <Text style={styles.playerName} numberOfLines={1}>
            {players[1]}
          </Text>
          <Text style={styles.score}>{totals[1]}</Text>
        </View>
      </View>
      <Text style={styles.meta}>{handsLabel}</Text>
      <View style={styles.actions}>
        <Button label="Continue" onPress={onContinue} style={styles.action} />
        <Button
          label="Discard"
          variant="secondary"
          onPress={confirmDiscard}
          style={styles.action}
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
  action: { flex: 1 },
});
