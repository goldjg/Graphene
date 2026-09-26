import { describe, expect, it } from 'vitest';

import type { GraphClient } from '../client/GraphClient.ts';
import { buildInvestigationGraph } from './buildInvestigationGraph.ts';

function fakeGraphClient(overrides: Partial<GraphClient>): GraphClient {
  return overrides as GraphClient;
}

describe('buildInvestigationGraph', () => {
  it('builds both member and parent relationships for a group', async () => {
    const client = fakeGraphClient({
      getGroup: () => Promise.resolve({ id: 'group-root', displayName: 'Root group' }),
      getGroupMembers: () =>
        Promise.resolve([
          {
            id: 'user-direct',
            displayName: 'Direct user',
            '@odata.type': '#microsoft.graph.user',
          },
        ]),
      getGroupTransitiveMembers: () =>
        Promise.resolve([
          {
            id: 'user-direct',
            displayName: 'Direct user',
            '@odata.type': '#microsoft.graph.user',
          },
          {
            id: 'group-nested',
            displayName: 'Nested group',
            '@odata.type': '#microsoft.graph.group',
          },
        ]),
      getGroupMemberOf: () =>
        Promise.resolve([
          {
            id: 'role-direct',
            displayName: 'Direct role',
            '@odata.type': '#microsoft.graph.directoryRole',
          },
        ]),
      getGroupTransitiveMemberOf: () =>
        Promise.resolve([
          {
            id: 'role-direct',
            displayName: 'Direct role',
            '@odata.type': '#microsoft.graph.directoryRole',
          },
          {
            id: 'group-parent',
            displayName: 'Parent group',
            '@odata.type': '#microsoft.graph.group',
          },
        ]),
      getGroupOwners: () =>
        Promise.resolve([
          {
            id: 'owner-user',
            displayName: 'Owner',
            '@odata.type': '#microsoft.graph.user',
          },
        ]),
      getGroupAppRoleAssignments: () =>
        Promise.resolve([
          {
            id: 'group-assignment',
            principalId: 'group-root',
            principalType: 'Group',
            resourceId: 'resource-sp',
            resourceDisplayName: 'Resource app',
            appRoleId: 'role-id',
          },
        ]),
      getServicePrincipal: () =>
        Promise.resolve({
          id: 'resource-sp',
          displayName: 'Resource app',
          appRoles: [
            {
              id: 'role-id',
              value: 'Resource.Read.All',
              displayName: 'Read resource',
            },
          ],
        }),
      getOrganization: () => Promise.resolve({ id: 'tenant-1', displayName: 'Example tenant' }),
    });

    const graph = await buildInvestigationGraph(client, {
      type: 'group',
      identifier: '11111111-2222-3333-4444-555555555555',
    });

    expect(graph.nodes.map((node) => node.type)).toEqual(
      expect.arrayContaining(['group', 'user', 'directoryRole']),
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: 'user-direct',
          target: 'group-root',
          type: 'memberOf',
          inherited: false,
        }),
        expect.objectContaining({
          source: 'group-nested',
          target: 'group-root',
          type: 'transitiveMemberOf',
          inherited: true,
        }),
        expect.objectContaining({
          source: 'group-root',
          target: 'role-direct',
          type: 'assignedRole',
          inherited: false,
        }),
        expect.objectContaining({
          source: 'owner-user',
          target: 'group-root',
          type: 'owns',
        }),
        expect.objectContaining({
          source: 'group-root',
          target: 'appRole:resource-sp:role-id',
          type: 'appRoleAssignment',
        }),
      ]),
    );
  });

  it('builds application owners, the linked enterprise application, and app-role assignments', async () => {
    const client = fakeGraphClient({
      getApplication: () =>
        Promise.resolve({
          id: 'application-object',
          appId: '11111111-2222-3333-4444-555555555555',
          displayName: 'Graphene',
        }),
      getApplicationOwners: () =>
        Promise.resolve([
          {
            id: 'owner-user',
            displayName: 'Owner',
            '@odata.type': '#microsoft.graph.user',
          },
        ]),
      getServicePrincipalByAppId: () =>
        Promise.resolve({
          id: 'service-principal',
          appId: '11111111-2222-3333-4444-555555555555',
          displayName: 'Graphene',
        }),
      getServicePrincipalOwners: () => Promise.resolve([]),
      getServicePrincipalAppRoleAssignments: () =>
        Promise.resolve([
          {
            id: 'assignment-out',
            principalId: 'service-principal',
            principalType: 'ServicePrincipal',
            resourceId: 'resource-sp',
            resourceDisplayName: 'Microsoft Graph',
            appRoleId: 'role-id',
          },
        ]),
      getServicePrincipalAppRoleAssignedTo: () => Promise.resolve([]),
      getOAuth2PermissionGrantsByClient: () =>
        Promise.resolve([
          {
            id: 'grant-1',
            clientId: 'service-principal',
            consentType: 'AllPrincipals',
            principalId: null,
            resourceId: 'resource-sp',
            scope: 'User.Read Directory.Read.All',
          },
        ]),
      getServicePrincipal: () =>
        Promise.resolve({
          id: 'resource-sp',
          displayName: 'Microsoft Graph',
          appRoles: [{ id: 'role-id', value: 'Directory.Read.All' }],
          oauth2PermissionScopes: [
            {
              id: 'scope-user-read',
              value: 'User.Read',
              adminConsentDisplayName: 'Sign in and read user profile',
            },
            {
              id: 'scope-directory-read',
              value: 'Directory.Read.All',
              adminConsentDisplayName: 'Read directory data',
            },
          ],
        }),
    });

    const graph = await buildInvestigationGraph(client, {
      type: 'application',
      identifier: '11111111-2222-3333-4444-555555555555',
    });

    expect(graph.nodes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'application-object', type: 'appRegistration' }),
        expect.objectContaining({ id: 'service-principal', type: 'enterpriseApplication' }),
        expect.objectContaining({ id: 'owner-user', type: 'user' }),
        expect.objectContaining({ id: 'resource-sp', type: 'enterpriseApplication' }),
        expect.objectContaining({
          id: 'appRole:resource-sp:role-id',
          type: 'appRole',
          label: 'Directory.Read.All',
        }),
        expect.objectContaining({
          id: 'delegatedPermission:grant-1:User.Read',
          type: 'delegatedPermission',
          label: 'User.Read',
        }),
      ]),
    );
    expect(graph.edges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'owns', source: 'owner-user' }),
        expect.objectContaining({ type: 'assignedTo', target: 'service-principal' }),
        expect.objectContaining({
          id: 'appRoleAssignment:assignment-out',
          source: 'service-principal',
          target: 'appRole:resource-sp:role-id',
        }),
        expect.objectContaining({
          source: 'appRole:resource-sp:role-id',
          target: 'resource-sp',
          type: 'accesses',
        }),
        expect.objectContaining({
          source: 'service-principal',
          target: 'delegatedPermission:grant-1:Directory.Read.All',
          type: 'delegatedPermissionGrant',
        }),
      ]),
    );
  });

  it('builds directory-role member assignments with provenance', async () => {
    const client = fakeGraphClient({
      getDirectoryRole: () =>
        Promise.resolve({
          id: 'role-object',
          displayName: 'Global Reader',
          roleTemplateId: '11111111-2222-3333-4444-555555555555',
        }),
      getDirectoryRoleMembers: () =>
        Promise.resolve([
          {
            id: 'group-member',
            displayName: 'Readers',
            '@odata.type': '#microsoft.graph.group',
          },
        ]),
      getOrganization: () => Promise.resolve({ id: 'tenant-1', displayName: 'Example tenant' }),
    });

    const graph = await buildInvestigationGraph(client, {
      type: 'directoryRole',
      identifier: '11111111-2222-3333-4444-555555555555',
    });

    expect(graph.edges[0]).toMatchObject({
      source: 'group-member',
      target: 'role-object',
      type: 'assignedRole',
      provenance: {
        graphEndpoint: '/directoryRoles/role-object/members',
        sourceObjectId: 'role-object',
        direct: true,
      },
    });
  });

  it('rejects non-user targets that are not GUID identifiers', async () => {
    await expect(
      buildInvestigationGraph(fakeGraphClient({}), {
        type: 'group',
        identifier: 'Engineering',
      }),
    ).rejects.toThrow('valid Microsoft Entra object ID');
  });
});
