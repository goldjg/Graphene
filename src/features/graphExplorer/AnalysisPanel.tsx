import { useMemo, useState, type ChangeEvent } from 'react';

import type { GraphCanvasHandle } from '../../graph/cytoscape/GraphCanvas.tsx';
import { nodeTypeLabels } from '../../graph/model/labels.ts';
import type { InvestigationGraph } from '../../graph/model/types.ts';
import {
  compareGraphs,
  explainGraphPath,
  findGraphPaths,
  searchGraphNodes,
  summarizeGraph,
  type GraphComparison,
} from '../../graph/analysis/graphAnalysis.ts';
import { parseSnapshot } from '../../graph/analysis/snapshots.ts';

interface AnalysisPanelProps {
  graph: InvestigationGraph;
  visibleGraph: InvestigationGraph;
  canvasHandle: GraphCanvasHandle | null;
  onImportGraph: (graph: InvestigationGraph) => void;
}

export function AnalysisPanel({
  graph,
  visibleGraph,
  canvasHandle,
  onImportGraph,
}: AnalysisPanelProps) {
  const summary = useMemo(() => summarizeGraph(graph), [graph]);
  const [searchQuery, setSearchQuery] = useState('');
  const [pathStart, setPathStart] = useState('');
  const [pathEnd, setPathEnd] = useState('');
  const [pathMode, setPathMode] = useState<'shortest' | 'all'>('shortest');
  const [pathMessage, setPathMessage] = useState<string | null>(null);
  const [comparison, setComparison] = useState<GraphComparison | null>(null);
  const [fileMessage, setFileMessage] = useState<string | null>(null);
  const searchResults = useMemo(
    () => searchGraphNodes(visibleGraph, searchQuery),
    [searchQuery, visibleGraph],
  );

  const handleSearch = () => {
    const ids = searchResults.map((node) => node.id);
    canvasHandle?.highlightElements(ids);
    if (ids.length === 1) {
      canvasHandle?.focusNode(ids[0]!);
    }
  };

  const handleFindPaths = () => {
    const paths = findGraphPaths(visibleGraph, pathStart, pathEnd, pathMode);
    const first = paths[0];
    if (!first) {
      canvasHandle?.clearHighlights();
      setPathMessage('No path was found in the currently visible graph.');
      return;
    }
    canvasHandle?.highlightElements([...first.nodeIds, ...first.edgeIds]);
    setPathMessage(
      `${paths.length}${paths.length === 10 ? '+' : ''} path(s) found. ${explainGraphPath(
        visibleGraph,
        first,
      )}`,
    );
  };

  const handleSnapshot = async (
    event: ChangeEvent<HTMLInputElement>,
    action: 'import' | 'compare',
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    try {
      const snapshot = parseSnapshot(JSON.parse(await file.text()) as unknown);
      if (action === 'import') {
        onImportGraph(snapshot.graph);
        setComparison(null);
        setFileMessage(`Imported snapshot exported at ${snapshot.exportedAt}.`);
      } else {
        setComparison(compareGraphs(snapshot.graph, graph));
        setFileMessage(`Compared current graph with snapshot exported at ${snapshot.exportedAt}.`);
      }
    } catch (error) {
      setFileMessage(error instanceof Error ? error.message : 'Could not read snapshot.');
    }
  };

  return (
    <section className="analysis-panel" aria-labelledby="analysis-heading">
      <h3 id="analysis-heading">Analyze loaded graph</h3>
      <div className="analysis-summary">
        <strong>
          {summary.nodeCount} objects, {summary.edgeCount} relationships
        </strong>
        <span>
          {summary.directEdgeCount} direct; {summary.inheritedEdgeCount} inherited
        </span>
        <span>
          {Object.entries(summary.nodeCounts)
            .map(
              ([type, count]) => `${count} ${nodeTypeLabels[type as keyof typeof nodeTypeLabels]}`,
            )
            .join(', ')}
        </span>
      </div>

      <fieldset>
        <legend>Search and focus</legend>
        <label>
          Name, ID, permission, or metadata
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </label>
        <div className="button-row">
          <button type="button" onClick={handleSearch} disabled={!searchQuery.trim()}>
            Highlight {searchResults.length} match{searchResults.length === 1 ? '' : 'es'}
          </button>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              canvasHandle?.clearHighlights();
            }}
          >
            Clear highlight
          </button>
        </div>
      </fieldset>

      <fieldset>
        <legend>Path finder</legend>
        <label>
          From
          <select value={pathStart} onChange={(event) => setPathStart(event.target.value)}>
            <option value="">Select an object</option>
            {visibleGraph.nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label} ({nodeTypeLabels[node.type]})
              </option>
            ))}
          </select>
        </label>
        <label>
          To
          <select value={pathEnd} onChange={(event) => setPathEnd(event.target.value)}>
            <option value="">Select an object</option>
            {visibleGraph.nodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.label} ({nodeTypeLabels[node.type]})
              </option>
            ))}
          </select>
        </label>
        <label>
          Paths
          <select
            value={pathMode}
            onChange={(event) => setPathMode(event.target.value as 'shortest' | 'all')}
          >
            <option value="shortest">Shortest paths</option>
            <option value="all">All simple paths (maximum 10, depth 12)</option>
          </select>
        </label>
        <button type="button" onClick={handleFindPaths} disabled={!pathStart || !pathEnd}>
          Find paths
        </button>
        {pathMessage ? <p className="analysis-message">{pathMessage}</p> : null}
      </fieldset>

      <fieldset>
        <legend>Snapshots</legend>
        <p>
          Snapshot files contain directory metadata. Store and share them as sensitive investigation
          evidence.
        </p>
        <div className="button-row">
          <label className="file-button">
            Import snapshot
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => void handleSnapshot(event, 'import')}
            />
          </label>
          <label className="file-button">
            Compare with snapshot
            <input
              type="file"
              accept="application/json,.json"
              onChange={(event) => void handleSnapshot(event, 'compare')}
            />
          </label>
        </div>
        {fileMessage ? <p className="analysis-message">{fileMessage}</p> : null}
        {comparison ? (
          <p className="analysis-message">
            Added: {comparison.addedNodeIds.length} objects and {comparison.addedEdgeIds.length}{' '}
            relationships. Removed: {comparison.removedNodeIds.length} objects and{' '}
            {comparison.removedEdgeIds.length} relationships. Changed:{' '}
            {comparison.changedNodeIds.length} objects and {comparison.changedEdgeIds.length}{' '}
            relationships.
          </p>
        ) : null}
      </fieldset>
    </section>
  );
}
