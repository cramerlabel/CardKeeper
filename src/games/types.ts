import type { ComponentType } from 'react';

export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  /** Route to open when the user picks this game, e.g. '/gin/setup'. */
  route: string;
  /** Icon name from @expo/vector-icons MaterialCommunityIcons. */
  icon: string;
  /** Number of players, or a [min, max] range. */
  playerCount: number | readonly [number, number];
  /** False for "coming soon" placeholders: shown in the menu but not playable. */
  available: boolean;
  /** Optional component for game-specific summary rendering (reserved for later steps). */
  SummaryComponent?: ComponentType<{ gameId: string }>;
}
