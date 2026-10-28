import { useWindowDimensions } from 'react-native';

const BASE = 360;
const MIN_SCALE = 0.85;
const MAX_SCALE = 1.5;

/** Scales a 360dp-authored size from the window's short side so landscape phones don't get tablet-sized text. */
export function useTextScale(): (n: number) => number {
  const { width, height } = useWindowDimensions();
  const factor = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.min(width, height) / BASE));
  return (n) => Math.round(n * factor);
}
