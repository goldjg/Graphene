import type cytoscape from 'cytoscape';

import { getNodeTypeIcon } from './icons.ts';
import type { GraphEdgeType, GraphNodeType } from '../model/types.ts';
import type { ResolvedTheme } from '../../theme/theme.ts';

type StylesheetJsonBlock = cytoscape.StylesheetJsonBlock;

/**
 * Cytoscape styles are JavaScript values, so they cannot use the CSS custom
 * properties that theme the rest of the application. Everything here is
 * therefore derived from the resolved theme instead.
 *
 * Node tile colours are identical in both themes: they carry meaning and are
 * mirrored in the Filters panel key, so they must stay stable. Only values
 * whose legibility depends on the canvas background change — borders,
 * labels, label outlines/backgrounds, selection, and the handful of edge
 * colours that disappear against white.
 */
export interface NodeTypeAppearance {
  color: string;
  borderColor: string;
}

/**
 * Colour + icon coding per node type, rendered on a uniform rounded-tile
 * "badge" shape (matching Microsoft Entra/Fluent-style portal icon badges)
 * so meaning is never encoded by colour alone.
 */
const nodeTypePalette: Record<
  GraphNodeType,
  { color: string; darkBorder: string; lightBorder: string }
> = {
  user: { color: '#2563eb', darkBorder: '#93c5fd', lightBorder: '#1e3a8a' },
  group: { color: '#7c3aed', darkBorder: '#c4b5fd', lightBorder: '#4c1d95' },
  directoryRole: { color: '#dc2626', darkBorder: '#fca5a5', lightBorder: '#7f1d1d' },
  tenantScope: { color: '#475569', darkBorder: '#cbd5f5', lightBorder: '#1e293b' },
  administrativeUnit: { color: '#0d9488', darkBorder: '#5eead4', lightBorder: '#134e4a' },
  device: { color: '#0369a1', darkBorder: '#7dd3fc', lightBorder: '#0c4a6e' },
  appRegistration: { color: '#16a34a', darkBorder: '#86efac', lightBorder: '#14532d' },
  enterpriseApplication: { color: '#15803d', darkBorder: '#86efac', lightBorder: '#052e16' },
  appRole: { color: '#b45309', darkBorder: '#fcd34d', lightBorder: '#78350f' },
  delegatedPermission: { color: '#a16207', darkBorder: '#fde68a', lightBorder: '#713f12' },
};

export const styledNodeTypes = Object.keys(nodeTypePalette) as GraphNodeType[];

export function getNodeTypeAppearance(
  type: GraphNodeType,
  theme: ResolvedTheme,
): NodeTypeAppearance {
  const entry = nodeTypePalette[type];

  return {
    color: entry.color,
    borderColor: theme === 'light' ? entry.lightBorder : entry.darkBorder,
  };
}

const defaultEdgePalette = { dark: '#94a3b8', light: '#64748b' };

/**
 * Edge colour per relationship type that has a distinct colour on the
 * canvas. Relationship types not listed here render with the default edge
 * colour. Shared with `FilterPanel`'s relationship key so the two never
 * drift.
 *
 * The light variants are darkened because the dark-theme yellows and cyans
 * are effectively invisible on a light canvas.
 */
const edgeTypePalette: Partial<Record<GraphEdgeType, { dark: string; light: string }>> = {
  appRoleAssignment: { dark: '#fb923c', light: '#c2410c' },
  delegatedPermissionGrant: { dark: '#facc15', light: '#a16207' },
  accesses: { dark: '#67e8f9', light: '#0e7490' },
  assignedRole: { dark: '#c084fc', light: '#7e22ce' },
};

/** Relationship types that have a dedicated colour rule on the canvas. */
export const colouredEdgeTypes = Object.keys(edgeTypePalette) as GraphEdgeType[];

export function getEdgeTypeColor(type: GraphEdgeType, theme: ResolvedTheme): string {
  const entry = edgeTypePalette[type] ?? defaultEdgePalette;

  return theme === 'light' ? entry.light : entry.dark;
}

interface CanvasTheme {
  /** Node/edge label text. */
  labelColor: string;
  /** Halo drawn behind node labels so they stay readable over edges. */
  labelOutlineColor: string;
  /** Plate drawn behind edge labels. */
  edgeLabelBackgroundColor: string;
  /** Border for nodes with no type-specific appearance. */
  nodeBorderColor: string;
  /** Fill for nodes with no type-specific appearance. */
  nodeBackgroundColor: string;
  /** Thicker border marking the investigation target. */
  targetBorderColor: string;
  /** Selection and analysis-path highlight. */
  accentColor: string;
}

const canvasThemes: Record<ResolvedTheme, CanvasTheme> = {
  dark: {
    labelColor: '#f8fafc',
    labelOutlineColor: '#0b1220',
    edgeLabelBackgroundColor: '#0b1220',
    nodeBorderColor: '#e2e8f0',
    nodeBackgroundColor: '#94a3b8',
    targetBorderColor: '#f8fafc',
    accentColor: '#facc15',
  },
  light: {
    labelColor: '#0f172a',
    labelOutlineColor: '#ffffff',
    edgeLabelBackgroundColor: '#ffffff',
    nodeBorderColor: '#334155',
    nodeBackgroundColor: '#64748b',
    targetBorderColor: '#0f172a',
    accentColor: '#b45309',
  },
};

export function createCytoscapeStylesheet(theme: ResolvedTheme): StylesheetJsonBlock[] {
  const canvas = canvasThemes[theme];
  const defaultEdgeColor = theme === 'light' ? defaultEdgePalette.light : defaultEdgePalette.dark;

  return [
    {
      selector: 'node',
      style: {
        label: 'data(label)',
        shape: 'round-rectangle',
        'font-size': 10,
        color: canvas.labelColor,
        'text-outline-color': canvas.labelOutlineColor,
        'text-outline-width': 3,
        'text-wrap': 'ellipsis',
        'text-max-width': '130px',
        'text-valign': 'bottom',
        'text-halign': 'center',
        'text-margin-y': 6,
        'background-color': canvas.nodeBackgroundColor,
        'background-fit': 'contain',
        'background-clip': 'node',
        'background-width': '68%',
        'background-height': '68%',
        'border-width': 2,
        'border-color': canvas.nodeBorderColor,
        width: 42,
        height: 42,
      },
    },
    ...styledNodeTypes.map((nodeType): StylesheetJsonBlock => {
      const appearance = getNodeTypeAppearance(nodeType, theme);

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
        'border-color': canvas.targetBorderColor,
      },
    },
    {
      selector: 'node:selected',
      style: {
        'border-width': 4,
        'border-color': canvas.accentColor,
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
        'border-color': canvas.accentColor,
        'border-width': 4,
        'z-index': 10,
      },
    },
    {
      selector: 'edge',
      style: {
        width: 2,
        'line-color': defaultEdgeColor,
        'target-arrow-color': defaultEdgeColor,
        'target-arrow-shape': 'triangle',
        'curve-style': 'bezier',
        label: 'data(label)',
        'font-size': 8,
        color: canvas.labelColor,
        'text-rotation': 'autorotate',
        'text-background-color': canvas.edgeLabelBackgroundColor,
        'text-background-opacity': 0.86,
        'text-background-padding': '2px',
        'text-margin-y': -6,
      },
    },
    ...colouredEdgeTypes.map((edgeType): StylesheetJsonBlock => {
      const color = getEdgeTypeColor(edgeType, theme);

      return {
        selector: `.edge-type-${edgeType}`,
        style: {
          'line-color': color,
          'target-arrow-color': color,
        },
      };
    }),
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
        'line-color': canvas.accentColor,
        'target-arrow-color': canvas.accentColor,
        width: 3,
      },
    },
    {
      selector: 'edge.analysis-highlighted',
      style: {
        opacity: 1,
        'line-color': canvas.accentColor,
        'target-arrow-color': canvas.accentColor,
        width: 4,
        'z-index': 10,
      },
    },
  ];
}
