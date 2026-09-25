import { BrowserCacheLocation } from '@azure/msal-browser';
import { describe, expect, it, vi } from 'vitest';

import { createMsalConfig, createGraphLoginRequest } from './msalConfig.ts';

describe('MSAL configuration', () => {
  it('uses the tenant-specific authority and session storage', () => {
    vi.stubGlobal('location', { origin: 'https://graphene.example.test' });

    const config = createMsalConfig({
      auth: {
        clientId: 'client-id',
        tenantId: 'tenant-id',
        authority: 'https://login.microsoftonline.com/tenant-id',
        scopes: ['User.Read', 'Directory.Read.All'],
      },
    });

    expect(config.auth).toMatchObject({
      clientId: 'client-id',
      authority: 'https://login.microsoftonline.com/tenant-id',
      redirectUri: 'https://graphene.example.test',
      postLogoutRedirectUri: 'https://graphene.example.test',
      navigateToLoginRequestUrl: false,
    });
    expect(config.cache?.cacheLocation).toBe(BrowserCacheLocation.SessionStorage);
    expect(config.cache?.storeAuthStateInCookie).toBe(false);
  });

  it('requests exactly the approved delegated scopes', () => {
    expect(createGraphLoginRequest().scopes).toEqual(['User.Read', 'Directory.Read.All']);
  });
});
