import { describe, expect, it } from 'vitest';

import type { InvestigationGraph } from '../model/types.ts';
import { toCytoscapeElements } from './toCytoscapeElements.ts';

const graph: InvestigationGraph = {
  nodes: [
    { id: 'user-a', type: 'user', label: 'User A', subtitle: 'a@example.test', metadata: {} },
    { id: 'group-a', type: 'group', label: 'Group A', metadata: {} },
  ],
  edges: [
    {
      id: 'edge-direct',
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
    {
      id: 'edge-inherited',
      source: 'user-a',
      target: 'group-a',
      type: 'transitiveMemberOf',
      inherited: true,
      provenance: {
        graphEndpoint: 'GET /users/{id}/transitiveMemberOf',
        sourceObjectId: 'user-a',
        direct: false,
        relatedObjectIds: ['user-a', 'group-a'],
      },
      metadata: {},
    },
  ],
};

describe('toCytoscapeElements', () => {
  it('maps every node and edge to a Cytoscape element', () => {
    const elements = toCytoscapeElements(graph);

    expect(elements).toHaveLength(4);
  });

  it('tags node elements with a type-specific class and preserves label data', () => {
    const elements = toCytoscapeElements(graph);
    const userElement = elements.find((element) => element.data.id === 'user-a');

    expect(userElement?.classes).toBe('node-type-user');
    expect(userElement?.data).toMatchObject({ label: 'User A', subtitle: 'a@example.test' });
  });

  it('distinguishes direct edges from inherited edges via classes', () => {
    const elements = toCytoscapeElements(graph);
    const direct = elements.find((element) => element.data.id === 'edge-direct');
    const inherited = elements.find((element) => element.data.id === 'edge-inherited');

    expect(direct?.classes).toBe('edge-type-memberOf edge-direct');
    expect(inherited?.classes).toBe('edge-type-transitiveMemberOf edge-inherited');
  });
});
