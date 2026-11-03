import type { StateStorage } from 'zustand/middleware';

/**
 * Wraps a storage backend so unreadable data can never stall hydration: zustand never marks the
 * store hydrated when `getItem` rejects or the stored JSON is invalid, which would leave the app
 * waiting on a blank screen. Bad reads become "nothing saved" and failed writes are ignored.
 */
export function createSafeStorage(storage: StateStorage): StateStorage {
  return {
    getItem: async (name) => {
      try {
        const raw = await storage.getItem(name);
        if (raw == null) return null;
        JSON.parse(raw);
        return raw;
      } catch {
        return null;
      }
    },
    setItem: async (name, value) => {
      try {
        await storage.setItem(name, value);
      } catch (error) {
        console.warn('Card Keeper: could not save game state', error);
      }
    },
    removeItem: async (name) => {
      try {
        await storage.removeItem(name);
      } catch {
        // Nothing useful to do; the next successful write replaces the value.
      }
    },
  };
}
