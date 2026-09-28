import { createContext } from 'react';

import type { ResolvedTheme, ThemePreference } from './theme.ts';

export interface ThemeContextValue {
  /** What the user asked for, including `system`. */
  preference: ThemePreference;
  /** What is actually rendered, after resolving `system`. */
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
}

/**
 * Default value used when no `ThemeProvider` is mounted.
 *
 * Unlike `AuthContext`, this context has a usable default and `useTheme`
 * never throws. Theme is presentation rather than a safety property, so a
 * missing provider must degrade to a readable default instead of breaking
 * rendering.
 */
export const defaultThemeContextValue: ThemeContextValue = {
  preference: 'system',
  resolvedTheme: 'dark',
  setPreference: () => undefined,
};

export const ThemeContext = createContext<ThemeContextValue>(defaultThemeContextValue);
