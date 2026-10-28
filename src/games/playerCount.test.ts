import { formatPlayerCount } from './playerCount';

describe('formatPlayerCount', () => {
  it('formats single counts and ranges', () => {
    expect(formatPlayerCount(1)).toBe('1 player');
    expect(formatPlayerCount(2)).toBe('2 players');
    expect(formatPlayerCount([2, 4])).toBe('2–4 players');
    expect(formatPlayerCount([3, 3])).toBe('3 players');
  });
});
