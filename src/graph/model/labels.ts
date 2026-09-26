import type { GraphEdgeType, GraphNodeType } from './types.ts';

export const nodeTypeLabels: Record<GraphNodeType, string> = {
  user: 'User',
  group: 'Group',
  directoryRole: 'Directory role',
  tenantScope: 'Tenant scope',
  administrativeUnit: 'Administrative unit',
  appRegistration: 'App registration',
  enterpriseApplication: 'Enterprise application',
  appRole: 'App role',
  delegatedPermission: 'Delegated permission',
};

export const edgeTypeLabels: Record<GraphEdgeType, string> = {
  memberOf: 'Member of',
  transitiveMemberOf: 'Inherited member of',
  assignedRole: 'Assigned role',
  owns: 'Owns',
  scopedTo: 'Scoped to',
  appRoleAssignment: 'Assigned app role',
  delegatedPermissionGrant: 'Consented for',
  accesses: 'Accesses',
  assignedTo: 'Assigned to',
};
