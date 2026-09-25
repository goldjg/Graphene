const forbiddenTenantAliases = new Set(['common', 'organizations', 'consumers']);

export const graphScopes = ['User.Read', 'Directory.Read.All'] as const;

export type GraphScope = (typeof graphScopes)[number];

export interface AppEnvironment {
  readonly VITE_ENTRA_CLIENT_ID?: string;
  readonly VITE_ENTRA_TENANT_ID?: string;
}

export interface AppConfig {
  auth: {
    clientId: string;
    tenantId: string;
    authority: string;
    scopes: readonly GraphScope[];
  };
}

export function getAppConfig(env: AppEnvironment = import.meta.env): AppConfig {
  const clientId = readRequiredEnv(env, 'VITE_ENTRA_CLIENT_ID');
  const tenantId = readRequiredEnv(env, 'VITE_ENTRA_TENANT_ID');

  return {
    auth: {
      clientId,
      tenantId,
      authority: buildTenantAuthority(tenantId),
      scopes: graphScopes,
    },
  };
}

export function buildTenantAuthority(tenantId: string): string {
  const normalizedTenantId = tenantId.trim();

  if (!normalizedTenantId) {
    throw new Error('VITE_ENTRA_TENANT_ID must not be empty.');
  }

  if (forbiddenTenantAliases.has(normalizedTenantId.toLowerCase())) {
    throw new Error(
      'Graphene requires a tenant-specific Microsoft Entra authority; common, organizations, and consumers are not allowed.',
    );
  }

  return `https://login.microsoftonline.com/${encodeURIComponent(normalizedTenantId)}`;
}

function readRequiredEnv(
  env: AppEnvironment,
  name: 'VITE_ENTRA_CLIENT_ID' | 'VITE_ENTRA_TENANT_ID',
): string {
  const value = env[name]?.trim();

  if (!value) {
    throw new Error(`${name} is required. Copy .env.example to .env.local and set a safe value.`);
  }

  return value;
}
