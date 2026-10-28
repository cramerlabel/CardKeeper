import { useWindowDimensions } from 'react-native';

export type SizeClass = 'compact' | 'medium' | 'expanded';

export const MEDIUM_MIN_WIDTH = 600;
export const EXPANDED_MIN_WIDTH = 840;
const BASE_WIDTH = 360;
export const DENSE_MAX_HEIGHT = 480;
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.5;

const MAX_CONTENT_WIDTH: Record<SizeClass, number> = {
  compact: 600,
  medium: 720,
  expanded: 960,
};

/** compact < 600dp, medium 600–840dp, expanded > 840dp. */
export function getSizeClass(width: number): SizeClass {
  if (width < MEDIUM_MIN_WIDTH) return 'compact';
  if (width <= EXPANDED_MIN_WIDTH) return 'medium';
  return 'expanded';
}

export function getScaleFactor(width: number): number {
  const raw = width / BASE_WIDTH;
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, raw));
}

export function getMaxContentWidth(sizeClass: SizeClass): number {
  return MAX_CONTENT_WIDTH[sizeClass];
}

export interface Responsive {
  width: number;
  height: number;
  sizeClass: SizeClass;
  isLandscape: boolean;
  /** Landscape with little vertical room (phones on their side): screens should economise on height. */
  isDense: boolean;
  /** Scales a design value (authored at 360dp wide) to the current width, clamped. */
  scale: (n: number) => number;
  maxContentWidth: number;
}

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const sizeClass = getSizeClass(width);
  const factor = getScaleFactor(width);
  return {
    width,
    height,
    sizeClass,
    isLandscape: width > height,
    isDense: width > height && height < DENSE_MAX_HEIGHT,
    scale: (n: number) => Math.round(n * factor),
    maxContentWidth: getMaxContentWidth(sizeClass),
  };
}
