export type SavedGameId = 'ginRummy' | 'cribbage';

export interface SavedGameSummary {
  gameId: SavedGameId;
  gameName: string;
  players: readonly string[];
  totals: readonly number[];
  /** Short progress text such as "3 hands played". */
  progressLabel: string;
  continueRoute: string;
}

interface SavedGinGame {
  players: readonly string[];
  totals: readonly number[];
  handCount: number;
}

interface SavedCribbageGame {
  players: readonly string[];
  totals: readonly number[];
  deal: number;
}

export interface SavedGameSources {
  /** Pass null when there is no in-progress game (or the store is not hydrated yet). */
  ginRummy: SavedGinGame | null;
  cribbage: SavedCribbageGame | null;
}

/** "A", "A and B", "A, B and C". */
export function formatNameList(names: readonly string[]): string {
  if (names.length <= 2) return names.join(' and ');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/** In-progress games to offer on the home screen, in a stable order. */
export function buildSavedGames({ ginRummy, cribbage }: SavedGameSources): SavedGameSummary[] {
  const saved: SavedGameSummary[] = [];
  if (ginRummy) {
    saved.push({
      gameId: 'ginRummy',
      gameName: 'Gin Rummy',
      players: ginRummy.players,
      totals: ginRummy.totals,
      progressLabel: `${ginRummy.handCount} ${ginRummy.handCount === 1 ? 'hand' : 'hands'} played`,
      continueRoute: '/gin/scoreboard',
    });
  }
  if (cribbage) {
    saved.push({
      gameId: 'cribbage',
      gameName: 'Cribbage',
      players: cribbage.players,
      totals: cribbage.totals,
      progressLabel: `Deal ${cribbage.deal}`,
      continueRoute: '/cribbage/board',
    });
  }
  return saved;
}
