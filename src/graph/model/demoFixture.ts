import type { GraphEdge, GraphNode, InvestigationGraph } from './types.ts';

/**
 * Deterministic demo/development fixture.
 *
 * This fixture makes no Microsoft Graph calls, contains no production tenant
 * information, and exercises every GraphNodeType and GraphEdgeType with both
 * direct and inherited relationships so the graph foundation can be
 * developed and tested without a real Entra tenant.
 */

const demoNodes: GraphNode[] = [
  {
    id: 'tenant-demo',
    type: 'tenantScope',
    label: 'Contoso (demo)',
    subtitle: 'Tenant scope',
    metadata: { tenantId: '00000000-0000-4000-8000-000000000000' },
  },
  {
    id: 'user-ada',
    type: 'user',
    label: 'Ada Lovelace',
    subtitle: 'ada@contoso.example',
    metadata: {
      userPrincipalName: 'ada@contoso.example',
      accountEnabled: true,
      userType: 'Member',
    },
  },
  {
    id: 'user-grace',
    type: 'user',
    label: 'Grace Hopper',
    subtitle: 'grace@contoso.example',
    metadata: {
      userPrincipalName: 'grace@contoso.example',
      accountEnabled: true,
      userType: 'Member',
    },
  },
  {
    id: 'group-engineering',
    type: 'group',
    label: 'Engineering',
    subtitle: 'Security group',
    metadata: { securityEnabled: true, mailEnabled: false, groupTypes: [] },
  },
  {
    id: 'group-directory-readers',
    type: 'group',
    label: 'Directory Readers',
    subtitle: 'Role-assignable security group',
    metadata: { securityEnabled: true, mailEnabled: false, groupTypes: ['DynamicMembership'] },
  },
  {
    id: 'role-global-reader',
    type: 'directoryRole',
    label: 'Global Reader',
    subtitle: 'Directory role',
    metadata: { roleTemplateId: 'f2ef992c-3afb-46b9-b7cf-a126ee74c451' },
  },
  {
    id: 'au-emea',
    type: 'administrativeUnit',
    label: 'EMEA',
    subtitle: 'Administrative unit',
    metadata: { visibility: 'Public' },
  },
  {
    id: 'app-graphene',
    type: 'appRegistration',
    label: 'Graphene SPA',
    subtitle: 'App registration',
    metadata: { appId: '11111111-1111-4111-8111-111111111111', signInAudience: 'AzureADMyOrg' },
  },
  {
    id: 'sp-graphene',
    type: 'enterpriseApplication',
    label: 'Graphene SPA',
    subtitle: 'Enterprise application / service principal',
    metadata: {
      appId: '11111111-1111-4111-8111-111111111111',
      servicePrincipalType: 'Application',
    },
  },
  {
    id: 'approle-directory-read-all',
    type: 'appRole',
    label: 'Directory.Read.All',
    subtitle: 'Application permission (app role)',
    metadata: { value: 'Directory.Read.All', allowedMemberTypes: ['Application'] },
  },
  {
    id: 'permission-directory-read-all',
    type: 'delegatedPermission',
    label: 'Directory.Read.All',
    subtitle: 'Delegated permission',
    metadata: { value: 'Directory.Read.All', consentType: 'Admin' },
  },
];

const demoEdges: GraphEdge[] = [
  {
    id: 'edge-ada-memberof-engineering',
    source: 'user-ada',
    target: 'group-engineering',
    type: 'memberOf',
    inherited: false,
    provenance: {
      graphEndpoint: 'GET /users/{id}/memberOf',
      sourceObjectId: 'user-ada',
      direct: true,
      relatedObjectIds: ['user-ada', 'group-engineering'],
    },
    metadata: {},
  },
  {
    id: 'edge-engineering-memberof-directory-readers',
    source: 'group-engineering',
    target: 'group-directory-readers',
    type: 'memberOf',
    inherited: false,
    provenance: {
      graphEndpoint: 'GET /groups/{id}/memberOf',
      sourceObjectId: 'group-engineering',
      direct: true,
      relatedObjectIds: ['group-engineering', 'group-directory-readers'],
    },
    metadata: {},
  },
  {
    id: 'edge-ada-transitivememberof-directory-readers',
    source: 'user-ada',
    target: 'group-directory-readers',
    type: 'transitiveMemberOf',
    inherited: true,
    provenance: {
      graphEndpoint: 'GET /users/{id}/transitiveMemberOf',
      sourceObjectId: 'user-ada',
      direct: false,
      relatedObjectIds: ['user-ada', 'group-engineering', 'group-directory-readers'],
    },
    metadata: { inheritedThrough: 'group-engineering' },
  },
  {
    id: 'edge-directory-readers-assignedrole-global-reader',
    source: 'group-directory-readers',
    target: 'role-global-reader',
    type: 'assignedRole',
    inherited: false,
    provenance: {
      graphEndpoint: 'GET /roleManagement/directory/roleAssignments',
      sourceObjectId: 'group-directory-readers',
      direct: true,
      relatedObjectIds: ['group-directory-readers', 'role-global-reader'],
      assignmentId: 'assignment-demo-1',
    },
    metadata: {},
  },
  {
    id: 'edge-ada-assignedrole-global-reader',
    source: 'user-ada',
    target: 'role-global-reader',
    type: 'assignedRole',
    inherited: true,
    provenance: {
      graphEndpoint: 'GET /roleManagement/directory/roleAssignments',
      sourceObjectId: 'group-directory-readers',
      direct: false,
      relatedObjectIds: ['user-ada', 'group-directory-readers', 'role-global-reader'],
      assignmentId: 'assignment-demo-1',
    },
    metadata: { inheritedThrough: 'group-directory-readers' },
  },
  {
    id: 'edge-ada-scopedto-au-emea',
    source: 'user-ada',
    target: 'au-emea',
    type: 'scopedTo',
    inherited: false,
    provenance: {
      graphEndpoint: 'GET /directory/administrativeUnits/{id}/members',
      sourceObjectId: 'au-emea',
      direct: true,
      relatedObjectIds: ['user-ada', 'au-emea'],
    },
    metadata: {},
  },
  {
    id: 'edge-grace-owns-app-graphene',
    source: 'user-grace',
    target: 'app-graphene',
    type: 'owns',
    inherited: false,
    provenance: {
      graphEndpoint: 'GET /applications/{id}/owners',
      sourceObjectId: 'app-graphene',
      direct: true,
      relatedObjectIds: ['user-grace', 'app-graphene'],
    },
    metadata: {},
  },
  {
    id: 'edge-app-graphene-assignedto-sp-graphene',
    source: 'app-graphene',
    target: 'sp-graphene',
    type: 'assignedTo',
    inherited: false,
    provenance: {
      graphEndpoint: 'GET /servicePrincipals?$filter=appId eq {appId}',
      sourceObjectId: 'app-graphene',
      direct: true,
      relatedObjectIds: ['app-graphene', 'sp-graphene'],
    },
    metadata: {},
  },
  {
    id: 'edge-sp-graphene-accesses-tenant',
    source: 'sp-graphene',
    target: 'tenant-demo',
    type: 'accesses',
    inherited: false,
    provenance: {
      graphEndpoint: 'GET /servicePrincipals/{id}',
      sourceObjectId: 'sp-graphene',
      direct: true,
      relatedObjectIds: ['sp-graphene', 'tenant-demo'],
    },
    metadata: {},
  },
  {
    id: 'edge-sp-graphene-approleassignment-directory-read-all',
    source: 'sp-graphene',
    target: 'approle-directory-read-all',
    type: 'appRoleAssignment',
    inherited: false,
    provenance: {
      graphEndpoint: 'GET /servicePrincipals/{id}/appRoleAssignments',
      sourceObjectId: 'sp-graphene',
      direct: true,
      relatedObjectIds: ['sp-graphene', 'approle-directory-read-all'],
      assignmentId: 'approle-assignment-demo-1',
    },
    metadata: {},
  },
  {
    id: 'edge-ada-delegatedpermissiongrant-directory-read-all',
    source: 'user-ada',
    target: 'permission-directory-read-all',
    type: 'delegatedPermissionGrant',
    inherited: false,
    provenance: {
      graphEndpoint: 'GET /oauth2PermissionGrants',
      sourceObjectId: 'user-ada',
      direct: true,
      relatedObjectIds: ['user-ada', 'sp-graphene', 'permission-directory-read-all'],
      assignmentId: 'grant-demo-1',
    },
    metadata: {},
  },
];

export const demoInvestigationGraph: InvestigationGraph = {
  nodes: demoNodes,
  edges: demoEdges,
};
