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
  return {
    auth: {
      clientId: config.auth.clientId,
      authority: config.auth.authority,
      redirectUri: window.location.origin,
      postLogoutRedirectUri: window.location.origin,
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.SessionStorage,
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

export function createGraphLoginRequest(): RedirectRequest & PopupRequest {
  return {
    scopes: [...graphLoginScopes],
  };
}
