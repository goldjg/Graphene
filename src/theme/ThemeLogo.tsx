import { useTheme } from './useTheme.ts';

/**
 * Uses a dark-lettered wordmark on light backgrounds while preserving the
 * original white-lettered artwork for the dark theme.
 */
export function ThemeLogo() {
  const { resolvedTheme } = useTheme();
  const source = resolvedTheme === 'light' ? '/graphene-logo-light.png' : '/graphene-logo.png';

  return <img className="hero-logo" src={source} alt="Graphene" width={900} height={325} />;
}
