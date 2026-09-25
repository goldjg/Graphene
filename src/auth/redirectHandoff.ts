const signInHandoffParameter = 'grapheneSignIn';

export function createSignInHandoffUrl(
  currentUrl: string,
  canonicalRedirectUri: string,
): string | null {
  const current = new URL(currentUrl);
  const canonical = new URL(canonicalRedirectUri);

  if (current.origin === canonical.origin) {
    return null;
  }

  canonical.searchParams.set(signInHandoffParameter, '1');
  return canonical.href;
}

export function consumeSignInHandoff(url: string): {
  requested: boolean;
  cleanUrl: string;
} {
  const current = new URL(url);
  const requested = current.searchParams.get(signInHandoffParameter) === '1';

  current.searchParams.delete(signInHandoffParameter);

  return {
    requested,
    cleanUrl: current.href,
  };
}
