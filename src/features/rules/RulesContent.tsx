import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import type { GameRules, RulesSection } from '@/games/rules';
import { colors, radius, spacing, typography } from '@/theme';

function Section({ section }: { section: RulesSection }) {
  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle} accessibilityRole="header">
        {section.title}
      </Text>
      {section.paragraphs?.map((text) => (
        <Text key={text} style={styles.body}>
          {text}
        </Text>
      ))}
      {section.bullets?.map((text) => (
        <View key={text} style={styles.bulletRow}>
          <Text style={styles.bullet} importantForAccessibility="no">
            {'\u2022'}
          </Text>
          <Text style={[styles.body, styles.bulletText]}>{text}</Text>
        </View>
      ))}
      {section.scoring && (
        <View style={styles.table}>
          {section.scoring.map((row, index) => (
            <View
              key={row.label}
              accessible
              accessibilityLabel={`${row.label}: ${row.value}`}
              style={[styles.scoreRow, index > 0 && styles.scoreRowDivider]}
            >
              <Text style={[styles.body, styles.scoreLabel]}>{row.label}</Text>
              <Text style={[styles.bodyStrong, styles.scoreValue]}>{row.value}</Text>
            </View>
          ))}
        </View>
      )}
    </Card>
  );
}

export function RulesContent({ rules }: { rules: GameRules }) {
  return (
    <View style={styles.root}>
      <Text style={styles.summary}>{rules.summary}</Text>
      <View style={styles.chips}>
        {rules.quickFacts.map((fact) => (
          <View key={fact} style={styles.chip}>
            <Text style={styles.chipText}>{fact}</Text>
          </View>
        ))}
      </View>
      {rules.sections.map((section) => (
        <Section key={section.title} section={section} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  summary: { ...typography.body, color: colors.textPrimary },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.feltDark,
  },
  chipText: { ...typography.caption, color: colors.textSecondary },
  card: { gap: spacing.sm },
  sectionTitle: { ...typography.heading, color: colors.gold },
  body: { ...typography.body, color: colors.textPrimary },
  bodyStrong: { ...typography.bodyStrong, color: colors.textPrimary },
  bulletRow: { flexDirection: 'row', gap: spacing.sm },
  bullet: { ...typography.body, color: colors.gold },
  bulletText: { flex: 1 },
  table: { marginTop: spacing.xs },
  scoreRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  scoreRowDivider: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  scoreLabel: { flex: 1 },
  scoreValue: { flex: 1, textAlign: 'right', color: colors.cream },
});
