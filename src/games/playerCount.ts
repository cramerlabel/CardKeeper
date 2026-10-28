import type { GameDefinition } from './types';

export function formatPlayerCount(playerCount: GameDefinition['playerCount']): string {
  if (typeof playerCount === 'number') {
    return `${playerCount} ${playerCount === 1 ? 'player' : 'players'}`;
  }
  const [min, max] = playerCount;
  return min === max ? formatPlayerCount(min) : `${min}–${max} players`;
}
