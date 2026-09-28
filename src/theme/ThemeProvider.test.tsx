import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ThemeProvider } from './ThemeProvider.tsx';
import { ThemeToggle } from './ThemeToggle.tsx';
import { useTheme } from './useTheme.ts';
import { PREFERS_DARK_QUERY, THEME_STORAGE_KEY, type ThemeStorage } from './theme.ts';

/**
 * Installs a controllable `matchMedia` for the dark-scheme query so tests can
 * both set the initial system preference and emit a live change.
 */
function installMatchMedia(prefersDark: boolean) {
  const listeners = new Set<(event: MediaQueryListEvent) => void>();
  let matches = prefersDark;

  window.matchMedia = ((query: string) => ({
    get matches() {
      return query === PREFERS_DARK_QUERY ? matches : false;
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.add(listener);
    },
    removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => {
      listeners.delete(listener);
    },
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;

  return {
    emit(next: boolean) {
      matches = next;
      act(() => {
        for (const listener of listeners) {
          listener({ matches: next } as MediaQueryListEvent);
        }
      });
    },
  };
}

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  const storage: ThemeStorage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };

  return { storage, values };
}

function ResolvedThemeProbe() {
  const { preference, resolvedTheme } = useTheme();

  return <p data-testid="probe">{`${preference}:${resolvedTheme}`}</p>;
}

function renderProvider(storage: ThemeStorage | null) {
  return render(
    <ThemeProvider storage={storage}>
      <ThemeToggle />
      <ResolvedThemeProbe />
    </ThemeProvider>,
  );
}

const originalMatchMedia = window.matchMedia.bind(window);

beforeEach(() => {
  document.documentElement.removeAttribute('data-theme');
});

afterEach(() => {
  window.matchMedia = originalMatchMedia;
  document.documentElement.removeAttribute('data-theme');
});

describe('ThemeProvider and ThemeToggle', () => {
  it('offers System, Light, and Dark, defaulting to System', () => {
    installMatchMedia(true);
    renderProvider(memoryStorage().storage);

    expect(screen.getByRole('group', { name: 'Appearance' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Light' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: 'Dark' })).not.toBeChecked();
  });

  it('follows the system colour scheme while the preference is System', () => {
    installMatchMedia(true);
    renderProvider(memoryStorage().storage);

    expect(screen.getByTestId('probe')).toHaveTextContent('system:dark');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('resolves to light when the system prefers light', () => {
    installMatchMedia(false);
    renderProvider(memoryStorage().storage);

    expect(screen.getByTestId('probe')).toHaveTextContent('system:light');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('tracks live system colour scheme changes while set to System', () => {
    const media = installMatchMedia(true);
    renderProvider(memoryStorage().storage);

    expect(screen.getByTestId('probe')).toHaveTextContent('system:dark');

    media.emit(false);

    expect(screen.getByTestId('probe')).toHaveTextContent('system:light');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
  });

  it('overrides the system preference and persists the choice', () => {
    installMatchMedia(true);
    const { storage, values } = memoryStorage();
    renderProvider(storage);

    fireEvent.click(screen.getByRole('radio', { name: 'Light' }));

    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();
    expect(screen.getByTestId('probe')).toHaveTextContent('light:light');
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(values.get(THEME_STORAGE_KEY)).toBe('light');
  });

  it('returns to the system preference and drops the override', () => {
    installMatchMedia(true);
    const { storage, values } = memoryStorage({ [THEME_STORAGE_KEY]: 'light' });
    renderProvider(storage);

    expect(document.documentElement.getAttribute('data-theme')).toBe('light');

    fireEvent.click(screen.getByRole('radio', { name: 'System' }));

    expect(screen.getByTestId('probe')).toHaveTextContent('system:dark');
    expect(document.documentElement.hasAttribute('data-theme')).toBe(false);
    expect(values.get(THEME_STORAGE_KEY)).toBe('system');
  });

  it('restores a stored dark override over a light system preference', () => {
    installMatchMedia(false);
    renderProvider(memoryStorage({ [THEME_STORAGE_KEY]: 'dark' }).storage);

    expect(screen.getByRole('radio', { name: 'Dark' })).toBeChecked();
    expect(screen.getByTestId('probe')).toHaveTextContent('dark:dark');
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('falls back to System when storage is unavailable', () => {
    installMatchMedia(true);
    renderProvider(null);

    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
    expect(() => fireEvent.click(screen.getByRole('radio', { name: 'Dark' }))).not.toThrow();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });

  it('renders a readable default outside a provider', () => {
    render(<ResolvedThemeProbe />);

    expect(screen.getByTestId('probe')).toHaveTextContent('system:dark');
  });
});
