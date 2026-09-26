import type cytoscape from 'cytoscape';

import { getNodeTypeIcon } from './icons.ts';
import type { GraphEdgeType, GraphNodeType } from '../model/types.ts';

type StylesheetJsonBlock = cytoscape.StylesheetJsonBlock;

/**
 * Colour + icon coding per node type, rendered on a uniform rounded-tile
 * "badge" shape (matching Microsoft Entra/Fluent-style portal icon badges)
 * so meaning is never encoded by colour alone.
 */
export const nodeTypeAppearance: Record<GraphNodeType, { color: string; borderColor: string }> = {
  user: { color: '#2563eb', borderColor: '#93c5fd' },
  group: { color: '#7c3aed', borderColor: '#c4b5fd' },
  directoryRole: { color: '#dc2626', borderColor: '#fca5a5' },
  tenantScope: { color: '#475569', borderColor: '#cbd5f5' },
  administrativeUnit: { color: '#0d9488', borderColor: '#5eead4' },
  device: { color: '#0369a1', borderColor: '#7dd3fc' },
  appRegistration: { color: '#16a34a', borderColor: '#86efac' },
  enterpriseApplication: { color: '#15803d', borderColor: '#86efac' },
  appRole: { color: '#b45309', borderColor: '#fcd34d' },
  delegatedPermission: { color: '#a16207', borderColor: '#fde68a' },
};

const defaultEdgeColor = '#94a3b8';

/**
 * Edge colour per relationship type that has a distinct colour on the
 * canvas. Relationship types not listed here render with `defaultEdgeColor`.
 * Shared with `FilterPanel`'s relationship key so the two never drift.
 */
export const edgeTypeColors: Partial<Record<GraphEdgeType, string>> = {
  appRoleAssignment: '#fb923c',
  delegatedPermissionGrant: '#facc15',
  accesses: '#67e8f9',
  assignedRole: '#c084fc',
};

export function getEdgeTypeColor(type: GraphEdgeType): string {
  return edgeTypeColors[type] ?? defaultEdgeColor;
}

export const cytoscapeStylesheet: StylesheetJsonBlock[] = [
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      shape: 'round-rectangle',
      'font-size': 10,
      color: '#f8fafc',
      'text-outline-color': '#0b1220',
      'text-outline-width': 3,
      'text-wrap': 'ellipsis',
      'text-max-width': '130px',
      'text-valign': 'bottom',
      'text-halign': 'center',
      'text-margin-y': 6,
      'background-color': '#94a3b8',
      'background-fit': 'contain',
      'background-clip': 'node',
      'background-width': '68%',
      'background-height': '68%',
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
        'background-color': appearance.color,
        'border-color': appearance.borderColor,
        'background-image': getNodeTypeIcon(nodeType),
      },
    };
  }),
  {
    selector: 'node[?isInvestigationTarget]',
    style: {
      width: 54,
      height: 54,
      'border-width': 5,
      'border-color': '#f8fafc',
    },
  },
  {
    selector: '.edge-type-appRoleAssignment',
    style: {
      'line-color': getEdgeTypeColor('appRoleAssignment'),
      'target-arrow-color': getEdgeTypeColor('appRoleAssignment'),
    },
  },
  {
    selector: '.edge-type-delegatedPermissionGrant',
    style: {
      'line-color': getEdgeTypeColor('delegatedPermissionGrant'),
      'target-arrow-color': getEdgeTypeColor('delegatedPermissionGrant'),
    },
  },
  {
    selector: '.edge-type-accesses',
    style: {
      'line-color': getEdgeTypeColor('accesses'),
      'target-arrow-color': getEdgeTypeColor('accesses'),
    },
  },
  {
    selector: '.edge-type-assignedRole',
    style: {
      'line-color': getEdgeTypeColor('assignedRole'),
      'target-arrow-color': getEdgeTypeColor('assignedRole'),
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-width': 4,
      'border-color': '#facc15',
    },
  },
  {
    selector: '.analysis-dimmed',
    style: {
      opacity: 0.18,
    },
  },
  {
    selector: 'node.analysis-highlighted',
    style: {
      opacity: 1,
      'border-color': '#facc15',
      'border-width': 4,
      'z-index': 10,
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
      label: 'data(label)',
      'font-size': 8,
      color: '#e2e8f0',
      'text-rotation': 'autorotate',
      'text-background-color': '#0b1220',
      'text-background-opacity': 0.86,
      'text-background-padding': '2px',
      'text-margin-y': -6,
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
  {
    selector: 'edge.analysis-highlighted',
    style: {
      opacity: 1,
      'line-color': '#facc15',
      'target-arrow-color': '#facc15',
      width: 4,
      'z-index': 10,
    },
  },
];
