import { STANDARD_CONFIG, SHORT_CONFIG } from '../cribbage/engine';
import { games } from '../registry';
import { getRules } from './index';

describe('game rules', () => {
  it.each(games.map((g) => g.id))('has rules content for %s', (id) => {
    const rules = getRules(id);
    expect(rules).toBeDefined();
    expect(rules?.summary.length).toBeGreaterThan(0);
    expect(rules?.sections.map((s) => s.title)).toEqual(
      expect.arrayContaining(['Goal', 'Winning the game']),
    );
    expect(rules?.sections.some((s) => (s.scoring?.length ?? 0) > 0)).toBe(true);
  });

  it('returns undefined for unknown games', () => {
    expect(getRules('missing')).toBeUndefined();
  });

  it('keeps Gin Rummy numbers in sync with the scoring config', () => {
    const text = JSON.stringify(getRules('ginRummy'));
    expect(text).toContain('25 + opponent');
    expect(text).toContain('31 + opponent');
  });

  it('keeps Cribbage numbers in sync with the engine config', () => {
    const rules = getRules('cribbage');
    const text = JSON.stringify(rules);
    expect(text).toContain(`First to ${STANDARD_CONFIG.target}`);
    expect(text).toContain(`${SHORT_CONFIG.target} in a short game`);
    expect(text).toContain(`fewer than ${STANDARD_CONFIG.skunkLine} points`);
    expect(text).toContain(`fewer than ${STANDARD_CONFIG.doubleSkunkLine} points`);
    expect(text).toContain(`${SHORT_CONFIG.skunkLine} short game`);
  });
});
