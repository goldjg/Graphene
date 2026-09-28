import '@testing-library/jest-dom/vitest';

/**
 * jsdom does not implement `window.matchMedia`, which `ThemeProvider` uses to
 * read the operating-system colour scheme. Provide a controllable stub that
 * reports "no match" (light) by default; tests that care about the system
 * preference override `window.matchMedia` themselves.
 */
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  window.matchMedia = (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => false,
  });
}
