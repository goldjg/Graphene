import { describe, expect, it } from 'vitest';

import { buildUserAccessGraph } from './buildUserAccessGraph.ts';
import type { GraphClient } from '../client/GraphClient.ts';

function fakeGraphClient(overrides: Partial<GraphClient>): GraphClient {
  return overrides as GraphClient;
}

describe('buildUserAccessGraph', () => {
  it('models direct memberships as non-inherited and transitive-only memberships as inherited', async () => {
    const client = fakeGraphClient({
      getUser: () =>
        Promise.resolve({
          id: 'user-1',
          displayName: 'Ada Lovelace',
          userPrincipalName: 'ada@example.test',
        }),
      getMemberOf: () =>
        Promise.resolve([
          {
            id: 'group-direct',
            displayName: 'Direct Group',
            '@odata.type': '#microsoft.graph.group',
          },
          {
            id: 'role-direct',
            displayName: 'Direct Role',
            '@odata.type': '#microsoft.graph.directoryRole',
          },
        ]),
      getTransitiveMemberOf: () =>
        Promise.resolve([
          {
            id: 'group-direct',
            displayName: 'Direct Group',
            '@odata.type': '#microsoft.graph.group',
          },
          {
            id: 'role-direct',
            displayName: 'Direct Role',
            '@odata.type': '#microsoft.graph.directoryRole',
          },
          {
            id: 'group-nested',
            displayName: 'Nested Group',
            '@odata.type': '#microsoft.graph.group',
          },
        ]),
      getOwnedObjects: () => Promise.resolve([]),
      getUserAppRoleAssignments: () => Promise.resolve([]),
      getOAuth2PermissionGrantsByPrincipal: () => Promise.resolve([]),
      getOrganization: () => Promise.resolve({ id: 'tenant-1', displayName: 'Example tenant' }),
    });

    const graph = await buildUserAccessGraph(client, 'user-1');

    expect(graph.nodes).toHaveLength(5);
    expect(graph.nodes.find((node) => node.id === 'user-1')?.type).toBe('user');
    expect(graph.nodes.find((node) => node.id === 'group-direct')?.type).toBe('group');
    expect(graph.nodes.find((node) => node.id === 'role-direct')?.type).toBe('directoryRole');
    expect(graph.nodes.find((node) => node.id === 'tenant-1')?.type).toBe('tenantScope');
    expect(graph.nodes.find((node) => node.id === 'user-1')?.isInvestigationTarget).toBe(true);

    const directGroupEdge = graph.edges.find((edge) => edge.target === 'group-direct');
    expect(directGroupEdge?.type).toBe('memberOf');
    expect(directGroupEdge?.inherited).toBe(false);
    expect(directGroupEdge?.provenance.direct).toBe(true);
    expect(directGroupEdge?.provenance.graphEndpoint).toBe('/users/user-1/memberOf');

    const directRoleEdge = graph.edges.find((edge) => edge.target === 'role-direct');
    expect(directRoleEdge?.type).toBe('assignedRole');
    expect(directRoleEdge?.inherited).toBe(false);
    expect(
      graph.edges.find((edge) => edge.source === 'role-direct' && edge.target === 'tenant-1')?.type,
    ).toBe('scopedTo');

    const nestedGroupEdge = graph.edges.find((edge) => edge.target === 'group-nested');
    expect(nestedGroupEdge?.type).toBe('transitiveMemberOf');
    expect(nestedGroupEdge?.inherited).toBe(true);
    expect(nestedGroupEdge?.provenance.direct).toBe(false);
    expect(nestedGroupEdge?.provenance.graphEndpoint).toBe('/users/user-1/transitiveMemberOf');
  });

  it('models supported administrative-unit memberships without guessing', async () => {
    const client = fakeGraphClient({
      getUser: () => Promise.resolve({ id: 'user-1', displayName: 'Ada Lovelace' }),
      getMemberOf: () => Promise.resolve([]),
      getTransitiveMemberOf: () =>
        Promise.resolve([
          {
            id: 'admin-unit-1',
            displayName: 'EMEA',
            '@odata.type': '#microsoft.graph.administrativeUnit',
          },
        ]),
      getOwnedObjects: () => Promise.resolve([]),
      getUserAppRoleAssignments: () => Promise.resolve([]),
      getOAuth2PermissionGrantsByPrincipal: () => Promise.resolve([]),
    });

    const graph = await buildUserAccessGraph(client, 'user-1');

    expect(graph.nodes).toHaveLength(2);
    expect(graph.nodes.find((node) => node.id === 'admin-unit-1')?.type).toBe('administrativeUnit');
    expect(graph.edges[0]).toMatchObject({
      source: 'user-1',
      target: 'admin-unit-1',
      type: 'scopedTo',
      inherited: true,
    });
  });
});
