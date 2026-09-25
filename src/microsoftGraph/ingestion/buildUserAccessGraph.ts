import {
  isGraphDirectoryRole,
  isGraphGroup,
  type GraphDirectoryObject,
} from '../dto/directoryObject.ts';
import type { GraphUser } from '../dto/user.ts';
import type { GraphClient } from '../client/GraphClient.ts';
import type {
  GraphEdge,
  GraphNode,
  InvestigationGraph,
  RelationshipProvenance,
} from '../../graph/model/types.ts';

/**
 * Build an `InvestigationGraph` describing a user's direct and transitive
 * group/directory-role memberships.
 *
 * This is the only ingestion path implemented so far because
 * `/users/{id}/memberOf` and `/users/{id}/transitiveMemberOf` are confirmed
 * available under the `User.Read` plus `Directory.Read.All` delegated
 * permission baseline. Administrative units, app role assignments, delegated
 * permission grants, and application/service-principal relationships remain
 * unresolved (see `.github/carl/memory.md`) and are intentionally not
 * modelled here.
 */
export async function buildUserAccessGraph(
  graphClient: GraphClient,
  userId: string,
  signal?: AbortSignal,
): Promise<InvestigationGraph> {
  const [user, directMemberships, transitiveMemberships] = await Promise.all([
    graphClient.getUser(userId, signal),
    graphClient.getMemberOf(userId, signal),
    graphClient.getTransitiveMemberOf(userId, signal),
  ]);

  const userNode = toUserNode(user);
  const directIds = new Set(directMemberships.map((membership) => membership.id));

  const nodes = new Map<string, GraphNode>();
  const edges = new Map<string, GraphEdge>();
  nodes.set(userNode.id, userNode);

  for (const membership of transitiveMemberships) {
    const node = toMembershipNode(membership);

    if (!node) {
      continue;
    }

    nodes.set(node.id, node);

    const direct = directIds.has(membership.id);
    const edge = toMembershipEdge(userNode.id, membership, direct);

    if (edge) {
      edges.set(edge.id, edge);
    }
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

function toUserNode(user: GraphUser): GraphNode {
  return {
    id: user.id,
    type: 'user',
    label: user.displayName ?? user.userPrincipalName ?? user.id,
    ...(user.userPrincipalName ? { subtitle: user.userPrincipalName } : {}),
    metadata: { userPrincipalName: user.mail, accountEnabled: user.accountEnabled },
  };
}

function toMembershipNode(directoryObject: GraphDirectoryObject): GraphNode | null {
  if (isGraphGroup(directoryObject)) {
    return {
      id: directoryObject.id,
      type: 'group',
      label: directoryObject.displayName ?? directoryObject.id,
      ...(directoryObject.description ? { subtitle: directoryObject.description } : {}),
      metadata: {},
    };
  }

  if (isGraphDirectoryRole(directoryObject)) {
    return {
      id: directoryObject.id,
      type: 'directoryRole',
      label: directoryObject.displayName ?? directoryObject.id,
      ...(directoryObject.description ? { subtitle: directoryObject.description } : {}),
      metadata: {},
    };
  }

  return null;
}

function toMembershipEdge(
  userId: string,
  directoryObject: GraphDirectoryObject,
  direct: boolean,
): GraphEdge | null {
  const provenance: RelationshipProvenance = {
    graphEndpoint: direct ? `/users/${userId}/memberOf` : `/users/${userId}/transitiveMemberOf`,
    sourceObjectId: userId,
    direct,
    relatedObjectIds: [directoryObject.id],
  };

  if (isGraphGroup(directoryObject)) {
    return {
      id: `memberOf:${userId}:${directoryObject.id}`,
      source: userId,
      target: directoryObject.id,
      type: direct ? 'memberOf' : 'transitiveMemberOf',
      inherited: !direct,
      provenance,
      metadata: {},
    };
  }

  if (isGraphDirectoryRole(directoryObject)) {
    return {
      id: `assignedRole:${userId}:${directoryObject.id}`,
      source: userId,
      target: directoryObject.id,
      type: 'assignedRole',
      inherited: !direct,
      provenance,
      metadata: {},
    };
  }

  return null;
}
