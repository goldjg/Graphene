import { describe, expect, it } from 'vitest';

import type { InvestigationGraph } from '../model/types.ts';
import { mergeInvestigationGraphs } from './mergeGraphs.ts';

function makeGraph(overrides: Partial<InvestigationGraph> = {}): InvestigationGraph {
  return {
    nodes: [
      { id: 'user-a', type: 'user', label: 'User A', metadata: {} },
      { id: 'group-a', type: 'group', label: 'Group A', metadata: {} },
    ],
    edges: [
      {
        id: 'edge-a',
        source: 'user-a',
        target: 'group-a',
        type: 'memberOf',
        inherited: false,
        provenance: {
          graphEndpoint: 'GET /users/{id}/memberOf',
          sourceObjectId: 'user-a',
          direct: true,
          relatedObjectIds: ['user-a', 'group-a'],
        },
        metadata: {},
      },
    ],
    ...overrides,
  };
}

describe('mergeInvestigationGraphs', () => {
  it('deduplicates nodes and edges by id across graphs', () => {
    const first = makeGraph();
    const second = makeGraph({
      nodes: [
        { id: 'user-a', type: 'user', label: 'User A (duplicate)', metadata: {} },
        { id: 'user-b', type: 'user', label: 'User B', metadata: {} },
      ],
    });

    const merged = mergeInvestigationGraphs([first, second]);

    expect(merged.nodes).toHaveLength(3);
    expect(merged.edges).toHaveLength(1);
    expect(merged.nodes.find((node) => node.id === 'user-a')?.label).toBe('User A');
  });

  it('returns an empty graph when given no input graphs', () => {
    expect(mergeInvestigationGraphs([])).toEqual({ nodes: [], edges: [] });
  });
});
