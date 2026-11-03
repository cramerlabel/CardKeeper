import { DEFAULT_SETTINGS, sanitizeSettings } from './settings';

describe('sanitizeSettings', () => {
  it('keeps valid values', () => {
    expect(sanitizeSettings({ hapticsEnabled: false })).toEqual({ hapticsEnabled: false });
    expect(sanitizeSettings({ hapticsEnabled: true })).toEqual({ hapticsEnabled: true });
  });

  it.each([undefined, null, 'x', 7, [], {}, { hapticsEnabled: 'no' }])(
    'falls back to defaults for %p',
    (raw) => {
      expect(sanitizeSettings(raw)).toEqual(DEFAULT_SETTINGS);
    },
  );
});
