import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import { createCribbageStore } from './createCribbageStore';

export const useCribbageStore = createCribbageStore(AsyncStorage);

/** False until the persisted game has been loaded from storage; wait for it before reading `currentGame`. */
export function useCribbageHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const unsubscribe = useCribbageStore.persist.onFinishHydration(onChange);
      return unsubscribe;
    },
    () => useCribbageStore.persist.hasHydrated(),
    () => false,
  );
}

export { createCribbageStore } from './createCribbageStore';
export {
  selectContext,
  selectDealer,
  selectHasSavedGame,
  selectIsGameOver,
  selectPegs,
  selectResult,
  selectTotals,
} from './selectors';
export type {
  ActionResult,
  CribbageGame,
  CribbageStore,
  GameStatus,
  NewScoreInput,
  StartGameOptions,
} from './types';
