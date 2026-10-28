import type { ComponentType } from 'react';

export interface GameDefinition {
  id: string;
  name: string;
  description: string;
  /** Route to open when the user picks this game, e.g. '/gin-rummy'. */
  route: string;
  /** Icon name from @expo/vector-icons MaterialCommunityIcons. */
  icon: string;
  /** Optional component for game-specific summary rendering (reserved for later steps). */
  SummaryComponent?: ComponentType<{ gameId: string }>;
}
