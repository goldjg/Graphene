import cytoscape from 'cytoscape';

import { edgeTypeLabels } from '../model/labels.ts';
import type { GraphEdge, GraphNode, InvestigationGraph } from '../model/types.ts';

type ElementDefinition = cytoscape.ElementDefinition;

/**
 * Convert the normalized investigation graph into Cytoscape elements.
 *
 * Cytoscape must never render raw Microsoft Graph DTOs directly; this is the
 * single translation point between the domain model and the renderer.
 */
export function toCytoscapeElements(graph: InvestigationGraph): ElementDefinition[] {
  return [...graph.nodes.map(toNodeElement), ...graph.edges.map(toEdgeElement)];
}

function toNodeElement(node: GraphNode): ElementDefinition {
  return {
    group: 'nodes',
    data: {
      id: node.id,
      graphNodeType: node.type,
      label: node.label,
      subtitle: node.subtitle,
      sourceId: node.sourceId,
      isInvestigationTarget: node.isInvestigationTarget ?? false,
    },
    classes: `node-type-${node.type}`,
  };
}

function toEdgeElement(edge: GraphEdge): ElementDefinition {
  return {
    group: 'edges',
    data: {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      graphEdgeType: edge.type,
      label: edgeTypeLabels[edge.type],
      inherited: edge.inherited,
    },
    classes: [`edge-type-${edge.type}`, edge.inherited ? 'edge-inherited' : 'edge-direct'].join(
      ' ',
    ),
  };
}
