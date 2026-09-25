import { AuthError } from '@azure/msal-browser';
import { describe, expect, it } from 'vitest';

import { mapAuthError } from './errors.ts';

describe('auth error mapping', () => {
  it('explains missing admin consent or access denied', () => {
    const error = new AuthError(
      'access_denied',
      'AADSTS65001: The user or administrator has not consented.',
    );

    const mappedError = mapAuthError(error);

    expect(mappedError.title).toBe('Access denied or admin consent missing');
    expect(mappedError.remediation).toContain('Directory.Read.All');
  });

  it('does not expose raw unknown objects', () => {
    expect(mapAuthError({ accessToken: 'secret-token' }).message).toBe(
      'Microsoft Entra authentication failed for an unknown reason.',
    );
  });
});
