import { describe, expect, it, vi } from 'vitest';

import {
  isThemePreference,
  readStoredThemePreference,
  resolveTheme,
  storeThemePreference,
  THEME_STORAGE_KEY,
  themePreferences,
  type ThemeStorage,
} from './theme.ts';

function memoryStorage(initial: Record<string, string> = {}): ThemeStorage {
  const values = new Map(Object.entries(initial));

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

describe('theme preferences', () => {
  it('offers exactly system, light, and dark', () => {
    expect([...themePreferences]).toEqual(['system', 'light', 'dark']);
  });

  it('recognises only the supported preference values', () => {
    expect(isThemePreference('system')).toBe(true);
    expect(isThemePreference('light')).toBe(true);
    expect(isThemePreference('dark')).toBe(true);
    expect(isThemePreference('sepia')).toBe(false);
    expect(isThemePreference(null)).toBe(false);
  });
});

describe('resolveTheme', () => {
  it('follows the system colour scheme for the system preference', () => {
    expect(resolveTheme('system', true)).toBe('dark');
    expect(resolveTheme('system', false)).toBe('light');
  });

  it('overrides the system colour scheme for an explicit preference', () => {
    expect(resolveTheme('light', true)).toBe('light');
    expect(resolveTheme('dark', false)).toBe('dark');
  });
});

describe('readStoredThemePreference', () => {
  it('returns a previously stored preference', () => {
    const storage = memoryStorage({ [THEME_STORAGE_KEY]: 'light' });

    expect(readStoredThemePreference(storage)).toBe('light');
  });

  it('falls back to system when nothing is stored', () => {
    expect(readStoredThemePreference(memoryStorage())).toBe('system');
  });

  it('falls back to system for an unrecognised stored value', () => {
    const storage = memoryStorage({ [THEME_STORAGE_KEY]: 'neon' });

    expect(readStoredThemePreference(storage)).toBe('system');
  });

  it('falls back to system when storage is unavailable', () => {
    expect(readStoredThemePreference(null)).toBe('system');
  });

  it('falls back to system when storage access throws', () => {
    const storage: ThemeStorage = {
      getItem: () => {
        throw new Error('storage disabled');
      },
      setItem: () => undefined,
    };

    expect(readStoredThemePreference(storage)).toBe('system');
  });
});

describe('storeThemePreference', () => {
  it('writes the preference under the single theme key', () => {
    const setItem = vi.fn();
    const storage: ThemeStorage = { getItem: () => null, setItem };

    storeThemePreference(storage, 'dark');

    expect(setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark');
    expect(setItem).toHaveBeenCalledTimes(1);
  });

  it('ignores an unavailable storage', () => {
    expect(() => storeThemePreference(null, 'dark')).not.toThrow();
  });

  it('ignores a storage that throws on write', () => {
    const storage: ThemeStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error('quota exceeded');
      },
    };

    expect(() => storeThemePreference(storage, 'light')).not.toThrow();
  });
});
