import type { SizeClass } from '@/hooks/useResponsive';

export const MIN_CARD_WIDTH = 220;
export const GRID_GAP = 12;

/**
 * compact = 1–2, medium = 2–3, expanded = 3–4 columns (portrait → landscape),
 * reduced when `contentWidth` can't fit that many cards at MIN_CARD_WIDTH.
 */
export function getGridColumns(
  sizeClass: SizeClass,
  isLandscape: boolean,
  contentWidth = Infinity,
): number {
  const target = { compact: [1, 2], medium: [2, 3], expanded: [3, 4] }[sizeClass][
    isLandscape ? 1 : 0
  ];
  const fit = Math.floor((contentWidth + GRID_GAP) / (MIN_CARD_WIDTH + GRID_GAP));
  return Math.max(1, Math.min(target, fit));
}

/** Splits items into rows of `size`, so every row can share equal-width flex cells. */
export function chunk<T>(items: readonly T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) rows.push(items.slice(i, i + size));
  return rows;
}
