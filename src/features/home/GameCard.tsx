import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { formatPlayerCount } from '@/games/playerCount';
import type { GameDefinition } from '@/games/types';
import { colors, radius, spacing, typography } from '@/theme';

interface GameCardProps {
  game: GameDefinition;
  onPress: (game: GameDefinition) => void;
}

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export function GameCard({ game, onPress }: GameCardProps) {
  const players = formatPlayerCount(game.playerCount);
  const label = `${game.name}, ${players}. ${game.description}${game.available ? '' : ' Coming soon.'}`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={game.available ? `Opens ${game.name}` : undefined}
      accessibilityState={{ disabled: !game.available }}
      disabled={!game.available}
      onPress={() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(game);
      }}
      style={({ pressed }) => [
        styles.pressable,
        pressed && styles.pressed,
        !game.available && styles.dimmed,
      ]}
    >
      <Card style={[styles.card, !game.available && styles.flat]}>
        <View style={styles.top}>
          <View style={styles.iconBadge}>
            <MaterialCommunityIcons
              name={game.icon as IconName}
              size={30}
              color={game.available ? colors.gold : colors.textSecondary}
            />
          </View>
          <View style={styles.text}>
            <Text style={styles.name}>{game.name}</Text>
            <Text style={styles.description}>{game.description}</Text>
          </View>
        </View>
        <View style={styles.footer}>
          <View style={styles.chip}>
            <MaterialCommunityIcons
              name="account-multiple"
              size={14}
              color={colors.textSecondary}
            />
            <Text style={styles.chipText}>{players}</Text>
          </View>
          {!game.available && (
            <View style={[styles.chip, styles.soonChip]}>
              <Text style={[styles.chipText, styles.soonText]}>Coming soon</Text>
            </View>
          )}
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: { flex: 1, minHeight: 48 },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
  dimmed: { opacity: 0.5 },
  // Android draws elevation shadows as a rectangle when the parent is translucent.
  flat: { elevation: 0, shadowOpacity: 0 },
  card: { flex: 1, justifyContent: 'space-between', gap: spacing.md },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.feltDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1 },
  name: { ...typography.heading, color: colors.textPrimary },
  description: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  footer: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.feltDark,
  },
  chipText: { ...typography.caption, color: colors.textSecondary },
  soonChip: { backgroundColor: colors.gold },
  soonText: { color: colors.textOnAccent, fontWeight: '700' },
});
