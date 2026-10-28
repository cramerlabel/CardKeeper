import type { GameDefinition } from './types';

export const games: GameDefinition[] = [
  {
    id: 'ginRummy',
    name: 'Gin Rummy',
    description: 'Two-player score keeper with knock, gin, big gin and undercut.',
    route: '/gin-rummy',
    icon: 'cards-playing-outline',
  },
];

export function getGame(id: string): GameDefinition | undefined {
  return games.find((g) => g.id === id);
}
