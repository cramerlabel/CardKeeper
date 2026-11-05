import { colors } from '@/theme';
import { LANE_COLOR_KEYS, type LaneColorKey } from './geometry';

export const LANE_COLORS: Record<LaneColorKey, string> = {
  red: colors.pegRed,
  blue: colors.pegBlue,
  green: colors.pegGreen,
};

/** Peg/lane colour of a player (lane index = player index). */
export function laneColor(lane: number): string {
  return LANE_COLORS[LANE_COLOR_KEYS[lane % LANE_COLOR_KEYS.length]];
}
