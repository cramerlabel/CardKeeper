import { StyleSheet, View } from 'react-native';

import type { GameDefinition } from '@/games/types';
import { useResponsive } from '@/hooks/useResponsive';
import { spacing } from '@/theme';

import { GameCard } from './GameCard';
import { chunk, getGridColumns } from './grid';

interface GameGridProps {
  games: readonly GameDefinition[];
  onSelect: (game: GameDefinition) => void;
}

/** Responsive grid built from equal-flex rows, so no width measuring is needed. */
export function GameGrid({ games, onSelect }: GameGridProps) {
  const { sizeClass, isLandscape, width, maxContentWidth } = useResponsive();
  const contentWidth = Math.min(width, maxContentWidth) - spacing.xl * 2;
  const columns = getGridColumns(sizeClass, isLandscape, contentWidth);

  return (
    <View style={styles.grid}>
      {chunk(games, columns).map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((game) => (
            <View key={game.id} style={styles.cell}>
              <GameCard game={game} onPress={onSelect} />
            </View>
          ))}
          {Array.from({ length: columns - row.length }, (_, i) => (
            <View key={`spacer-${i}`} style={styles.cell} />
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.md },
  row: { flexDirection: 'row', gap: spacing.md },
  cell: { flex: 1 },
});
