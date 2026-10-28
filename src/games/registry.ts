import type { GameDefinition } from './types';

export const games: GameDefinition[] = [
  {
    id: 'ginRummy',
    name: 'Gin Rummy',
    description: 'Two-player score keeper with knock, gin, big gin and undercut.',
    route: '/gin/setup',
    icon: 'cards-playing-outline',
    playerCount: 2,
    available: true,
  },
  {
    id: 'hearts',
    name: 'Hearts',
    description: 'Avoid the hearts and the queen of spades.',
    route: '/hearts',
    icon: 'cards-heart-outline',
    playerCount: 4,
    available: false,
  },
  {
    id: 'spades',
    name: 'Spades',
    description: 'Bid your tricks and partner up.',
    route: '/spades',
    icon: 'cards-spade-outline',
    playerCount: 4,
    available: false,
  },
  {
    id: 'euchre',
    name: 'Euchre',
    description: 'Fast trick-taking with trump and partners.',
    route: '/euchre',
    icon: 'cards-club-outline',
    playerCount: 4,
    available: false,
  },
];

export function getGame(id: string): GameDefinition | undefined {
  return games.find((g) => g.id === id);
}
