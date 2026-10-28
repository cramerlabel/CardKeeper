import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ScreenContainer } from '@/components/ScreenContainer';
import { games } from '@/games/registry';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, radius, spacing, typography } from '@/theme';

export default function HomeScreen() {
  const { sizeClass, isLandscape, width, height, scale } = useResponsive();
  const columns = sizeClass === 'compact' ? 1 : 2;

  return (
    <ScreenContainer scroll>
      <View style={styles.header}>
        <Text style={[styles.title, { fontSize: scale(typography.display.fontSize) }]}>
          Card Keeper
        </Text>
        <Text style={styles.subtitle}>Score keeping for your card games</Text>
      </View>

      <Text style={styles.sectionLabel}>GAMES</Text>
      <View style={styles.grid}>
        {games.map((game) => (
          <Card key={game.id} style={{ width: columns === 1 ? '100%' : '48.5%' }}>
            <View style={styles.gameRow}>
              <View style={styles.iconBadge}>
                <MaterialCommunityIcons
                  name={game.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={28}
                  color={colors.gold}
                />
              </View>
              <View style={styles.gameText}>
                <Text style={styles.gameName}>{game.name}</Text>
                <Text style={styles.gameDesc}>{game.description}</Text>
              </View>
            </View>
            <Button label="Coming soon" variant="secondary" disabled onPress={() => {}} />
          </Card>
        ))}
      </View>

      <Card style={styles.debug}>
        <Text style={styles.label}>RESPONSIVE</Text>
        <Text style={styles.body}>
          {sizeClass} · {isLandscape ? 'landscape' : 'portrait'} · {Math.round(width)}×
          {Math.round(height)}dp
        </Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: { paddingVertical: spacing.xl },
  title: { color: colors.cream, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
  sectionLabel: {
    ...typography.label,
    color: colors.gold,
    marginBottom: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  gameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  iconBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: colors.feltDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gameText: { flex: 1 },
  gameName: { ...typography.heading, color: colors.textPrimary },
  gameDesc: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xxs },
  debug: { marginTop: spacing.xl, backgroundColor: colors.feltDark },
  label: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  body: { ...typography.body, color: colors.textPrimary },
});
