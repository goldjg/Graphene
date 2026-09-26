import { edgeTypeLabels } from '../model/labels.ts';
import type { GraphEdge, GraphNode, GraphNodeType, InvestigationGraph } from '../model/types.ts';

export interface GraphPath {
  nodeIds: string[];
  edgeIds: string[];
}

export interface GraphSummary {
  nodeCount: number;
  edgeCount: number;
  directEdgeCount: number;
  inheritedEdgeCount: number;
  nodeCounts: Partial<Record<GraphNodeType, number>>;
}

export interface GraphComparison {
  addedNodeIds: string[];
  removedNodeIds: string[];
  changedNodeIds: string[];
  addedEdgeIds: string[];
  removedEdgeIds: string[];
  changedEdgeIds: string[];
}

export function searchGraphNodes(graph: InvestigationGraph, query: string): GraphNode[] {
  const normalizedQuery = query.trim().toLocaleLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  return graph.nodes.filter((node) =>
    [
      node.id,
      node.label,
      node.subtitle,
      ...Object.values(node.metadata).flatMap(searchableMetadataValues),
    ].some((value) => value?.toLocaleLowerCase().includes(normalizedQuery)),
  );
}

export function summarizeGraph(graph: InvestigationGraph): GraphSummary {
  const nodeCounts: Partial<Record<GraphNodeType, number>> = {};
  for (const node of graph.nodes) {
    nodeCounts[node.type] = (nodeCounts[node.type] ?? 0) + 1;
  }

  return {
    nodeCount: graph.nodes.length,
    edgeCount: graph.edges.length,
    directEdgeCount: graph.edges.filter((edge) => !edge.inherited).length,
    inheritedEdgeCount: graph.edges.filter((edge) => edge.inherited).length,
    nodeCounts,
  };
}

export function findGraphPaths(
  graph: InvestigationGraph,
  startId: string,
  endId: string,
  mode: 'shortest' | 'all',
  maxPaths = 10,
  maxDepth = 12,
): GraphPath[] {
  if (startId === endId || !graph.nodes.some((node) => node.id === startId)) {
    return [];
  }

  const adjacency = buildAdjacency(graph.edges);
  const queue: GraphPath[] = [{ nodeIds: [startId], edgeIds: [] }];
  const results: GraphPath[] = [];
  let shortestDepth: number | null = null;
  let queueIndex = 0;
  let generatedPathCount = 1;

  while (queueIndex < queue.length && results.length < maxPaths) {
    const path = queue[queueIndex]!;
    queueIndex += 1;

    const currentId = path.nodeIds[path.nodeIds.length - 1]!;
    if (currentId === endId) {
      shortestDepth ??= path.edgeIds.length;
      if (mode === 'all' || path.edgeIds.length === shortestDepth) {
        results.push(path);
      }
      continue;
    }

    if (
      path.edgeIds.length >= maxDepth ||
      (mode === 'shortest' && shortestDepth !== null && path.edgeIds.length >= shortestDepth)
    ) {
      continue;
    }

    for (const step of adjacency.get(currentId) ?? []) {
      if (path.nodeIds.includes(step.nodeId) || generatedPathCount >= 5_000) {
        continue;
      }
      queue.push({
        nodeIds: [...path.nodeIds, step.nodeId],
        edgeIds: [...path.edgeIds, step.edgeId],
      });
      generatedPathCount += 1;
    }
  }

  return results;
}

export function explainGraphPath(graph: InvestigationGraph, path: GraphPath): string {
  const nodes = new Map(graph.nodes.map((node) => [node.id, node]));
  const edges = new Map(graph.edges.map((edge) => [edge.id, edge]));
  const parts: string[] = [];

  for (let index = 0; index < path.edgeIds.length; index += 1) {
    const source = nodes.get(path.nodeIds[index]!);
    const target = nodes.get(path.nodeIds[index + 1]!);
    const edge = edges.get(path.edgeIds[index]!);
    if (!source || !target || !edge) {
      continue;
    }
    const relationship = `${edgeTypeLabels[edge.type]}${edge.inherited ? ' (inherited)' : ''}`;
    parts.push(
      edge.source === source.id
        ? `${source.label} --${relationship}--> ${target.label}`
        : `${source.label} <--${relationship}-- ${target.label}`,
    );
  }

  return parts.join(' | ');
}

export function mergeGraphs(
  current: InvestigationGraph,
  incoming: InvestigationGraph,
): InvestigationGraph {
  const nodes = new Map(current.nodes.map((node) => [node.id, node]));
  const edges = new Map(current.edges.map((edge) => [edge.id, edge]));

  for (const node of incoming.nodes) {
    const existing = nodes.get(node.id);
    nodes.set(node.id, existing ? mergeNode(existing, node) : node);
  }
  for (const edge of incoming.edges) {
    if (!edges.has(edge.id)) {
      edges.set(edge.id, edge);
    }
  }

  return { nodes: [...nodes.values()], edges: [...edges.values()] };
}

export function compareGraphs(
  baseline: InvestigationGraph,
  current: InvestigationGraph,
): GraphComparison {
  const baselineNodeIds = new Set(baseline.nodes.map((node) => node.id));
  const currentNodeIds = new Set(current.nodes.map((node) => node.id));
  const baselineEdgeIds = new Set(baseline.edges.map((edge) => edge.id));
  const currentEdgeIds = new Set(current.edges.map((edge) => edge.id));

  return {
    addedNodeIds: current.nodes
      .filter((node) => !baselineNodeIds.has(node.id))
      .map((node) => node.id),
    removedNodeIds: baseline.nodes
      .filter((node) => !currentNodeIds.has(node.id))
      .map((node) => node.id),
    changedNodeIds: current.nodes
      .filter((node) => {
        const previous = baseline.nodes.find((candidate) => candidate.id === node.id);
        return previous && JSON.stringify(previous) !== JSON.stringify(node);
      })
      .map((node) => node.id),
    addedEdgeIds: current.edges
      .filter((edge) => !baselineEdgeIds.has(edge.id))
      .map((edge) => edge.id),
    removedEdgeIds: baseline.edges
      .filter((edge) => !currentEdgeIds.has(edge.id))
      .map((edge) => edge.id),
    changedEdgeIds: current.edges
      .filter((edge) => {
        const previous = baseline.edges.find((candidate) => candidate.id === edge.id);
        return previous && JSON.stringify(previous) !== JSON.stringify(edge);
      })
      .map((edge) => edge.id),
  };
}

function searchableMetadataValues(value: unknown): string[] {
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)];
  }
  if (Array.isArray(value)) {
    return value.flatMap(searchableMetadataValues);
  }
  return [];
}

function buildAdjacency(edges: GraphEdge[]): Map<string, { nodeId: string; edgeId: string }[]> {
  const adjacency = new Map<string, { nodeId: string; edgeId: string }[]>();
  for (const edge of edges) {
    addStep(adjacency, edge.source, edge.target, edge.id);
    addStep(adjacency, edge.target, edge.source, edge.id);
  }
  return adjacency;
}

function addStep(
  adjacency: Map<string, { nodeId: string; edgeId: string }[]>,
  source: string,
  target: string,
  edgeId: string,
): void {
  const steps = adjacency.get(source) ?? [];
  steps.push({ nodeId: target, edgeId });
  adjacency.set(source, steps);
}

function mergeNode(existing: GraphNode, incoming: GraphNode): GraphNode {
  const isInvestigationTarget = Boolean(
    existing.isInvestigationTarget || incoming.isInvestigationTarget,
  );
  const incomingMetadata = Object.fromEntries(
    Object.entries(incoming.metadata).filter(([, value]) => value !== undefined && value !== null),
  );
  const merged: GraphNode = {
    ...existing,
    type: existing.type,
    label:
      incoming.label !== incoming.id || existing.label === existing.id
        ? incoming.label
        : existing.label,
    ...((incoming.subtitle ?? existing.subtitle)
      ? { subtitle: incoming.subtitle ?? existing.subtitle }
      : {}),
    ...((incoming.sourceId ?? existing.sourceId)
      ? { sourceId: incoming.sourceId ?? existing.sourceId }
      : {}),
    metadata: { ...existing.metadata, ...incomingMetadata },
  };
  if (isInvestigationTarget) {
    merged.isInvestigationTarget = true;
  } else {
    delete merged.isInvestigationTarget;
  }
  return merged;
}
