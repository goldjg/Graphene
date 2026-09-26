import cytoscape from 'cytoscape';

export type GraphLayoutId = 'accessPath' | 'breadthfirst' | 'cose' | 'concentric';

type LayoutOptions = cytoscape.LayoutOptions;
type ElementDefinition = cytoscape.ElementDefinition;

const graphLayoutOptions: Record<Exclude<GraphLayoutId, 'accessPath'>, LayoutOptions> = {
  breadthfirst: {
    name: 'breadthfirst',
    fit: true,
    directed: true,
    spacingFactor: 1.2,
    animate: false,
  },
  cose: {
    name: 'cose',
    fit: true,
    animate: false,
    nodeRepulsion: () => 8000,
  },
  concentric: {
    name: 'concentric',
    fit: true,
    animate: false,
    minNodeSpacing: 40,
  },
};

export const graphLayoutLabels: Record<GraphLayoutId, string> = {
  accessPath: 'Access paths',
  breadthfirst: 'Breadth-first',
  cose: 'Force-directed (CoSE)',
  concentric: 'Concentric',
};

export function getGraphLayoutOptions(
  layoutId: GraphLayoutId,
  elements: ElementDefinition[],
): LayoutOptions {
  if (layoutId !== 'accessPath') {
    return graphLayoutOptions[layoutId];
  }

  return {
    name: 'preset',
    fit: true,
    animate: false,
    padding: 60,
    positions: createAccessPathPositions(elements),
  };
}

export function createAccessPathPositions(
  elements: ElementDefinition[],
): cytoscape.NodePositionMap {
  const nodes = elements
    .filter((element) => element.group === 'nodes')
    .map((element) => readNodeData(element))
    .filter((node): node is NodeLayoutData => node !== null);
  const adjacency = new Map(nodes.map((node) => [node.id, new Set<string>()]));

  for (const element of elements) {
    if (element.group !== 'edges') {
      continue;
    }

    const source = readString(element.data, 'source');
    const target = readString(element.data, 'target');
    if (!source || !target || !adjacency.has(source) || !adjacency.has(target)) {
      continue;
    }
    adjacency.get(source)?.add(target);
    adjacency.get(target)?.add(source);
  }

  const root = nodes.find((node) => node.isInvestigationTarget) ?? nodes[0];
  const depths = new Map<string, number>();

  if (root) {
    const queue = [root.id];
    depths.set(root.id, 0);

    for (let index = 0; index < queue.length; index += 1) {
      const current = queue[index];
      if (!current) {
        continue;
      }
      const nextDepth = (depths.get(current) ?? 0) + 1;

      for (const neighbor of adjacency.get(current) ?? []) {
        if (!depths.has(neighbor)) {
          depths.set(neighbor, nextDepth);
          queue.push(neighbor);
        }
      }
    }
  }

  const disconnectedDepth = Math.max(0, ...depths.values()) + 1;
  const layers = new Map<number, NodeLayoutData[]>();

  for (const node of nodes) {
    const depth = depths.get(node.id) ?? disconnectedDepth;
    const layer = layers.get(depth) ?? [];
    layer.push(node);
    layers.set(depth, layer);
  }

  const positions: cytoscape.NodePositionMap = {};
  for (const [depth, layer] of [...layers.entries()].sort(([left], [right]) => left - right)) {
    layer.sort(compareLayoutNodes);
    const width = (layer.length - 1) * 170;

    layer.forEach((node, index) => {
      positions[node.id] = {
        x: index * 170 - width / 2,
        y: depth * 190,
      };
    });
  }

  return positions;
}

interface NodeLayoutData {
  id: string;
  label: string;
  type: string;
  isInvestigationTarget: boolean;
}

function readNodeData(element: ElementDefinition): NodeLayoutData | null {
  const id = readString(element.data, 'id');
  if (!id) {
    return null;
  }

  return {
    id,
    label: readString(element.data, 'label') ?? id,
    type: readString(element.data, 'graphNodeType') ?? '',
    isInvestigationTarget: element.data?.isInvestigationTarget === true,
  };
}

function readString(data: ElementDefinition['data'] | undefined, key: string): string | undefined {
  const values = data as Record<string, unknown> | undefined;
  const value = values?.[key];
  return typeof value === 'string' ? value : undefined;
}

function compareLayoutNodes(left: NodeLayoutData, right: NodeLayoutData): number {
  const typeComparison = left.type.localeCompare(right.type);
  return typeComparison !== 0 ? typeComparison : left.label.localeCompare(right.label);
}
