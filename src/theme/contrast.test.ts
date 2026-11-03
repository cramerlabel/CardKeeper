import { colors, type ColorToken } from './colors';

function luminance(hex: string): number {
  const channels = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const TEXT_ON_BACKGROUNDS: [ColorToken, ColorToken[]][] = [
  ['textPrimary', ['felt', 'feltDark', 'surface', 'surfaceRaised', 'feltLight']],
  ['textSecondary', ['felt', 'feltDark', 'surface', 'surfaceRaised', 'feltLight']],
  ['gold', ['felt', 'feltDark', 'surface', 'surfaceRaised', 'feltLight']],
  ['success', ['felt', 'feltDark', 'surface', 'surfaceRaised']],
  ['danger', ['felt', 'feltDark', 'surface']],
  ['textOnAccent', ['gold']],
];

describe('text contrast (WCAG AA, 4.5:1)', () => {
  it.each(TEXT_ON_BACKGROUNDS.flatMap(([fg, bgs]) => bgs.map((bg) => [fg, bg] as const)))(
    '%s on %s',
    (fg, bg) => {
      expect(contrastRatio(colors[fg], colors[bg])).toBeGreaterThanOrEqual(4.5);
    },
  );
});

describe('control outlines (WCAG 1.4.11, 3:1)', () => {
  it.each(['felt', 'feltDark', 'surface'] as const)('borderStrong on %s', (bg) => {
    expect(contrastRatio(colors.borderStrong, colors[bg])).toBeGreaterThanOrEqual(3);
  });
});
