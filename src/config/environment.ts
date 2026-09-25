export const graphScopes = ['User.Read', 'Directory.Read.All'] as const;
export const entraAuthority = 'https://login.microsoftonline.com/organizations';

export type GraphScope = (typeof graphScopes)[number];

export interface AppEnvironment {
  readonly VITE_ENTRA_CLIENT_ID?: string;
}

export interface AppConfig {
  auth: {
    clientId: string;
    authority: string;
    scopes: readonly GraphScope[];
  };
}

export function getAppConfig(env: AppEnvironment = import.meta.env): AppConfig {
  const clientId = readRequiredEnv(env, 'VITE_ENTRA_CLIENT_ID');

  return {
    auth: {
      clientId,
      authority: entraAuthority,
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
