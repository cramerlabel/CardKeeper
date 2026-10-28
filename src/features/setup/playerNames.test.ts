import {
  MAX_NAME_LENGTH,
  NAMES_STORAGE_KEY,
  effectiveName,
  loadLastNames,
  saveLastNames,
  validateNames,
} from './playerNames';

function memoryStorage(initial: Record<string, string> = {}) {
  const data = { ...initial };
  return {
    getItem: async (k: string) => data[k] ?? null,
    setItem: async (k: string, v: string) => {
      data[k] = v;
    },
  };
}

describe('validateNames', () => {
  it('accepts distinct names and trims them', () => {
    const v = validateNames(['  Ann ', 'Bob']);
    expect(v.valid).toBe(true);
    expect(v.names).toEqual(['Ann', 'Bob']);
    expect(v.errors).toEqual([null, null]);
  });

  it('allows empty names, falling back to defaults', () => {
    const v = validateNames(['', '   ']);
    expect(v.valid).toBe(true);
    expect(v.names).toEqual(['Player 1', 'Player 2']);
  });

  it('rejects names that differ only by case or whitespace', () => {
    const v = validateNames(['Sam', ' sAM ']);
    expect(v.valid).toBe(false);
    expect(v.errors[1]).toMatch(/different/);
  });

  it('rejects a name that collides with the other default', () => {
    expect(validateNames(['Player 2', '']).valid).toBe(false);
  });
});

describe('effectiveName', () => {
  it('uses the index-based default', () => {
    expect(effectiveName('', 0)).toBe('Player 1');
    expect(effectiveName(' ', 1)).toBe('Player 2');
  });
});

describe('last-used names', () => {
  it('round-trips', async () => {
    const storage = memoryStorage();
    await saveLastNames(['Ann', 'Bob'], storage);
    expect(await loadLastNames(storage)).toEqual(['Ann', 'Bob']);
  });

  it('returns null for missing or corrupt data', async () => {
    expect(await loadLastNames(memoryStorage())).toBeNull();
    expect(await loadLastNames(memoryStorage({ [NAMES_STORAGE_KEY]: '{oops' }))).toBeNull();
    expect(await loadLastNames(memoryStorage({ [NAMES_STORAGE_KEY]: '["a",1]' }))).toBeNull();
  });

  it('clamps over-long stored names', async () => {
    const long = 'x'.repeat(50);
    const storage = memoryStorage({ [NAMES_STORAGE_KEY]: JSON.stringify([long, 'B']) });
    const loaded = await loadLastNames(storage);
    expect(loaded?.[0]).toHaveLength(MAX_NAME_LENGTH);
  });
});
