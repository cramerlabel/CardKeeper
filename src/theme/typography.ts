import type { TextStyle } from 'react-native';

type TypeStyle = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'fontWeight' | 'letterSpacing'>;

export const typography = {
  display: { fontSize: 44, lineHeight: 52, fontWeight: '800', letterSpacing: -0.5 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 22, fontWeight: '400' },
  bodyStrong: { fontSize: 16, lineHeight: 22, fontWeight: '600' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500', letterSpacing: 0.2 },
  label: { fontSize: 12, lineHeight: 16, fontWeight: '700', letterSpacing: 1 },
} as const satisfies Record<string, TypeStyle>;

export type TypographyToken = keyof typeof typography;
