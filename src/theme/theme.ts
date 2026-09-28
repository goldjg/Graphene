/**
 * Theme preference model.
 *
 * Graphene renders in a dark or light colour scheme. The user's stored
 * preference is one of three values; `system` means "follow the operating
 * system", and is the default when nothing has been chosen.
 *
 * Everything in this module is pure and storage-injectable so the resolution
 * rules can be tested without a DOM or a real `localStorage`.
 */

/** What the user asked for. */
export type ThemePreference = 'system' | 'light' | 'dark';

/** What is actually rendered once `system` has been resolved. */
export type ResolvedTheme = 'light' | 'dark';

/**
 * Local storage key for the theme preference.
 *
 * This is the only value Graphene persists. It is a UI preference and never
 * contains tenant, directory, account, or investigation data.
 */
export const THEME_STORAGE_KEY = 'graphene.theme';

/** Media query used to read the operating system colour scheme. */
export const PREFERS_DARK_QUERY = '(prefers-color-scheme: dark)';

export const themePreferences: readonly ThemePreference[] = ['system', 'light', 'dark'];

export function isThemePreference(value: unknown): value is ThemePreference {
  return themePreferences.includes(value as ThemePreference);
}

/**
 * Minimal structural view of `localStorage`, so callers can inject a stub
 * and so a browser that throws on storage access can be handled uniformly.
 */
export interface ThemeStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
}

/**
 * Reads the stored preference, falling back to `system` when storage is
 * unavailable (private browsing, blocked cookies) or holds an unrecognised
 * value. Never throws.
 */
export function readStoredThemePreference(storage: ThemeStorage | null): ThemePreference {
  if (!storage) {
    return 'system';
  }

  try {
    const stored = storage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

/**
 * Persists the preference. Failure to write is not an error worth surfacing
 * to an investigator: the theme still applies for the current session.
 */
export function storeThemePreference(
  storage: ThemeStorage | null,
  preference: ThemePreference,
): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Storage is unavailable; the in-memory preference still applies.
  }
}

/** Resolves a preference against the current system colour scheme. */
export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === 'system') {
    return systemPrefersDark ? 'dark' : 'light';
  }

  return preference;
}

/**
 * Returns the browser `localStorage` when it is reachable.
 *
 * Accessing `window.localStorage` itself can throw in some privacy modes, so
 * the access is guarded rather than assumed.
 */
export function getBrowserThemeStorage(): ThemeStorage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * Reads the system colour scheme. Returns `false` (light) when `matchMedia`
 * is unavailable, which matches the CSS default for an unknown preference.
 */
export function readSystemPrefersDark(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia(PREFERS_DARK_QUERY).matches;
}
