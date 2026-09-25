import { BrowserCacheLocation } from '@azure/msal-browser';
import { describe, expect, it, vi } from 'vitest';

import { createMsalConfig, createGraphLoginRequest } from './msalConfig.ts';

describe('MSAL configuration', () => {
  it('uses the organizations authority and redirect-safe cache locations', () => {
    vi.stubGlobal('location', { origin: 'https://graphene.example.test' });

    const config = createMsalConfig({
      auth: {
        clientId: 'client-id',
        authority: 'https://login.microsoftonline.com/organizations',
        scopes: ['User.Read', 'Directory.Read.All'],
      },
    });

    expect(config.auth).toMatchObject({
      clientId: 'client-id',
      authority: 'https://login.microsoftonline.com/organizations',
      redirectUri: 'https://graphene.example.test',
      postLogoutRedirectUri: 'https://graphene.example.test',
      navigateToLoginRequestUrl: false,
    });
    expect(config.cache?.cacheLocation).toBe(BrowserCacheLocation.SessionStorage);
    expect(config.cache?.temporaryCacheLocation).toBe(BrowserCacheLocation.LocalStorage);
    expect(config.cache?.storeAuthStateInCookie).toBe(false);
  });

  it('requests exactly the approved delegated scopes', () => {
    expect(createGraphLoginRequest().scopes).toEqual(['User.Read', 'Directory.Read.All']);
  });
});
