import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { PressableScale } from '@/components/PressableScale';
import { formatPlayerCount } from '@/games/playerCount';
import type { GameDefinition } from '@/games/types';
import { colors, radius, spacing, typography } from '@/theme';
import { haptics } from '@/utils/haptics';

interface GameCardProps {
  game: GameDefinition;
  onPress: (game: GameDefinition) => void;
  onShowRules: (game: GameDefinition) => void;
}

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export function GameCard({ game, onPress, onShowRules }: GameCardProps) {
  const players = formatPlayerCount(game.playerCount);
  const label = `${game.name}, ${players}. ${game.description}${game.available ? '' : ' Coming soon.'}`;

  return (
    <View style={styles.wrapper}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={game.available ? `Opens ${game.name}` : undefined}
        accessibilityState={{ disabled: !game.available }}
        disabled={!game.available}
        onPress={() => {
          haptics.tap();
          onPress(game);
        }}
        pressedScale={0.97}
        pressedStyle={styles.pressed}
        style={[styles.pressable, !game.available && styles.dimmed]}
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
      </PressableScale>
      <Pressable
        onPress={() => {
          haptics.tap();
          onShowRules(game);
        }}
        accessibilityRole="button"
        accessibilityLabel={`How to play ${game.name}`}
        hitSlop={4}
        style={styles.rulesButton}
      >
        <MaterialCommunityIcons name="book-open-variant" size={18} color={colors.gold} />
        <Text style={styles.rulesText}>Rules</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  rulesButton: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.lg,
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.goldDark,
    backgroundColor: colors.feltDark,
  },
  rulesText: { ...typography.caption, color: colors.gold, fontWeight: '700' },
  pressable: { flex: 1, minHeight: 48 },
  pressed: { opacity: 0.85 },
  dimmed: { opacity: 0.5 },
  // Android draws elevation shadows as a rectangle when the parent is translucent.
  flat: { elevation: 0, shadowOpacity: 0 },
  card: {
    flex: 1,
    justifyContent: 'space-between',
    gap: spacing.md,
  },
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
  // Leaves room (and a 44pt row) for the Rules button, which is overlaid on the card's corner.
  footer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingRight: 110,
  },
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
