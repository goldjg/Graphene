import {
  BrowserCacheLocation,
  type Configuration,
  LogLevel,
  type PopupRequest,
  type RedirectRequest,
} from '@azure/msal-browser';

import type { AppConfig } from '../config/environment.ts';

export const graphLoginScopes = ['User.Read', 'Directory.Read.All'] as const;

export function createMsalConfig(config: AppConfig): Configuration {
  const redirectUri = getAuthRedirectUri(config);

  return {
    auth: {
      clientId: config.auth.clientId,
      authority: config.auth.authority,
      redirectUri,
      postLogoutRedirectUri: redirectUri,
      navigateToLoginRequestUrl: false,
    },
    cache: {
      // MSAL v4 encrypts local-storage auth artifacts with a key held in a
      // session cookie. Cross-context storage is required for mobile Safari.
      cacheLocation: BrowserCacheLocation.LocalStorage,
      temporaryCacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: false,
    },
    system: {
      loggerOptions: {
        logLevel: LogLevel.Error,
        piiLoggingEnabled: false,
      },
    },
  };
}

export function getAuthRedirectUri(config: AppConfig): string {
  return config.auth.redirectUri ?? `${window.location.origin}/`;
}

export function createGraphLoginRequest(): RedirectRequest & PopupRequest {
  return {
    scopes: [...graphLoginScopes],
  };
}
