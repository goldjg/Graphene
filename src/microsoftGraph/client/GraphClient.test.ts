import { describe, expect, it, vi } from 'vitest';

import { GraphClient } from './GraphClient.ts';
import { GraphApiError, mapGraphError } from './errors.ts';

describe('GraphClient', () => {
  it('binds the default browser fetch to its global receiver', async () => {
    const response = new Response(JSON.stringify({ id: 'user-id' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    const browserFetch = vi.fn<typeof fetch>(function (
      this: unknown,
      input: RequestInfo | URL,
      init?: RequestInit,
    ) {
      void input;
      void init;

      if (this !== globalThis) {
        throw new TypeError('Can only call Window.fetch on instances of Window');
      }

      return Promise.resolve(response);
    });
    vi.stubGlobal('fetch', browserFetch);

    const client = new GraphClient({
      tokenProvider: () => Promise.resolve('access-token'),
    });

    await expect(client.getCurrentUser()).resolves.toMatchObject({ id: 'user-id' });
    expect(browserFetch.mock.calls[0]?.[0]).toBe('https://graph.microsoft.com/v1.0/me');
  });

  it('calls /me with a bearer token', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 'user-id',
          displayName: 'Ada Lovelace',
          userPrincipalName: 'ada@example.test',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const client = new GraphClient({
      tokenProvider: () => Promise.resolve('access-token'),
      baseUrl: 'https://graph.example.test/v1.0',
      fetchImpl,
    });

    await expect(client.getCurrentUser()).resolves.toMatchObject({
      id: 'user-id',
      displayName: 'Ada Lovelace',
    });
    expect(fetchImpl).toHaveBeenCalledWith(
      'https://graph.example.test/v1.0/me',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer access-token',
        }) as HeadersInit,
      }),
    );
  });

  it('maps Graph 403 responses to permission guidance', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: {
            code: 'Authorization_RequestDenied',
            message: 'Insufficient privileges to complete the operation.',
          },
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const client = new GraphClient({
      tokenProvider: () => Promise.resolve('access-token'),
      fetchImpl,
    });

    await expect(client.getCurrentUser()).rejects.toBeInstanceOf(GraphApiError);

    try {
      await client.getCurrentUser();
    } catch (error) {
      const mappedError = mapGraphError(error);

      expect(mappedError.title).toBe('Microsoft Graph permission unavailable');
      expect(mappedError.remediation).toContain('will not silently request broader permissions');
    }
  });

  it('preserves Retry-After on Graph throttling errors', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ error: { code: 'TooManyRequests' } }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '12',
        },
      }),
    );
    const client = new GraphClient({
      tokenProvider: () => Promise.resolve('access-token'),
      fetchImpl,
    });

    try {
      await client.getCurrentUser();
    } catch (error) {
      expect(error).toBeInstanceOf(GraphApiError);
      expect(mapGraphError(error).message).toContain('12 seconds');
    }
  });

  it('follows @odata.nextLink to combine paginated memberOf results', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            value: [{ id: 'group-1', '@odata.type': '#microsoft.graph.group' }],
            '@odata.nextLink': 'https://graph.example.test/v1.0/users/user-1/memberOf?page=2',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            value: [{ id: 'group-2', '@odata.type': '#microsoft.graph.group' }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    const client = new GraphClient({
      tokenProvider: () => Promise.resolve('access-token'),
      baseUrl: 'https://graph.example.test/v1.0',
      fetchImpl,
    });

    const memberships = await client.getMemberOf('user-1');

    expect(memberships).toHaveLength(2);
    expect(memberships.map((membership) => membership.id)).toEqual(['group-1', 'group-2']);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(fetchImpl.mock.calls[1]?.[0]).toBe(
      'https://graph.example.test/v1.0/users/user-1/memberOf?page=2',
    );
  });

  it('addresses the signed-in user via /me rather than /users/me', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ value: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const client = new GraphClient({
      tokenProvider: () => Promise.resolve('access-token'),
      baseUrl: 'https://graph.example.test/v1.0',
      fetchImpl,
    });

    await client.getTransitiveMemberOf('me');

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://graph.example.test/v1.0/me/transitiveMemberOf',
      expect.anything(),
    );
  });

  it('searches the selected object type with one bounded advanced query', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          value: [
            {
              id: 'group-1',
              displayName: 'Engineering Team',
              mail: 'engineering@example.test',
            },
          ],
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const client = new GraphClient({
      tokenProvider: () => Promise.resolve('access-token'),
      baseUrl: 'https://graph.example.test/v1.0',
      fetchImpl,
    });

    await expect(client.searchObjects('group', 'engin')).resolves.toEqual([
      {
        id: 'group-1',
        label: 'Engineering Team',
        detail: 'engineering@example.test',
        type: 'group',
      },
    ]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);

    const [requestUrl, requestInit] = fetchImpl.mock.calls[0] ?? [];
    expect(typeof requestUrl).toBe('string');
    const url = new URL(requestUrl as string);
    expect(url.pathname).toBe('/v1.0/groups');
    expect(url.searchParams.get('$search')).toBe('"displayName:engin" OR "mail:engin"');
    expect(url.searchParams.get('$select')).toBe('id,displayName,mail');
    expect(url.searchParams.get('$top')).toBe('8');
    expect(requestInit).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({
          ConsistencyLevel: 'eventual',
        }) as HeadersInit,
      }),
    );
  });

  it('does not request suggestions for short queries and caps returned results', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          value: Array.from({ length: 10 }, (_, index) => ({
            id: `user-${index}`,
            displayName: `User ${index}`,
            userPrincipalName: `user${index}@example.test`,
          })),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    const client = new GraphClient({
      tokenProvider: () => Promise.resolve('access-token'),
      baseUrl: 'https://graph.example.test/v1.0',
      fetchImpl,
    });

    await expect(client.searchObjects('user', 'a')).resolves.toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();

    await expect(client.searchObjects('user', 'user')).resolves.toHaveLength(8);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('falls back from an application object ID to the appId alternate key', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: { message: 'Not found' } }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 'application-object', appId: 'client-id' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      );
    const client = new GraphClient({
      tokenProvider: () => Promise.resolve('access-token'),
      baseUrl: 'https://graph.example.test/v1.0',
      fetchImpl,
    });

    await expect(client.getApplication('client-id')).resolves.toMatchObject({
      id: 'application-object',
    });
    expect(fetchImpl.mock.calls[1]?.[0]).toBe(
      "https://graph.example.test/v1.0/applications(appId='client-id')?$select=id,appId,displayName,description,signInAudience,publisherDomain,disabledByMicrosoftStatus",
    );
  });

  it('uses the v1.0 service-principal app-role relationship endpoints', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ value: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const client = new GraphClient({
      tokenProvider: () => Promise.resolve('access-token'),
      baseUrl: 'https://graph.example.test/v1.0',
      fetchImpl,
    });

    await client.getServicePrincipalAppRoleAssignments('sp-1');
    await client.getServicePrincipalAppRoleAssignedTo('sp-1');

    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([
      'https://graph.example.test/v1.0/servicePrincipals/sp-1/appRoleAssignments',
      'https://graph.example.test/v1.0/servicePrincipals/sp-1/appRoleAssignedTo',
    ]);
  });

  it('requests the supported richer service-principal metadata', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ id: 'sp-1' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const client = new GraphClient({
      tokenProvider: () => Promise.resolve('access-token'),
      baseUrl: 'https://graph.example.test/v1.0',
      fetchImpl,
    });

    await client.getServicePrincipal('sp-1');

    expect(fetchImpl.mock.calls[0]?.[0]).toContain('preferredSingleSignOnMode,tags');
  });

  it('fails explicitly instead of returning a silently truncated collection', async () => {
    let page = 0;
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(() => {
      page += 1;
      return Promise.resolve(
        new Response(
          JSON.stringify({
            value: [],
            '@odata.nextLink': `https://graph.example.test/v1.0/groups/group-1/members?page=${
              page + 1
            }`,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      );
    });
    const client = new GraphClient({
      tokenProvider: () => Promise.resolve('access-token'),
      baseUrl: 'https://graph.example.test/v1.0',
      fetchImpl,
    });

    await expect(client.getGroupMembers('group-1')).rejects.toThrow(
      'exceeded the safe 50-page limit',
    );
    expect(fetchImpl).toHaveBeenCalledTimes(50);
  });

  it('requests complete user app-role assignments with advanced-query headers', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ value: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const client = new GraphClient({
      tokenProvider: () => Promise.resolve('access-token'),
      baseUrl: 'https://graph.example.test/v1.0',
      fetchImpl,
    });

    await client.getUserAppRoleAssignments('me');

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://graph.example.test/v1.0/me/appRoleAssignments?$count=true',
      expect.objectContaining({
        headers: expect.objectContaining({
          ConsistencyLevel: 'eventual',
        }) as HeadersInit,
      }),
    );
  });

  it('filters delegated permission grants by client service principal ID', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ value: [] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const client = new GraphClient({
      tokenProvider: () => Promise.resolve('access-token'),
      baseUrl: 'https://graph.example.test/v1.0',
      fetchImpl,
    });

    await client.getOAuth2PermissionGrantsByClient('client-sp-id');

    expect(fetchImpl.mock.calls[0]?.[0]).toBe(
      'https://graph.example.test/v1.0/oauth2PermissionGrants?%24filter=clientId+eq+%27client-sp-id%27',
    );
  });

  it('returns the signed-in organization from the collection endpoint', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify({ value: [{ id: 'tenant-1', displayName: 'Example' }] }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    const client = new GraphClient({
      tokenProvider: () => Promise.resolve('access-token'),
      baseUrl: 'https://graph.example.test/v1.0',
      fetchImpl,
    });

    await expect(client.getOrganization()).resolves.toMatchObject({ id: 'tenant-1' });
  });

  it('uses v1.0 administrative-unit and device relationship endpoints', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ value: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    );
    const client = new GraphClient({
      tokenProvider: () => Promise.resolve('access-token'),
      baseUrl: 'https://graph.example.test/v1.0',
      fetchImpl,
    });

    await client.getAdministrativeUnitMembers('au-1');
    await client.getDeviceRegisteredOwners('device-1');
    await client.getDeviceRegisteredUsers('device-1');

    expect(fetchImpl.mock.calls.map(([url]) => url)).toEqual([
      'https://graph.example.test/v1.0/directory/administrativeUnits/au-1/members',
      'https://graph.example.test/v1.0/devices/device-1/registeredOwners',
      'https://graph.example.test/v1.0/devices/device-1/registeredUsers',
    ]);
  });
});
