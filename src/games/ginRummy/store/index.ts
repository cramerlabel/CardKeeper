import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { createGinStore } from './createGinStore';

export const useGinStore = createGinStore(AsyncStorage);

/** False until the persisted game has been loaded from storage; wait for it before reading `currentGame`. */
export function useGinHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const unsubscribe = useGinStore.persist.onFinishHydration(onChange);
      return unsubscribe;
    },
    () => useGinStore.persist.hasHydrated(),
    () => false,
  );
}

export { createGinStore } from './createGinStore';
export {
  selectFinalScore,
  selectHandsWon,
  selectHasSavedGame,
  selectIsGameOver,
  selectTotals,
} from './selectors';
export type { ActionResult, GameStatus, GinGame, GinStore } from './types';
