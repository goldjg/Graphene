import { describe, expect, it } from 'vitest';

import { type AppEnvironment, entraAuthority, getAppConfig, graphScopes } from './environment.ts';

describe('environment configuration', () => {
  it('uses exactly the approved Microsoft Graph delegated scopes', () => {
    expect(graphScopes).toEqual(['User.Read', 'Directory.Read.All']);
  });

  it('uses the organizations authority without a tenant environment variable', () => {
    expect(entraAuthority).toBe('https://login.microsoftonline.com/organizations');
    expect(getAppConfig(buildEnv({ VITE_ENTRA_CLIENT_ID: 'client-id' })).auth).toMatchObject({
      authority: entraAuthority,
    });
  });

  it('requires the public client ID', () => {
    expect(() => getAppConfig(buildEnv({}))).toThrow(/VITE_ENTRA_CLIENT_ID is required/);
  });

  it('returns the configured public client ID and approved scopes', () => {
    const config = getAppConfig(
      buildEnv({
        VITE_ENTRA_CLIENT_ID: 'client-id',
      }),
    );

    expect(config.auth).toMatchObject({
      clientId: 'client-id',
      authority: entraAuthority,
      scopes: ['User.Read', 'Directory.Read.All'],
    });
  });
});

function buildEnv(values: AppEnvironment): AppEnvironment {
  return values;
}
