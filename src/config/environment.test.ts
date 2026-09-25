import { describe, expect, it } from 'vitest';

import {
  type AppEnvironment,
  buildTenantAuthority,
  getAppConfig,
  graphScopes,
} from './environment.ts';

describe('environment configuration', () => {
  it('uses exactly the approved Microsoft Graph delegated scopes', () => {
    expect(graphScopes).toEqual(['User.Read', 'Directory.Read.All']);
  });

  it('builds a tenant-specific Microsoft Entra authority', () => {
    expect(buildTenantAuthority('11111111-1111-1111-1111-111111111111')).toBe(
      'https://login.microsoftonline.com/11111111-1111-1111-1111-111111111111',
    );
  });

  it.each(['common', 'organizations', 'consumers', 'COMMON'])(
    'rejects forbidden tenant alias %s',
    (tenantAlias) => {
      expect(() => buildTenantAuthority(tenantAlias)).toThrow(/tenant-specific/i);
    },
  );

  it('requires both Vite environment variables', () => {
    expect(() => getAppConfig(buildEnv({ VITE_ENTRA_CLIENT_ID: 'client-id' }))).toThrow(
      /VITE_ENTRA_TENANT_ID is required/,
    );
  });

  it('returns the configured client and tenant IDs', () => {
    const config = getAppConfig(
      buildEnv({
        VITE_ENTRA_CLIENT_ID: 'client-id',
        VITE_ENTRA_TENANT_ID: 'tenant-id',
      }),
    );

    expect(config.auth).toMatchObject({
      clientId: 'client-id',
      tenantId: 'tenant-id',
      authority: 'https://login.microsoftonline.com/tenant-id',
    });
  });
});

function buildEnv(values: AppEnvironment): AppEnvironment {
  return values;
}
