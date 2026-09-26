import type { GraphClient } from '../client/GraphClient.ts';
import type { GraphAppRoleAssignment } from '../dto/appRoleAssignment.ts';
import type { GraphDirectoryObject } from '../dto/directoryObject.ts';
import type { GraphOAuth2PermissionGrant } from '../dto/oauth2PermissionGrant.ts';
import type { GraphOrganization } from '../dto/organization.ts';
import type {
  GraphAppRoleDefinition,
  GraphPermissionScopeDefinition,
  GraphServicePrincipal,
} from '../dto/servicePrincipal.ts';
import type { GraphEdge, GraphNode, InvestigationGraph } from '../../graph/model/types.ts';
import {
  toApplicationNode,
  toDirectoryObjectNode,
  toDirectoryRoleNode,
  toGroupNode,
  toServicePrincipalNode,
  toTenantScopeNode,
  toUserNode,
} from './normalizers.ts';
import { validateInvestigationTarget, type InvestigationTarget } from './target.ts';

interface GraphAccumulator {
  nodes: Map<string, GraphNode>;
  edges: Map<string, GraphEdge>;
}

export async function buildInvestigationGraph(
  graphClient: GraphClient,
  target: InvestigationTarget,
  signal?: AbortSignal,
): Promise<InvestigationGraph> {
  const normalizedTarget = { ...target, identifier: target.identifier.trim() };
  const validationError = validateInvestigationTarget(normalizedTarget);

  if (validationError) {
    throw new Error(validationError);
  }

  switch (normalizedTarget.type) {
    case 'user':
      return buildUserAccessGraph(graphClient, normalizedTarget.identifier, signal);
    case 'group':
      return buildGroupAccessGraph(graphClient, normalizedTarget.identifier, signal);
    case 'application':
      return buildApplicationAccessGraph(graphClient, normalizedTarget.identifier, signal);
    case 'servicePrincipal':
      return buildServicePrincipalAccessGraph(graphClient, normalizedTarget.identifier, signal);
    case 'directoryRole':
      return buildDirectoryRoleAccessGraph(graphClient, normalizedTarget.identifier, signal);
  }
}

export async function buildUserAccessGraph(
  graphClient: GraphClient,
  userId: string,
  signal?: AbortSignal,
): Promise<InvestigationGraph> {
  const user = await graphClient.getUser(userId, signal);
  const [
    directMemberships,
    transitiveMemberships,
    ownedObjects,
    appRoleAssignments,
    delegatedPermissionGrants,
  ] = await Promise.all([
    graphClient.getMemberOf(userId, signal),
    graphClient.getTransitiveMemberOf(userId, signal),
    graphClient.getOwnedObjects(userId, signal),
    graphClient.getUserAppRoleAssignments(userId, signal),
    graphClient.getOAuth2PermissionGrantsByPrincipal(user.id, signal),
  ]);
  const graph = createAccumulator();
  const userNode = markInvestigationTarget(toUserNode(user));
  addNode(graph, userNode);
  addParentMemberships(
    graph,
    userNode.id,
    directMemberships,
    transitiveMemberships,
    userId === 'me' ? '/me' : `/users/${encodeURIComponent(userId)}`,
  );
  addOwnedObjects(
    graph,
    userNode.id,
    ownedObjects,
    `${userId === 'me' ? '/me' : `/users/${encodeURIComponent(userId)}`}/ownedObjects`,
  );
  await addPrincipalAppRoleAssignments(
    graph,
    graphClient,
    userNode,
    appRoleAssignments,
    `${userId === 'me' ? '/me' : `/users/${encodeURIComponent(userId)}`}/appRoleAssignments`,
    signal,
  );
  await addDelegatedPermissionGrants(
    graph,
    graphClient,
    userNode,
    delegatedPermissionGrants,
    `/oauth2PermissionGrants?$filter=principalId eq '${userNode.id}'`,
    signal,
  );
  await addTenantScopeForRoles(graph, graphClient, signal);
  return finish(graph);
}

async function buildGroupAccessGraph(
  graphClient: GraphClient,
  groupId: string,
  signal?: AbortSignal,
): Promise<InvestigationGraph> {
  const [
    group,
    directMembers,
    transitiveMembers,
    directParents,
    transitiveParents,
    owners,
    assignments,
  ] = await Promise.all([
    graphClient.getGroup(groupId, signal),
    graphClient.getGroupMembers(groupId, signal),
    graphClient.getGroupTransitiveMembers(groupId, signal),
    graphClient.getGroupMemberOf(groupId, signal),
    graphClient.getGroupTransitiveMemberOf(groupId, signal),
    graphClient.getGroupOwners(groupId, signal),
    graphClient.getGroupAppRoleAssignments(groupId, signal),
  ]);
  const graph = createAccumulator();
  const groupNode = markInvestigationTarget(toGroupNode(group));
  addNode(graph, groupNode);
  addGroupMembers(graph, groupNode.id, directMembers, transitiveMembers);
  addParentMemberships(
    graph,
    groupNode.id,
    directParents,
    transitiveParents,
    `/groups/${groupNode.id}`,
  );
  addOwnerRelationships(graph, groupNode.id, owners, `/groups/${groupNode.id}/owners`);
  await addPrincipalAppRoleAssignments(
    graph,
    graphClient,
    groupNode,
    assignments,
    `/groups/${groupNode.id}/appRoleAssignments`,
    signal,
  );
  await addTenantScopeForRoles(graph, graphClient, signal);
  return finish(graph);
}

async function buildApplicationAccessGraph(
  graphClient: GraphClient,
  identifier: string,
  signal?: AbortSignal,
): Promise<InvestigationGraph> {
  const application = await graphClient.getApplication(identifier, signal);
  const owners = await graphClient.getApplicationOwners(application.id, signal);
  const graph = createAccumulator();
  const applicationNode = markInvestigationTarget(toApplicationNode(application));
  addNode(graph, applicationNode);
  addOwnerRelationships(
    graph,
    applicationNode.id,
    owners,
    `/applications/${application.id}/owners`,
  );

  if (application.appId) {
    const servicePrincipal = await graphClient.getServicePrincipalByAppId(
      application.appId,
      signal,
    );

    if (servicePrincipal) {
      addApplicationServicePrincipalLink(graph, applicationNode.id, servicePrincipal);
      await addServicePrincipalRelationships(graph, graphClient, servicePrincipal, signal, false);
    }
  }

  return finish(graph);
}

async function buildServicePrincipalAccessGraph(
  graphClient: GraphClient,
  identifier: string,
  signal?: AbortSignal,
): Promise<InvestigationGraph> {
  const servicePrincipal = await graphClient.getServicePrincipal(identifier, signal);
  const graph = createAccumulator();
  await addServicePrincipalRelationships(graph, graphClient, servicePrincipal, signal, true, true);
  return finish(graph);
}

async function buildDirectoryRoleAccessGraph(
  graphClient: GraphClient,
  identifier: string,
  signal?: AbortSignal,
): Promise<InvestigationGraph> {
  const role = await graphClient.getDirectoryRole(identifier, signal);
  const [members, organization] = await Promise.all([
    graphClient.getDirectoryRoleMembers(role.id, signal),
    graphClient.getOrganization(signal),
  ]);
  const graph = createAccumulator();
  const roleNode = markInvestigationTarget(toDirectoryRoleNode(role));
  addNode(graph, roleNode);

  for (const member of members) {
    const memberNode = toDirectoryObjectNode(member);
    if (!memberNode) {
      continue;
    }

    addNode(graph, memberNode);
    addEdge(graph, {
      id: `assignedRole:${memberNode.id}:${roleNode.id}`,
      source: memberNode.id,
      target: roleNode.id,
      type: 'assignedRole',
      inherited: false,
      provenance: {
        graphEndpoint: `/directoryRoles/${roleNode.id}/members`,
        sourceObjectId: roleNode.id,
        direct: true,
        relatedObjectIds: [memberNode.id, roleNode.id],
      },
      metadata: {},
    });
  }

  addTenantScopeNodeForRoles(graph, organization);
  return finish(graph);
}

async function addServicePrincipalRelationships(
  graph: GraphAccumulator,
  graphClient: GraphClient,
  servicePrincipal: GraphServicePrincipal,
  signal: AbortSignal | undefined,
  includeLinkedApplication: boolean,
  markAsTarget = false,
): Promise<void> {
  const [owners, outgoingAssignments, incomingAssignments, linkedApplication, delegatedGrants] =
    await Promise.all([
      graphClient.getServicePrincipalOwners(servicePrincipal.id, signal),
      graphClient.getServicePrincipalAppRoleAssignments(servicePrincipal.id, signal),
      graphClient.getServicePrincipalAppRoleAssignedTo(servicePrincipal.id, signal),
      includeLinkedApplication && servicePrincipal.appId
        ? graphClient.getApplicationByAppId(servicePrincipal.appId, signal)
        : Promise.resolve(null),
      graphClient.getOAuth2PermissionGrantsByClient(servicePrincipal.id, signal),
    ]);
  const normalizedServicePrincipalNode = toServicePrincipalNode(servicePrincipal);
  const servicePrincipalNode = markAsTarget
    ? markInvestigationTarget(normalizedServicePrincipalNode)
    : normalizedServicePrincipalNode;
  addNode(graph, servicePrincipalNode);
  addOwnerRelationships(
    graph,
    servicePrincipalNode.id,
    owners,
    `/servicePrincipals/${servicePrincipal.id}/owners`,
  );

  if (linkedApplication) {
    const applicationNode = toApplicationNode(linkedApplication);
    addNode(graph, applicationNode);
    addApplicationServicePrincipalLink(graph, applicationNode.id, servicePrincipal);
  }

  await addPrincipalAppRoleAssignments(
    graph,
    graphClient,
    servicePrincipalNode,
    outgoingAssignments,
    `/servicePrincipals/${servicePrincipalNode.id}/appRoleAssignments`,
    signal,
  );

  for (const assignment of incomingAssignments) {
    addIncomingAppRoleAssignment(graph, servicePrincipalNode, servicePrincipal, assignment);
  }

  await addDelegatedPermissionGrants(
    graph,
    graphClient,
    servicePrincipalNode,
    delegatedGrants,
    `/oauth2PermissionGrants?$filter=clientId eq '${servicePrincipalNode.id}'`,
    signal,
  );
}

function addGroupMembers(
  graph: GraphAccumulator,
  groupId: string,
  directMembers: GraphDirectoryObject[],
  transitiveMembers: GraphDirectoryObject[],
): void {
  const directIds = new Set(directMembers.map((member) => member.id));

  for (const member of combineDirectoryObjects(directMembers, transitiveMembers)) {
    const memberNode = toDirectoryObjectNode(member);
    if (!memberNode) {
      continue;
    }

    const direct = directIds.has(member.id);
    addNode(graph, memberNode);
    addEdge(graph, {
      id: `${direct ? 'memberOf' : 'transitiveMemberOf'}:${memberNode.id}:${groupId}`,
      source: memberNode.id,
      target: groupId,
      type: direct ? 'memberOf' : 'transitiveMemberOf',
      inherited: !direct,
      provenance: {
        graphEndpoint: `/groups/${groupId}/${direct ? 'members' : 'transitiveMembers'}`,
        sourceObjectId: groupId,
        direct,
        relatedObjectIds: [memberNode.id, groupId],
      },
      metadata: {},
    });
  }
}

function addParentMemberships(
  graph: GraphAccumulator,
  sourceId: string,
  directMemberships: GraphDirectoryObject[],
  transitiveMemberships: GraphDirectoryObject[],
  sourcePath: string,
): void {
  const directIds = new Set(directMemberships.map((membership) => membership.id));

  for (const membership of combineDirectoryObjects(directMemberships, transitiveMemberships)) {
    const targetNode = toDirectoryObjectNode(membership);
    if (!targetNode) {
      continue;
    }

    const direct = directIds.has(membership.id);
    const relationship = parentRelationship(targetNode, direct);
    if (!relationship) {
      continue;
    }

    addNode(graph, targetNode);
    addEdge(graph, {
      id: `${relationship.type}:${sourceId}:${targetNode.id}`,
      source: sourceId,
      target: targetNode.id,
      type: relationship.type,
      inherited: !direct,
      provenance: {
        graphEndpoint: `${sourcePath}/${direct ? 'memberOf' : 'transitiveMemberOf'}`,
        sourceObjectId: sourceId,
        direct,
        relatedObjectIds: [sourceId, targetNode.id],
      },
      metadata: {},
    });
  }
}

function parentRelationship(
  targetNode: GraphNode,
  direct: boolean,
): { type: GraphEdge['type'] } | null {
  if (targetNode.type === 'group') {
    return { type: direct ? 'memberOf' : 'transitiveMemberOf' };
  }
  if (targetNode.type === 'directoryRole') {
    return { type: 'assignedRole' };
  }
  if (targetNode.type === 'administrativeUnit') {
    return { type: 'scopedTo' };
  }
  return null;
}

function addOwnerRelationships(
  graph: GraphAccumulator,
  ownedObjectId: string,
  owners: GraphDirectoryObject[],
  graphEndpoint: string,
): void {
  for (const owner of owners) {
    const ownerNode = toDirectoryObjectNode(owner);
    if (!ownerNode) {
      continue;
    }

    addNode(graph, ownerNode);
    addEdge(graph, {
      id: `owns:${ownerNode.id}:${ownedObjectId}`,
      source: ownerNode.id,
      target: ownedObjectId,
      type: 'owns',
      inherited: false,
      provenance: {
        graphEndpoint,
        sourceObjectId: ownedObjectId,
        direct: true,
        relatedObjectIds: [ownerNode.id, ownedObjectId],
      },
      metadata: {},
    });
  }
}

function addApplicationServicePrincipalLink(
  graph: GraphAccumulator,
  applicationId: string,
  servicePrincipal: GraphServicePrincipal,
): void {
  const servicePrincipalNode = toServicePrincipalNode(servicePrincipal);
  addNode(graph, servicePrincipalNode);
  addEdge(graph, {
    id: `assignedTo:${applicationId}:${servicePrincipalNode.id}`,
    source: applicationId,
    target: servicePrincipalNode.id,
    type: 'assignedTo',
    inherited: false,
    provenance: {
      graphEndpoint: `/servicePrincipals(appId='${servicePrincipal.appId ?? ''}')`,
      sourceObjectId: applicationId,
      direct: true,
      relatedObjectIds: [applicationId, servicePrincipalNode.id],
    },
    metadata: {},
  });
}

async function addPrincipalAppRoleAssignments(
  graph: GraphAccumulator,
  graphClient: GraphClient,
  principalNode: GraphNode,
  assignments: GraphAppRoleAssignment[],
  graphEndpoint: string,
  signal?: AbortSignal,
): Promise<void> {
  const resources = await resolveResourceServicePrincipals(graphClient, assignments, signal);

  for (const assignment of assignments) {
    const resource = resources.get(assignment.resourceId);
    addResolvedAppRoleAssignment(
      graph,
      principalNode,
      assignment,
      resource,
      graphEndpoint,
      principalNode.id,
    );
  }
}

function addResolvedAppRoleAssignment(
  graph: GraphAccumulator,
  principalNode: GraphNode,
  assignment: GraphAppRoleAssignment,
  resource: GraphServicePrincipal | undefined,
  graphEndpoint: string,
  queriedObjectId: string,
): void {
  const resourceNode = resource
    ? toServicePrincipalNode(resource)
    : ({
        id: assignment.resourceId,
        type: 'enterpriseApplication',
        label: assignment.resourceDisplayName ?? assignment.resourceId,
        subtitle: 'Enterprise application / service principal',
        metadata: {},
      } satisfies GraphNode);
  const appRole = findAppRoleDefinition(resource, assignment.appRoleId);
  const appRoleNode = toAppRoleNode(assignment, resourceNode, appRole);

  addNode(graph, resourceNode);
  addNode(graph, appRoleNode);
  addEdge(graph, {
    id: `appRoleAssignment:${assignment.id}`,
    source: principalNode.id,
    target: appRoleNode.id,
    type: 'appRoleAssignment',
    inherited: false,
    provenance: {
      graphEndpoint,
      sourceObjectId: queriedObjectId,
      direct: true,
      relatedObjectIds: [principalNode.id, appRoleNode.id, resourceNode.id],
      assignmentId: assignment.id,
    },
    metadata: {
      appRoleId: assignment.appRoleId,
      principalType: assignment.principalType,
      resourceId: assignment.resourceId,
    },
  });
  addEdge(graph, {
    id: `accesses:${assignment.id}`,
    source: appRoleNode.id,
    target: resourceNode.id,
    type: 'accesses',
    inherited: false,
    provenance: {
      graphEndpoint,
      sourceObjectId: queriedObjectId,
      direct: true,
      relatedObjectIds: [principalNode.id, appRoleNode.id, resourceNode.id],
      assignmentId: assignment.id,
    },
    metadata: { appRoleId: assignment.appRoleId },
  });
}

function addIncomingAppRoleAssignment(
  graph: GraphAccumulator,
  servicePrincipalNode: GraphNode,
  servicePrincipal: GraphServicePrincipal,
  assignment: GraphAppRoleAssignment,
): void {
  const principalNode = assignmentPrincipalNode(assignment);
  if (!principalNode) {
    return;
  }

  addNode(graph, principalNode);
  addResolvedAppRoleAssignment(
    graph,
    principalNode,
    assignment,
    servicePrincipal,
    `/servicePrincipals/${servicePrincipalNode.id}/appRoleAssignedTo`,
    servicePrincipalNode.id,
  );
}

function toAppRoleNode(
  assignment: GraphAppRoleAssignment,
  resourceNode: GraphNode,
  definition: GraphAppRoleDefinition | undefined,
): GraphNode {
  const appRoleId = assignment.appRoleId ?? '00000000-0000-0000-0000-000000000000';
  const label =
    definition?.value ??
    definition?.displayName ??
    (appRoleId === '00000000-0000-0000-0000-000000000000' ? 'Default access' : appRoleId);

  return {
    id: `appRole:${resourceNode.id}:${appRoleId}`,
    type: 'appRole',
    label,
    subtitle: definition?.displayName ?? `App role on ${resourceNode.label}`,
    metadata: {
      appRoleId,
      value: definition?.value,
      displayName: definition?.displayName,
      description: definition?.description,
      allowedMemberTypes: definition?.allowedMemberTypes,
      isEnabled: definition?.isEnabled,
      resourceId: resourceNode.id,
      resourceDisplayName: resourceNode.label,
    },
  };
}

function findAppRoleDefinition(
  servicePrincipal: GraphServicePrincipal | undefined,
  appRoleId: string | null | undefined,
): GraphAppRoleDefinition | undefined {
  return servicePrincipal?.appRoles?.find((appRole) => appRole.id === appRoleId);
}

async function resolveResourceServicePrincipals(
  graphClient: GraphClient,
  assignments: GraphAppRoleAssignment[],
  signal?: AbortSignal,
): Promise<Map<string, GraphServicePrincipal>> {
  const resourceIds = [...new Set(assignments.map((assignment) => assignment.resourceId))];
  const resources = await Promise.all(
    resourceIds.map((resourceId) => graphClient.getServicePrincipal(resourceId, signal)),
  );
  return new Map(resources.map((resource) => [resource.id, resource]));
}

async function addDelegatedPermissionGrants(
  graph: GraphAccumulator,
  graphClient: GraphClient,
  sourceNode: GraphNode,
  grants: GraphOAuth2PermissionGrant[],
  graphEndpoint: string,
  signal?: AbortSignal,
): Promise<void> {
  const resourceIds = [...new Set(grants.map((grant) => grant.resourceId))];
  const resources = await Promise.all(
    resourceIds.map((resourceId) => graphClient.getServicePrincipal(resourceId, signal)),
  );
  const resourcesById = new Map(resources.map((resource) => [resource.id, resource]));

  for (const grant of grants) {
    const resource = resourcesById.get(grant.resourceId);
    const resourceNode = resource
      ? toServicePrincipalNode(resource)
      : ({
          id: grant.resourceId,
          type: 'enterpriseApplication',
          label: grant.resourceId,
          subtitle: 'Enterprise application / service principal',
          metadata: {},
        } satisfies GraphNode);
    addNode(graph, resourceNode);

    for (const scope of parsePermissionScopes(grant.scope)) {
      const definition = findPermissionScopeDefinition(resource, scope);
      const permissionNode = toDelegatedPermissionNode(grant, resourceNode, scope, definition);
      addNode(graph, permissionNode);
      addEdge(graph, {
        id: `delegatedPermissionGrant:${grant.id}:${scope}:${sourceNode.id}`,
        source: sourceNode.id,
        target: permissionNode.id,
        type: 'delegatedPermissionGrant',
        inherited: false,
        provenance: {
          graphEndpoint,
          sourceObjectId: sourceNode.id,
          direct: true,
          relatedObjectIds: [sourceNode.id, permissionNode.id, resourceNode.id],
          assignmentId: grant.id,
        },
        metadata: {
          clientId: grant.clientId,
          consentType: grant.consentType,
          principalId: grant.principalId,
          resourceId: grant.resourceId,
          scope,
        },
      });
      addEdge(graph, {
        id: `accesses:${grant.id}:${scope}`,
        source: permissionNode.id,
        target: resourceNode.id,
        type: 'accesses',
        inherited: false,
        provenance: {
          graphEndpoint,
          sourceObjectId: sourceNode.id,
          direct: true,
          relatedObjectIds: [sourceNode.id, permissionNode.id, resourceNode.id],
          assignmentId: grant.id,
        },
        metadata: { scope },
      });
    }
  }
}

function toDelegatedPermissionNode(
  grant: GraphOAuth2PermissionGrant,
  resourceNode: GraphNode,
  scope: string,
  definition: GraphPermissionScopeDefinition | undefined,
): GraphNode {
  return {
    id: `delegatedPermission:${grant.id}:${scope}`,
    type: 'delegatedPermission',
    label: definition?.value ?? scope,
    subtitle:
      definition?.adminConsentDisplayName ??
      definition?.userConsentDisplayName ??
      `Delegated permission on ${resourceNode.label}`,
    metadata: {
      permissionGrantId: grant.id,
      permissionId: definition?.id,
      clientId: grant.clientId,
      consentType: grant.consentType,
      principalId: grant.principalId,
      resourceId: grant.resourceId,
      resourceDisplayName: resourceNode.label,
      scope,
      adminConsentDescription: definition?.adminConsentDescription,
      userConsentDescription: definition?.userConsentDescription,
      isEnabled: definition?.isEnabled,
    },
  };
}

function parsePermissionScopes(scope: string | null | undefined): string[] {
  const scopes = scope?.split(/\s+/).filter(Boolean) ?? [];
  return scopes.length > 0 ? scopes : ['(no scope)'];
}

function findPermissionScopeDefinition(
  servicePrincipal: GraphServicePrincipal | undefined,
  scope: string,
): GraphPermissionScopeDefinition | undefined {
  return servicePrincipal?.oauth2PermissionScopes?.find(
    (permissionScope) => permissionScope.value === scope,
  );
}

async function addTenantScopeForRoles(
  graph: GraphAccumulator,
  graphClient: GraphClient,
  signal?: AbortSignal,
): Promise<void> {
  const hasRoles = [...graph.nodes.values()].some((node) => node.type === 'directoryRole');
  if (!hasRoles) {
    return;
  }

  const organization = await graphClient.getOrganization(signal);
  addTenantScopeNodeForRoles(graph, organization);
}

function addTenantScopeNodeForRoles(
  graph: GraphAccumulator,
  organization: GraphOrganization,
): void {
  const roles = [...graph.nodes.values()].filter((node) => node.type === 'directoryRole');
  if (roles.length === 0) {
    return;
  }

  const tenantNode = toTenantScopeNode(organization);
  addNode(graph, tenantNode);

  for (const role of roles) {
    addEdge(graph, {
      id: `scopedTo:${role.id}:${tenantNode.id}`,
      source: role.id,
      target: tenantNode.id,
      type: 'scopedTo',
      inherited: false,
      provenance: {
        graphEndpoint: `/organization/${tenantNode.id}`,
        sourceObjectId: role.id,
        direct: true,
        relatedObjectIds: [role.id, tenantNode.id],
      },
      metadata: { scopeType: 'tenant' },
    });
  }
}

function addOwnedObjects(
  graph: GraphAccumulator,
  ownerId: string,
  ownedObjects: GraphDirectoryObject[],
  graphEndpoint: string,
): void {
  for (const ownedObject of ownedObjects) {
    const ownedNode = toDirectoryObjectNode(ownedObject);
    if (!ownedNode) {
      continue;
    }

    addNode(graph, ownedNode);
    addEdge(graph, {
      id: `owns:${ownerId}:${ownedNode.id}`,
      source: ownerId,
      target: ownedNode.id,
      type: 'owns',
      inherited: false,
      provenance: {
        graphEndpoint,
        sourceObjectId: ownerId,
        direct: true,
        relatedObjectIds: [ownerId, ownedNode.id],
      },
      metadata: {},
    });
  }
}

function assignmentPrincipalNode(assignment: GraphAppRoleAssignment): GraphNode | null {
  const label = assignment.principalDisplayName ?? assignment.principalId;

  switch (assignment.principalType?.toLowerCase()) {
    case 'user':
      return { id: assignment.principalId, type: 'user', label, metadata: {} };
    case 'group':
      return { id: assignment.principalId, type: 'group', label, metadata: {} };
    case 'serviceprincipal':
      return {
        id: assignment.principalId,
        type: 'enterpriseApplication',
        label,
        subtitle: 'Enterprise application / service principal',
        metadata: {},
      };
    default:
      return null;
  }
}

function combineDirectoryObjects(
  primary: GraphDirectoryObject[],
  secondary: GraphDirectoryObject[],
): GraphDirectoryObject[] {
  const combined = new Map<string, GraphDirectoryObject>();
  for (const item of [...primary, ...secondary]) {
    if (!combined.has(item.id)) {
      combined.set(item.id, item);
    }
  }
  return [...combined.values()];
}

function createAccumulator(): GraphAccumulator {
  return { nodes: new Map(), edges: new Map() };
}

function markInvestigationTarget(node: GraphNode): GraphNode {
  return { ...node, isInvestigationTarget: true };
}

function addNode(graph: GraphAccumulator, node: GraphNode): void {
  if (!graph.nodes.has(node.id)) {
    graph.nodes.set(node.id, node);
  }
}

function addEdge(graph: GraphAccumulator, edge: GraphEdge): void {
  if (!graph.edges.has(edge.id)) {
    graph.edges.set(edge.id, edge);
  }
}

function finish(graph: GraphAccumulator): InvestigationGraph {
  return { nodes: [...graph.nodes.values()], edges: [...graph.edges.values()] };
}
