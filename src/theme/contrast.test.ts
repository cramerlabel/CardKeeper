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

const PEG_COLORS = ['pegRed', 'pegBlue', 'pegGreen'] as const;

describe('cribbage board', () => {
  it('keeps skunk-line labels readable on the wood (4.5:1)', () => {
    expect(contrastRatio(colors.boardLine, colors.boardWood)).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps the dealer badge and peg rings distinct from the wood (3:1)', () => {
    expect(contrastRatio(colors.gold, colors.boardWood)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(colors.cream, colors.boardWood)).toBeGreaterThanOrEqual(3);
  });

  it('keeps the board rim distinct from the felt (3:1)', () => {
    expect(contrastRatio(colors.boardRim, colors.felt)).toBeGreaterThanOrEqual(3);
  });

  it('keeps the holes visible against the wood', () => {
    expect(contrastRatio(colors.boardHole, colors.boardWood)).toBeGreaterThanOrEqual(2);
  });

  it.each(PEG_COLORS)('%s stands out from the wood and from an empty hole (3:1)', (peg) => {
    expect(contrastRatio(colors[peg], colors.boardWood)).toBeGreaterThanOrEqual(3);
    expect(contrastRatio(colors[peg], colors.boardHole)).toBeGreaterThanOrEqual(3);
  });
});
