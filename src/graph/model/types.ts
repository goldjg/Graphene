/**
 * Normalized graph-domain model.
 *
 * Microsoft Graph DTOs (see src/microsoftGraph/dto) must never be exposed
 * directly to Cytoscape or the UI. Ingestion code is responsible for mapping
 * Graph DTOs into these normalized node/edge shapes, attaching provenance for
 * every relationship along the way.
 */

export type GraphNodeType =
  | 'user'
  | 'group'
  | 'directoryRole'
  | 'tenantScope'
  | 'administrativeUnit'
  | 'device'
  | 'appRegistration'
  | 'enterpriseApplication'
  | 'appRole'
  | 'delegatedPermission';

export type GraphEdgeType =
  | 'memberOf'
  | 'transitiveMemberOf'
  | 'assignedRole'
  | 'owns'
  | 'scopedTo'
  | 'appRoleAssignment'
  | 'delegatedPermissionGrant'
  | 'accesses'
  | 'assignedTo'
  | 'registeredTo';

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label: string;
  subtitle?: string;
  sourceId?: string;
  isInvestigationTarget?: boolean;
  metadata: Record<string, unknown>;
}

/**
 * Provenance answers "why does this relationship exist?" It must be
 * populated for every edge so the UI can eventually explain "User A reaches
 * object B because of relationship C" without inferring authority from
 * visual proximity.
 */
export interface RelationshipProvenance {
  /** The Microsoft Graph endpoint/response that produced this relationship. */
  graphEndpoint: string;
  /** The object ID that was queried to discover this relationship. */
  sourceObjectId: string;
  /** True for a direct relationship, false for a transitive/inherited one. */
  direct: boolean;
  /** Additional Graph object IDs relevant to the relationship. */
  relatedObjectIds: string[];
  /** Assignment or grant ID, when Microsoft Graph exposes one. */
  assignmentId?: string;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphEdgeType;
  /** True when this edge represents access inherited through another object (e.g. a group). */
  inherited: boolean;
  provenance: RelationshipProvenance;
  metadata: Record<string, unknown>;
}

export interface InvestigationGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
