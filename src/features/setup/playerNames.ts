export const MAX_NAME_LENGTH = 20;
export const NAMES_STORAGE_KEY = 'card-keeper/gin-rummy/last-names';
export const CRIBBAGE_NAMES_STORAGE_KEY = 'card-keeper/cribbage/last-names';
export const MIN_LIST_PLAYERS = 2;
export const MAX_LIST_PLAYERS = 3;

export type NamePair = readonly [string, string];

export const defaultName = (index: number): string => `Player ${index + 1}`;

/** Trimmed name, falling back to "Player N" when left empty. */
export const effectiveName = (raw: string, index: number): string =>
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

export interface NameListValidation {
  valid: boolean;
  /** Inline error per field, or null when that field is fine. */
  errors: (string | null)[];
  names: string[];
}

/** Like `validateNames` for any number of players: a name is flagged when an earlier field has it. */
export function validateNameList(raw: readonly string[]): NameListValidation {
  const names = raw.map(effectiveName);
  const seen = new Set<string>();
  const errors = names.map((name) => {
    const key = name.toLowerCase();
    if (seen.has(key)) return 'Players must have different names.';
    seen.add(key);
    return null;
  });
  return { valid: errors.every((e) => e === null), errors, names };
}

/** Returns the saved names (2–3 players), or null when nothing (valid) was stored. Never throws. */
export async function loadLastNameList(
  storage: NameStorage,
  key: string,
): Promise<string[] | null> {
  try {
    const parsed: unknown = JSON.parse((await storage.getItem(key)) ?? 'null');
    if (
      Array.isArray(parsed) &&
      parsed.length >= MIN_LIST_PLAYERS &&
      parsed.length <= MAX_LIST_PLAYERS &&
      parsed.every((n) => typeof n === 'string')
    ) {
      return parsed.map((n: string) => n.slice(0, MAX_NAME_LENGTH));
    }
  } catch {
    // Unreadable storage just means no prefill.
  }
  return null;
}

export async function saveLastNameList(
  names: readonly string[],
  storage: NameStorage,
  key: string,
): Promise<void> {
  try {
    await storage.setItem(key, JSON.stringify(names));
  } catch {
    // Remembering names is best-effort.
  }
}
