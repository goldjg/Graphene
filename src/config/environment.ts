export const graphScopes = ['User.Read', 'Directory.Read.All'] as const;
export const entraAuthority = 'https://login.microsoftonline.com/organizations';

export type GraphScope = (typeof graphScopes)[number];

export interface AppEnvironment {
  readonly VITE_ENTRA_CLIENT_ID?: string;
  readonly VITE_ENTRA_REDIRECT_URI?: string;
}

export interface AppConfig {
  auth: {
    clientId: string;
    authority: string;
    redirectUri?: string;
    scopes: readonly GraphScope[];
  };
}

export function getAppConfig(env: AppEnvironment = import.meta.env): AppConfig {
  const clientId = readRequiredEnv(env, 'VITE_ENTRA_CLIENT_ID');
  const redirectUri = readRedirectUri(env.VITE_ENTRA_REDIRECT_URI);

  return {
    auth: {
      clientId,
      authority: entraAuthority,
      ...(redirectUri ? { redirectUri } : {}),
      scopes: graphScopes,
    },
  };
}

function readRequiredEnv(env: AppEnvironment, name: 'VITE_ENTRA_CLIENT_ID'): string {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required. Copy .env.example to .env.local and set a safe value.`);
  }

  return value;
}

function readRedirectUri(value: string | undefined): string | undefined {
  const normalizedValue = value?.trim();

  if (!normalizedValue) {
    return undefined;
  }

  const redirectUri = new URL(normalizedValue);
  const isLocalDevelopment =
    redirectUri.protocol === 'http:' &&
    (redirectUri.hostname === 'localhost' || redirectUri.hostname === '127.0.0.1');

  if (redirectUri.protocol !== 'https:' && !isLocalDevelopment) {
    throw new Error('VITE_ENTRA_REDIRECT_URI must use HTTPS, except for local development.');
  }

  if (
    redirectUri.username ||
    redirectUri.password ||
    redirectUri.search ||
    redirectUri.hash ||
    redirectUri.pathname !== '/'
  ) {
    throw new Error('VITE_ENTRA_REDIRECT_URI must be an origin URL with no path or credentials.');
  }

  return redirectUri.href;
}
