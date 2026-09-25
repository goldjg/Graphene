import type { InvestigationGraph } from '../model/types.ts';

/**
 * Merge one or more investigation graphs into a single deduplicated graph.
 *
 * Nodes and edges are deduplicated by id. The first occurrence wins so that
 * earlier, more targeted queries are not silently overwritten by later,
 * broader ones. This keeps repeated ingestion calls (e.g. across paginated
 * Microsoft Graph responses) safe to combine without discarding provenance.
 */
export function mergeInvestigationGraphs(graphs: InvestigationGraph[]): InvestigationGraph {
  const nodesById = new Map<string, InvestigationGraph['nodes'][number]>();
  const edgesById = new Map<string, InvestigationGraph['edges'][number]>();

  for (const graph of graphs) {
    for (const node of graph.nodes) {
      if (!nodesById.has(node.id)) {
        nodesById.set(node.id, node);
      }
    }

    for (const edge of graph.edges) {
      if (!edgesById.has(edge.id)) {
        edgesById.set(edge.id, edge);
      }
    }
  }

  return {
    nodes: [...nodesById.values()],
    edges: [...edgesById.values()],
  };
}
