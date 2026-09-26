import { describe, expect, it } from 'vitest';

import type { GraphNodeType } from '../model/types.ts';
import { getNodeTypeIcon } from './icons.ts';
import { cytoscapeStylesheet, edgeTypeColors } from './stylesheet.ts';

const allNodeTypes: GraphNodeType[] = [
  'user',
  'group',
  'directoryRole',
  'tenantScope',
  'administrativeUnit',
  'appRegistration',
  'enterpriseApplication',
  'appRole',
  'delegatedPermission',
];

describe('node type icons', () => {
  it('provides a distinct, intrinsically sized base64 SVG for every GraphNodeType', () => {
    const icons = allNodeTypes.map(getNodeTypeIcon);

    for (const icon of icons) {
      expect(icon.startsWith('data:image/svg+xml;base64,')).toBe(true);
      const svg = atob(icon.slice('data:image/svg+xml;base64,'.length));
      expect(svg).toContain('width="24"');
      expect(svg).toContain('height="24"');
      expect(svg).toContain('viewBox="0 0 24 24"');
    }

    expect(new Set(icons).size).toBe(allNodeTypes.length);
  });

  it('applies path edge highlighting after generic edge styles', () => {
    const genericEdgeIndex = cytoscapeStylesheet.findIndex((rule) => rule.selector === 'edge');
    const highlightedEdgeIndex = cytoscapeStylesheet.findIndex(
      (rule) => rule.selector === 'edge.analysis-highlighted',
    );

    expect(highlightedEdgeIndex).toBeGreaterThan(genericEdgeIndex);
  });

  it('applies relationship colours after the generic edge style', () => {
    const genericEdgeIndex = cytoscapeStylesheet.findIndex((rule) => rule.selector === 'edge');

    for (const type of Object.keys(edgeTypeColors)) {
      const relationshipStyleIndex = cytoscapeStylesheet.findIndex(
        (rule) => rule.selector === `.edge-type-${type}`,
      );
      expect(relationshipStyleIndex).toBeGreaterThan(genericEdgeIndex);
    }
  });
});
