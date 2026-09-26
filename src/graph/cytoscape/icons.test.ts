import { describe, expect, it } from 'vitest';

import type { GraphNodeType } from '../model/types.ts';
import { getNodeTypeIcon } from './icons.ts';
import { cytoscapeStylesheet } from './stylesheet.ts';

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
  it('provides a distinct SVG data URI icon for every GraphNodeType', () => {
    const icons = allNodeTypes.map(getNodeTypeIcon);

    for (const icon of icons) {
      expect(icon.startsWith('data:image/svg+xml;utf8,')).toBe(true);
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
});
