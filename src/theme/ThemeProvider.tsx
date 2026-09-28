import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { ThemeContext, type ThemeContextValue } from './ThemeContext.ts';
import {
  getBrowserThemeStorage,
  PREFERS_DARK_QUERY,
  readStoredThemePreference,
  readSystemPrefersDark,
  resolveTheme,
  storeThemePreference,
  type ThemePreference,
  type ThemeStorage,
} from './theme.ts';

interface ThemeProviderProps {
  children: ReactNode;
  /** Injectable for tests; defaults to the browser `localStorage`. */
  storage?: ThemeStorage | null;
}

/**
 * Owns the theme preference and mirrors the resolved theme onto the document
 * element as `data-theme`.
 *
 * The stylesheet resolves the *system* default on its own, through
 * `color-scheme: light dark` and `light-dark()`, so the correct colours are
 * painted before this provider ever runs. That is deliberate: `netlify.toml`
 * sets `script-src 'self'`, which rules out the usual pre-paint inline theme
 * script, and a CSS-resolved default avoids a flash without weakening the
 * Content-Security-Policy.
 *
 * `data-theme` is therefore only ever an *override*. It is absent while the
 * preference is `system`, so the media query stays in charge.
 */
export function ThemeProvider({ children, storage }: ThemeProviderProps) {
  const themeStorage = useMemo(
    () => (storage === undefined ? getBrowserThemeStorage() : storage),
    [storage],
  );

  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readStoredThemePreference(themeStorage),
  );
  const [prefersDark, setPrefersDark] = useState<boolean>(readSystemPrefersDark);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return;
    }

    const query = window.matchMedia(PREFERS_DARK_QUERY);
    setPrefersDark(query.matches);

    const handleChange = (event: MediaQueryListEvent) => setPrefersDark(event.matches);
    query.addEventListener('change', handleChange);

    return () => query.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme = resolveTheme(preference, prefersDark);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const root = document.documentElement;

    if (preference === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', preference);
    }
  }, [preference]);

  const setPreference = useCallback(
    (next: ThemePreference) => {
      setPreferenceState(next);
      storeThemePreference(themeStorage, next);
    },
    [themeStorage],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
