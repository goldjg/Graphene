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
        VITE_ENTRA_REDIRECT_URI: 'https://graphene-ms.netlify.app/',
      }),
    );

    expect(config.auth).toMatchObject({
      clientId: 'client-id',
      authority: entraAuthority,
      redirectUri: 'https://graphene-ms.netlify.app/',
      scopes: ['User.Read', 'Directory.Read.All'],
    });
  });

  it('allows an HTTP redirect only for local development', () => {
    expect(
      getAppConfig(
        buildEnv({
          VITE_ENTRA_CLIENT_ID: 'client-id',
          VITE_ENTRA_REDIRECT_URI: 'http://localhost:5173/',
        }),
      ).auth.redirectUri,
    ).toBe('http://localhost:5173/');

    expect(() =>
      getAppConfig(
        buildEnv({
          VITE_ENTRA_CLIENT_ID: 'client-id',
          VITE_ENTRA_REDIRECT_URI: 'http://graphene.example/',
        }),
      ),
    ).toThrow(/must use HTTPS/);
  });

  it('rejects redirect URLs containing a path, query, fragment, or credentials', () => {
    for (const redirectUri of [
      'https://graphene.example/auth',
      'https://graphene.example/?source=preview',
      'https://graphene.example/#callback',
      'https://user:password@graphene.example/',
    ]) {
      expect(() =>
        getAppConfig(
          buildEnv({
            VITE_ENTRA_CLIENT_ID: 'client-id',
            VITE_ENTRA_REDIRECT_URI: redirectUri,
          }),
        ),
      ).toThrow(/must be an origin URL/);
    }
  });
});

function buildEnv(values: AppEnvironment): AppEnvironment {
  return values;
}
