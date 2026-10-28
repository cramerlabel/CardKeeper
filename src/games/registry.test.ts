import { games, getGame } from './registry';

describe('game registry', () => {
  it('has unique ids and exactly Gin Rummy available', () => {
    expect(new Set(games.map((g) => g.id)).size).toBe(games.length);
    expect(games.filter((g) => g.available).map((g) => g.id)).toEqual(['ginRummy']);
    expect(games.filter((g) => !g.available).length).toBeGreaterThanOrEqual(2);
  });

  it('looks games up by id', () => {
    expect(getGame('ginRummy')?.name).toBe('Gin Rummy');
    expect(getGame('missing')).toBeUndefined();
  });
});
