import type {
  GraphEdge,
  GraphEdgeType,
  GraphNode,
  GraphNodeType,
  InvestigationGraph,
} from '../model/types.ts';

export interface InvestigationSnapshot {
  schemaVersion: 1;
  exportedAt: string;
  graph: InvestigationGraph;
}

const nodeTypes: ReadonlySet<GraphNodeType> = new Set([
  'user',
  'group',
  'directoryRole',
  'tenantScope',
  'administrativeUnit',
  'device',
  'appRegistration',
  'enterpriseApplication',
  'appRole',
  'delegatedPermission',
]);

const edgeTypes: ReadonlySet<GraphEdgeType> = new Set([
  'memberOf',
  'transitiveMemberOf',
  'assignedRole',
  'owns',
  'scopedTo',
  'appRoleAssignment',
  'delegatedPermissionGrant',
  'accesses',
  'assignedTo',
  'registeredTo',
]);

export function createSnapshot(graph: InvestigationGraph): InvestigationSnapshot {
  return { schemaVersion: 1, exportedAt: new Date().toISOString(), graph };
}

export function parseSnapshot(value: unknown): InvestigationSnapshot {
  if (
    !isRecord(value) ||
    value.schemaVersion !== 1 ||
    typeof value.exportedAt !== 'string' ||
    Number.isNaN(Date.parse(value.exportedAt))
  ) {
    throw new Error('Unsupported or malformed Graphene snapshot.');
  }
  if (
    !isRecord(value.graph) ||
    !Array.isArray(value.graph.nodes) ||
    !Array.isArray(value.graph.edges)
  ) {
    throw new Error('Snapshot graph must contain node and edge arrays.');
  }

  const nodes = value.graph.nodes.map(parseNode);
  const nodeIds = new Set(nodes.map((node) => node.id));
  if (nodeIds.size !== nodes.length) {
    throw new Error('Snapshot contains duplicate node IDs.');
  }

  const edges = value.graph.edges.map((edge) => parseEdge(edge, nodeIds));
  if (new Set(edges.map((edge) => edge.id)).size !== edges.length) {
    throw new Error('Snapshot contains duplicate edge IDs.');
  }

  return {
    schemaVersion: 1,
    exportedAt: value.exportedAt,
    graph: { nodes, edges },
  };
}

export function graphToCsv(graph: InvestigationGraph): string {
  const nodeLabels = new Map(graph.nodes.map((node) => [node.id, node.label]));
  const rows = [
    [
      'edgeId',
      'sourceId',
      'sourceLabel',
      'relationship',
      'targetId',
      'targetLabel',
      'direct',
      'graphEndpoint',
      'queriedObjectId',
      'relatedObjectIds',
      'assignmentId',
    ],
    ...graph.edges.map((edge) => [
      edge.id,
      edge.source,
      nodeLabels.get(edge.source) ?? edge.source,
      edge.type,
      edge.target,
      nodeLabels.get(edge.target) ?? edge.target,
      String(edge.provenance.direct),
      edge.provenance.graphEndpoint,
      edge.provenance.sourceObjectId,
      edge.provenance.relatedObjectIds.join(' '),
      edge.provenance.assignmentId ?? '',
    ]),
  ];
  return rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
}

function parseNode(value: unknown): GraphNode {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    typeof value.type !== 'string' ||
    !nodeTypes.has(value.type as GraphNodeType) ||
    !isNonEmptyString(value.label) ||
    !isOptionalString(value.subtitle) ||
    !isOptionalString(value.sourceId) ||
    !isOptionalBoolean(value.isInvestigationTarget) ||
    !isRecord(value.metadata)
  ) {
    throw new Error('Snapshot contains an invalid node.');
  }
  return value as unknown as GraphNode;
}

function parseEdge(value: unknown, nodeIds: ReadonlySet<string>): GraphEdge {
  if (
    !isRecord(value) ||
    !isNonEmptyString(value.id) ||
    !isNonEmptyString(value.source) ||
    !isNonEmptyString(value.target) ||
    !nodeIds.has(value.source) ||
    !nodeIds.has(value.target) ||
    typeof value.type !== 'string' ||
    !edgeTypes.has(value.type as GraphEdgeType) ||
    typeof value.inherited !== 'boolean' ||
    !isRecord(value.metadata) ||
    !isRecord(value.provenance) ||
    !isNonEmptyString(value.provenance.graphEndpoint) ||
    !isNonEmptyString(value.provenance.sourceObjectId) ||
    typeof value.provenance.direct !== 'boolean' ||
    value.provenance.direct === value.inherited ||
    !isOptionalString(value.provenance.assignmentId) ||
    !Array.isArray(value.provenance.relatedObjectIds) ||
    !value.provenance.relatedObjectIds.every(isNonEmptyString)
  ) {
    throw new Error('Snapshot contains an invalid edge.');
  }
  return value as unknown as GraphEdge;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function escapeCsv(value: string): string {
  const safeValue = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safeValue.replaceAll('"', '""')}"`;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOptionalString(value: unknown): boolean {
  return value === undefined || typeof value === 'string';
}

function isOptionalBoolean(value: unknown): boolean {
  return value === undefined || typeof value === 'boolean';
}
