import { buildSavedGames, formatNameList } from './savedGames';

const gin = { players: ['Ann', 'Bob'], totals: [40, 25], handCount: 3 };
const cribbage = { players: ['Ann', 'Bob', 'Cy'], totals: [61, 50, 12], deal: 4 };

describe('buildSavedGames', () => {
  it('returns nothing when no game is saved', () => {
    expect(buildSavedGames({ ginRummy: null, cribbage: null })).toEqual([]);
  });

  it('describes a gin game', () => {
    expect(buildSavedGames({ ginRummy: gin, cribbage: null })).toEqual([
      {
        gameId: 'ginRummy',
        gameName: 'Gin Rummy',
        players: ['Ann', 'Bob'],
        totals: [40, 25],
        progressLabel: '3 hands played',
        continueRoute: '/gin/scoreboard',
      },
    ]);
  });

  it('uses the singular for one hand', () => {
    const [game] = buildSavedGames({ ginRummy: { ...gin, handCount: 1 }, cribbage: null });
    expect(game.progressLabel).toBe('1 hand played');
  });

  it('describes a three-player cribbage game', () => {
    expect(buildSavedGames({ ginRummy: null, cribbage })).toEqual([
      {
        gameId: 'cribbage',
        gameName: 'Cribbage',
        players: ['Ann', 'Bob', 'Cy'],
        totals: [61, 50, 12],
        progressLabel: 'Deal 4',
        continueRoute: '/cribbage/board',
      },
    ]);
  });

  it('lists gin before cribbage when both are saved', () => {
    const ids = buildSavedGames({ ginRummy: gin, cribbage }).map((g) => g.gameId);
    expect(ids).toEqual(['ginRummy', 'cribbage']);
  });
});

describe('formatNameList', () => {
  it('joins one, two and three names', () => {
    expect(formatNameList(['A'])).toBe('A');
    expect(formatNameList(['A', 'B'])).toBe('A and B');
    expect(formatNameList(['A', 'B', 'C'])).toBe('A, B and C');
  });
});
