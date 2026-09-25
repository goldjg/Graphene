import { describe, expect, it, vi } from 'vitest';

import { GraphClient } from './GraphClient.ts';
import { GraphApiError, mapGraphError } from './errors.ts';

describe('GraphClient', () => {
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

    await client.getTransitiveMemberOf('me');

    expect(fetchImpl).toHaveBeenCalledWith(
      'https://graph.example.test/v1.0/me/transitiveMemberOf',
      expect.anything(),
    );
  });
});
