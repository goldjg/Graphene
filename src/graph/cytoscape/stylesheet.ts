import cytoscape from 'cytoscape';

import { getNodeTypeIcon } from './icons.ts';
import type { GraphNodeType } from '../model/types.ts';

type StylesheetJsonBlock = cytoscape.StylesheetJsonBlock;
type NodeShape = cytoscape.Css.NodeShape;

/**
 * Shape + colour + icon triple-coding per node type so meaning is never
 * encoded by colour alone (accessibility requirement).
 */
export const nodeTypeAppearance: Record<
  GraphNodeType,
  { shape: NodeShape; color: string; borderColor: string }
> = {
  user: { shape: 'ellipse', color: '#2563eb', borderColor: '#93c5fd' },
  group: { shape: 'round-rectangle', color: '#7c3aed', borderColor: '#c4b5fd' },
  directoryRole: { shape: 'diamond', color: '#dc2626', borderColor: '#fca5a5' },
  tenantScope: { shape: 'octagon', color: '#475569', borderColor: '#cbd5f5' },
  administrativeUnit: { shape: 'hexagon', color: '#0d9488', borderColor: '#5eead4' },
  appRegistration: { shape: 'round-tag', color: '#16a34a', borderColor: '#86efac' },
  enterpriseApplication: { shape: 'tag', color: '#15803d', borderColor: '#86efac' },
  appRole: { shape: 'round-triangle', color: '#b45309', borderColor: '#fcd34d' },
  delegatedPermission: { shape: 'triangle', color: '#a16207', borderColor: '#fde68a' },
};

export const cytoscapeStylesheet: StylesheetJsonBlock[] = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      'font-size': 11,
      color: '#0f172a',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': 6,
      'background-color': '#94a3b8',
      'background-fit': 'contain',
      'background-clip': 'node',
      'background-width': '60%',
      'background-height': '60%',
      'border-width': 2,
      'border-color': '#e2e8f0',
      width: 42,
      height: 42,
    },
  },
  ...Object.entries(nodeTypeAppearance).map(([type, appearance]): StylesheetJsonBlock => {
    const nodeType = type as GraphNodeType;

    return {
      selector: `.node-type-${nodeType}`,
      style: {
        shape: appearance.shape,
        'background-color': appearance.color,
        'border-color': appearance.borderColor,
        'background-image': getNodeTypeIcon(nodeType),
      },
    };
  }),
  {
    selector: 'node:selected',
    style: {
      'border-width': 4,
      'border-color': '#facc15',
    },
  },
  {
    selector: 'edge',
    style: {
      width: 2,
      'line-color': '#94a3b8',
      'target-arrow-color': '#94a3b8',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
    },
  },
  {
    selector: '.edge-direct',
    style: {
      'line-style': 'solid',
    },
  },
  {
    selector: '.edge-inherited',
    style: {
      'line-style': 'dashed',
    },
  },
  {
    selector: 'edge:selected',
    style: {
      'line-color': '#facc15',
      'target-arrow-color': '#facc15',
      width: 3,
    },
  },
];
