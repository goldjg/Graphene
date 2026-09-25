import { describe, expect, it } from 'vitest';

import {
  applyGraphFilters,
  defaultFilterState,
  distinctEdgeTypes,
  distinctNodeTypes,
  isFilterActive,
} from './graphFilters.ts';
import type { InvestigationGraph } from '../model/types.ts';

function provenance(sourceObjectId: string, direct: boolean) {
  return {
    graphEndpoint: '/memberOf',
    sourceObjectId,
    direct,
    relatedObjectIds: [],
  };
}

const sampleGraph: InvestigationGraph = {
  nodes: [
    { id: 'user-1', type: 'user', label: 'User One', metadata: {} },
    { id: 'group-1', type: 'group', label: 'Group One', metadata: {} },
    { id: 'role-1', type: 'directoryRole', label: 'Role One', metadata: {} },
  ],
  edges: [
    {
      id: 'edge-direct',
      source: 'user-1',
      target: 'group-1',
      type: 'memberOf',
      inherited: false,
      provenance: provenance('user-1', true),
      metadata: {},
    },
    {
      id: 'edge-inherited',
      source: 'user-1',
      target: 'role-1',
      type: 'assignedRole',
      inherited: true,
      provenance: provenance('user-1', false),
      metadata: {},
    },
  ],
};

describe('defaultFilterState', () => {
  it('starts with no filters active', () => {
    expect(isFilterActive(defaultFilterState())).toBe(false);
  });
});

describe('distinctNodeTypes / distinctEdgeTypes', () => {
  it('returns the sorted distinct types present in the graph', () => {
    expect(distinctNodeTypes(sampleGraph)).toEqual(['directoryRole', 'group', 'user']);
    expect(distinctEdgeTypes(sampleGraph)).toEqual(['assignedRole', 'memberOf']);
  });
});

describe('applyGraphFilters', () => {
  it('returns the full graph unchanged when no filters are active', () => {
    const result = applyGraphFilters(sampleGraph, defaultFilterState());
    expect(result).toEqual(sampleGraph);
  });

  it('hides nodes of a filtered type and any edges referencing them', () => {
    const result = applyGraphFilters(sampleGraph, {
      ...defaultFilterState(),
      hiddenNodeTypes: new Set(['directoryRole']),
    });

    expect(result.nodes.map((node) => node.id)).toEqual(['user-1', 'group-1']);
    expect(result.edges.map((edge) => edge.id)).toEqual(['edge-direct']);
  });

  it('hides edges of a filtered type without removing their nodes', () => {
    const result = applyGraphFilters(sampleGraph, {
      ...defaultFilterState(),
      hiddenEdgeTypes: new Set(['assignedRole']),
    });

    expect(result.nodes).toEqual(sampleGraph.nodes);
    expect(result.edges.map((edge) => edge.id)).toEqual(['edge-direct']);
  });

  it('hides inherited edges when hideInherited is set', () => {
    const result = applyGraphFilters(sampleGraph, {
      ...defaultFilterState(),
      hideInherited: true,
    });

    expect(result.edges.map((edge) => edge.id)).toEqual(['edge-direct']);
  });

  it('is non-destructive: the source graph object is never mutated', () => {
    const original = JSON.parse(JSON.stringify(sampleGraph)) as InvestigationGraph;
    applyGraphFilters(sampleGraph, {
      ...defaultFilterState(),
      hiddenNodeTypes: new Set(['user']),
      hideInherited: true,
    });
    expect(sampleGraph).toEqual(original);
  });
});
