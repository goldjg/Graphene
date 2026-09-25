/**
 * Non-destructive, display-time filtering over an already-loaded
 * `InvestigationGraph`. Filtering here never re-queries Microsoft Graph and
 * never mutates the source graph produced by ingestion or the demo fixture;
 * it only derives a reduced view for rendering.
 */

import type { GraphEdgeType, GraphNodeType, InvestigationGraph } from '../model/types.ts';

export interface GraphFilterState {
  /** Node types the user has chosen to hide. */
  hiddenNodeTypes: ReadonlySet<GraphNodeType>;
  /** Edge (relationship) types the user has chosen to hide. */
  hiddenEdgeTypes: ReadonlySet<GraphEdgeType>;
  /** When true, inherited (transitive) relationships are hidden. */
  hideInherited: boolean;
}

export function defaultFilterState(): GraphFilterState {
  return {
    hiddenNodeTypes: new Set(),
    hiddenEdgeTypes: new Set(),
    hideInherited: false,
  };
}

export function isFilterActive(filters: GraphFilterState): boolean {
  return (
    filters.hiddenNodeTypes.size > 0 || filters.hiddenEdgeTypes.size > 0 || filters.hideInherited
  );
}

/**
 * Applies `filters` to `graph`, returning a new `InvestigationGraph`
 * containing only the nodes/edges that remain visible. An edge is hidden if
 * its own type/inherited flag is filtered, or if either endpoint node was
 * filtered out (an edge can never reference a hidden node).
 */
export function applyGraphFilters(
  graph: InvestigationGraph,
  filters: GraphFilterState,
): InvestigationGraph {
  const visibleNodes = graph.nodes.filter((node) => !filters.hiddenNodeTypes.has(node.type));
  const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));

  const visibleEdges = graph.edges.filter((edge) => {
    if (filters.hiddenEdgeTypes.has(edge.type)) {
      return false;
    }
    if (filters.hideInherited && edge.inherited) {
      return false;
    }
    return visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
  });

  return { nodes: visibleNodes, edges: visibleEdges };
}

/** Distinct node types present in `graph`, for building filter controls. */
export function distinctNodeTypes(graph: InvestigationGraph): GraphNodeType[] {
  return Array.from(new Set(graph.nodes.map((node) => node.type))).sort();
}

/** Distinct edge types present in `graph`, for building filter controls. */
export function distinctEdgeTypes(graph: InvestigationGraph): GraphEdgeType[] {
  return Array.from(new Set(graph.edges.map((edge) => edge.type))).sort();
}
