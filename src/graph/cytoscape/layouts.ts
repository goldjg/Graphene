import cytoscape from 'cytoscape';

export type GraphLayoutId = 'breadthfirst' | 'cose' | 'concentric';

type LayoutOptions = cytoscape.LayoutOptions;

export const graphLayoutOptions: Record<GraphLayoutId, LayoutOptions> = {
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
  breadthfirst: 'Breadth-first',
  cose: 'Force-directed (CoSE)',
  concentric: 'Concentric',
};
