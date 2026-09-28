import { describe, expect, it } from 'vitest';

import type cytoscape from 'cytoscape';

import type { GraphNodeType } from '../model/types.ts';
import { getNodeTypeIcon } from './icons.ts';
import {
  colouredEdgeTypes,
  createCytoscapeStylesheet,
  getEdgeTypeColor,
  getNodeTypeAppearance,
  styledNodeTypes,
} from './stylesheet.ts';

/**
 * `StylesheetJsonBlock` is a union that also covers raw-CSS blocks, so the
 * style object has to be narrowed before it can be asserted against.
 */
function styleFor(stylesheet: cytoscape.StylesheetJsonBlock[], selector: string) {
  const rule = stylesheet.find((entry) => entry.selector === selector);

  if (!rule || !('style' in rule)) {
    throw new Error(`No style block found for selector "${selector}".`);
  }

  return rule.style;
}

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
    const stylesheet = createCytoscapeStylesheet('dark');
    const genericEdgeIndex = stylesheet.findIndex((rule) => rule.selector === 'edge');
    const highlightedEdgeIndex = stylesheet.findIndex(
      (rule) => rule.selector === 'edge.analysis-highlighted',
    );

    expect(highlightedEdgeIndex).toBeGreaterThan(genericEdgeIndex);
  });

  it('applies relationship colours after the generic edge style', () => {
    const stylesheet = createCytoscapeStylesheet('dark');
    const genericEdgeIndex = stylesheet.findIndex((rule) => rule.selector === 'edge');

    for (const type of colouredEdgeTypes) {
      const relationshipStyleIndex = stylesheet.findIndex(
        (rule) => rule.selector === `.edge-type-${type}`,
      );
      expect(relationshipStyleIndex).toBeGreaterThan(genericEdgeIndex);
    }
  });
});

describe('themed canvas stylesheet', () => {
  it('keeps node type tile colours identical across themes so meaning is stable', () => {
    for (const type of styledNodeTypes) {
      expect(getNodeTypeAppearance(type, 'light').color).toEqual(
        getNodeTypeAppearance(type, 'dark').color,
      );
    }
  });

  it('uses a distinct node border per theme for contrast against the canvas', () => {
    for (const type of styledNodeTypes) {
      expect(getNodeTypeAppearance(type, 'light').borderColor).not.toEqual(
        getNodeTypeAppearance(type, 'dark').borderColor,
      );
    }
  });

  it('darkens every coloured relationship for the light canvas', () => {
    for (const type of colouredEdgeTypes) {
      expect(getEdgeTypeColor(type, 'light')).not.toEqual(getEdgeTypeColor(type, 'dark'));
    }
  });

  it('inverts label, outline, and selection colours between themes', () => {
    const dark = createCytoscapeStylesheet('dark');
    const light = createCytoscapeStylesheet('light');

    expect(styleFor(dark, 'node')).toMatchObject({
      color: '#f8fafc',
      'text-outline-color': '#0b1220',
    });
    expect(styleFor(light, 'node')).toMatchObject({
      color: '#0f172a',
      'text-outline-color': '#ffffff',
    });

    expect(styleFor(dark, 'node:selected')).toMatchObject({ 'border-color': '#facc15' });
    expect(styleFor(light, 'node:selected')).toMatchObject({ 'border-color': '#b45309' });
  });

  it('produces the same rule order for both themes', () => {
    expect(createCytoscapeStylesheet('light').map((rule) => rule.selector)).toEqual(
      createCytoscapeStylesheet('dark').map((rule) => rule.selector),
    );
  });
});
