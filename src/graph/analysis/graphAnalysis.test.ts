import { describe, expect, it } from 'vitest';

import { demoInvestigationGraph } from '../model/demoFixture.ts';
import {
  compareGraphs,
  explainGraphPath,
  findGraphPaths,
  mergeGraphs,
  searchGraphNodes,
  summarizeGraph,
} from './graphAnalysis.ts';
import { createSnapshot, graphToCsv, parseSnapshot } from './snapshots.ts';

describe('graph analysis', () => {
  it('searches normalized fields and metadata without changing the graph', () => {
    expect(searchGraphNodes(demoInvestigationGraph, 'ada').map((node) => node.id)).toContain(
      'user-ada',
    );
    expect(searchGraphNodes(demoInvestigationGraph, 'Directory.Read.All')).not.toHaveLength(0);
  });

  it('finds and explains a shortest path', () => {
    const paths = findGraphPaths(
      demoInvestigationGraph,
      'user-ada',
      'group-directory-readers',
      'shortest',
    );

    expect(paths).toHaveLength(1);
    expect(explainGraphPath(demoInvestigationGraph, paths[0]!)).toContain('Inherited member of');
  });

  it('summarizes and merges graphs without duplicate IDs', () => {
    const merged = mergeGraphs(demoInvestigationGraph, demoInvestigationGraph);
    expect(merged).toEqual(demoInvestigationGraph);
    expect(summarizeGraph(merged)).toMatchObject({
      nodeCount: demoInvestigationGraph.nodes.length,
      edgeCount: demoInvestigationGraph.edges.length,
    });
  });

  it('preserves richer existing node data when merging sparse expansion results', () => {
    const merged = mergeGraphs(
      {
        nodes: [
          {
            id: 'user-1',
            type: 'user',
            label: 'Ada Lovelace',
            subtitle: 'ada@example.test',
            metadata: { mail: 'ada@example.test', accountEnabled: true },
          },
        ],
        edges: [],
      },
      {
        nodes: [
          {
            id: 'user-1',
            type: 'user',
            label: 'user-1',
            metadata: { mail: undefined, userType: 'Member' },
          },
        ],
        edges: [],
      },
    );

    expect(merged.nodes[0]).toMatchObject({
      label: 'Ada Lovelace',
      subtitle: 'ada@example.test',
      metadata: {
        mail: 'ada@example.test',
        accountEnabled: true,
        userType: 'Member',
      },
    });
  });

  it('round-trips versioned snapshots and compares graphs', () => {
    const snapshot = parseSnapshot(createSnapshot(demoInvestigationGraph));
    expect(snapshot.graph).toEqual(demoInvestigationGraph);
    expect(compareGraphs({ nodes: [], edges: [] }, snapshot.graph).addedNodeIds).toHaveLength(
      demoInvestigationGraph.nodes.length,
    );
  });

  it('rejects malformed snapshots and exports provenance CSV', () => {
    expect(() =>
      parseSnapshot({ schemaVersion: 1, exportedAt: new Date().toISOString(), graph: {} }),
    ).toThrow('node and edge arrays');
    expect(graphToCsv(demoInvestigationGraph)).toContain('graphEndpoint');
    expect(graphToCsv(demoInvestigationGraph)).toContain('GET /users/{id}/memberOf');
  });

  it('rejects inconsistent snapshot fields and neutralizes CSV formulas', () => {
    const snapshot = createSnapshot({
      nodes: [
        {
          id: 'user-1',
          type: 'user',
          label: '=HYPERLINK("https://example.test")',
          metadata: {},
        },
        { id: 'group-1', type: 'group', label: 'Group', metadata: {} },
      ],
      edges: [
        {
          id: 'edge-1',
          source: 'user-1',
          target: 'group-1',
          type: 'memberOf',
          inherited: false,
          provenance: {
            graphEndpoint: '/users/user-1/memberOf',
            sourceObjectId: 'user-1',
            direct: true,
            relatedObjectIds: ['user-1', 'group-1'],
          },
          metadata: {},
        },
      ],
    });
    const invalid = structuredClone(snapshot) as unknown as {
      graph: { edges: { inherited: boolean }[] };
    };
    invalid.graph.edges[0]!.inherited = true;

    expect(() => parseSnapshot(invalid)).toThrow('invalid edge');
    expect(() =>
      parseSnapshot({
        ...snapshot,
        graph: {
          ...snapshot.graph,
          nodes: [{ ...snapshot.graph.nodes[0], subtitle: { unsafe: true } }],
        },
      }),
    ).toThrow('invalid node');
    expect(graphToCsv(snapshot.graph)).toContain(`"'=HYPERLINK`);
    expect(graphToCsv(snapshot.graph)).toContain('"user-1 group-1"');
  });
});
