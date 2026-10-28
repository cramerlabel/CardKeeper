export const MAX_NAME_LENGTH = 20;
export const NAMES_STORAGE_KEY = 'card-keeper/gin-rummy/last-names';

export type NamePair = readonly [string, string];

export const defaultName = (index: 0 | 1): string => `Player ${index + 1}`;

/** Trimmed name, falling back to "Player N" when left empty. */
export const effectiveName = (raw: string, index: 0 | 1): string =>
  raw.trim() || defaultName(index);

export interface NameValidation {
  valid: boolean;
  /** Inline error per field, or null when that field is fine. */
  errors: readonly [string | null, string | null];
  names: readonly [string, string];
}

export function validateNames(raw: NamePair): NameValidation {
  const names = [effectiveName(raw[0], 0), effectiveName(raw[1], 1)] as const;
  const clash = names[0].toLowerCase() === names[1].toLowerCase();
  return {
    valid: !clash,
    errors: [null, clash ? 'Players must have different names.' : null],
    names,
  };
}

export interface NameStorage {
  getItem: (key: string) => Promise<string | null>;
  setItem: (key: string, value: string) => Promise<void>;
}

/** Returns the saved pair, or null when nothing (valid) was stored. Never throws. */
export async function loadLastNames(storage: NameStorage): Promise<NamePair | null> {
  try {
    const parsed: unknown = JSON.parse((await storage.getItem(NAMES_STORAGE_KEY)) ?? 'null');
    if (
      Array.isArray(parsed) &&
      parsed.length === 2 &&
      parsed.every((n) => typeof n === 'string')
    ) {
      return [parsed[0].slice(0, MAX_NAME_LENGTH), parsed[1].slice(0, MAX_NAME_LENGTH)];
    }
  } catch {
    // Unreadable storage just means no prefill.
  }
  return null;
}

export async function saveLastNames(names: NamePair, storage: NameStorage): Promise<void> {
  try {
    await storage.setItem(NAMES_STORAGE_KEY, JSON.stringify(names));
  } catch {
    // Remembering names is best-effort.
  }
}
