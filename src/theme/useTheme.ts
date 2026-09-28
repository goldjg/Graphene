import { useContext } from 'react';

import { ThemeContext } from './ThemeContext.ts';

/**
 * Returns the active theme preference and the resolved theme.
 *
 * Safe to call outside a `ThemeProvider`; see `defaultThemeContextValue`.
 */
export function useTheme() {
  return useContext(ThemeContext);
}
