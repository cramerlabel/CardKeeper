import { colors } from './colors';
import { radius, spacing } from './spacing';
import { shadows } from './shadows';
import { typography } from './typography';

// Single dark "felt" theme; app.json pins userInterfaceStyle to dark.
export const theme = { colors, typography, spacing, radius, shadows } as const;

export type Theme = typeof theme;

export { colors, radius, shadows, spacing, typography };
export type { ColorToken } from './colors';
export type { RadiusToken, SpacingToken } from './spacing';
export type { ShadowToken } from './shadows';
export type { TypographyToken } from './typography';
