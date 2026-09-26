import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useAuth } from '../../auth/useAuth.ts';
import { mergeGraphs } from '../../graph/analysis/graphAnalysis.ts';
import {
  GraphCanvas,
  type GraphCanvasHandle,
  type GraphSelection,
} from '../../graph/cytoscape/GraphCanvas.tsx';
import type { GraphLayoutId } from '../../graph/cytoscape/layouts.ts';
import { applyGraphFilters, defaultFilterState } from '../../graph/filters/graphFilters.ts';
import { demoInvestigationGraph } from '../../graph/model/demoFixture.ts';
import type { InvestigationGraph } from '../../graph/model/types.ts';
import { mapGraphError } from '../../microsoftGraph/client/errors.ts';
import { buildInvestigationGraph } from '../../microsoftGraph/ingestion/buildInvestigationGraph.ts';
import type { InvestigationTargetType } from '../../microsoftGraph/ingestion/target.ts';
import { toCytoscapeElements } from '../../graph/transforms/toCytoscapeElements.ts';
import { QueryPanel } from '../investigation/QueryPanel.tsx';
import { DetailsPanel } from './DetailsPanel.tsx';
import { FilterPanel } from './FilterPanel.tsx';
import { GraphToolbar } from './GraphToolbar.tsx';
import { AnalysisPanel } from './AnalysisPanel.tsx';

/**
 * Feature-level investigation canvas: renders whatever `InvestigationGraph`
 * is currently loaded (demo data, or a live Microsoft Graph investigation
 * from `QueryPanel`) alongside view controls and a selection details panel.
 */
export function GraphExplorer() {
  const { getGraphClient, status: authStatus } = useAuth();
  const [graph, setGraph] = useState<InvestigationGraph | null>(null);
  const [layout, setLayout] = useState<GraphLayoutId>('accessPath');
  const [selection, setSelection] = useState<GraphSelection | null>(null);
  const [canvasHandle, setCanvasHandle] = useState<GraphCanvasHandle | null>(null);
  const [filters, setFilters] = useState(defaultFilterState());
  const [expansionMessage, setExpansionMessage] = useState<string | null>(null);
  const [isExpanding, setIsExpanding] = useState(false);
  const graphGenerationRef = useRef(0);
  const expansionAbortRef = useRef<AbortController | null>(null);

  const filteredGraph = useMemo(
    () => (graph ? applyGraphFilters(graph, filters) : null),
    [graph, filters],
  );

  const elements = useMemo(
    () => (filteredGraph ? toCytoscapeElements(filteredGraph) : []),
    [filteredGraph],
  );

  const replaceGraph = useCallback((nextGraph: InvestigationGraph | null) => {
    expansionAbortRef.current?.abort();
    expansionAbortRef.current = null;
    graphGenerationRef.current += 1;
    setGraph(nextGraph);
    setSelection(null);
    setFilters(defaultFilterState());
    setExpansionMessage(null);
    setIsExpanding(false);
  }, []);

  useEffect(() => () => expansionAbortRef.current?.abort(), []);

  const handleLoadDemo = () => replaceGraph(demoInvestigationGraph);

  const handleQueryResult = (result: InvestigationGraph) => replaceGraph(result);

  const handleQueryReset = () => replaceGraph(null);

  const setCanvasRef = useCallback((handle: GraphCanvasHandle | null) => {
    setCanvasHandle(handle);
  }, []);

  const selectedNode =
    selection?.kind === 'node'
      ? (graph?.nodes.find((node) => node.id === selection.id) ?? null)
      : null;
  const expansionTarget = selectedNode ? expansionTargetForNode(selectedNode.type) : null;

  const handleExpandSelected = async () => {
    if (!graph || !selectedNode || !expansionTarget) {
      return;
    }
    const graphClient = getGraphClient();
    if (!graphClient) {
      setExpansionMessage('Sign in before expanding a live directory object.');
      return;
    }

    setIsExpanding(true);
    setExpansionMessage(null);
    expansionAbortRef.current?.abort();
    const controller = new AbortController();
    expansionAbortRef.current = controller;
    const graphGeneration = graphGenerationRef.current;
    try {
      const expanded = await buildInvestigationGraph(
        graphClient,
        {
          type: expansionTarget,
          identifier: selectedNode.id,
        },
        controller.signal,
      );
      if (controller.signal.aborted || graphGenerationRef.current !== graphGeneration) {
        return;
      }
      const expansionGraph = {
        ...expanded,
        nodes: expanded.nodes.map((node) => ({ ...node, isInvestigationTarget: false })),
      };
      setGraph((current) => (current ? mergeGraphs(current, expansionGraph) : expansionGraph));
      setExpansionMessage(
        `Expanded ${selectedNode.label}: merged ${expanded.nodes.length} objects and ${expanded.edges.length} relationships.`,
      );
    } catch (error) {
      if (controller.signal.aborted || graphGenerationRef.current !== graphGeneration) {
        return;
      }
      setExpansionMessage(mapGraphError(error).message);
    } finally {
      if (expansionAbortRef.current === controller) {
        expansionAbortRef.current = null;
        setIsExpanding(false);
      }
    }
  };

  return (
    <section className="graph-explorer" aria-labelledby="graph-explorer-heading">
      <h2 id="graph-explorer-heading">Investigation graph</h2>
      <p className="setup-ready" role="status">
        Demo data is clearly labelled sample data. Loading it never calls Microsoft Graph.
      </p>

      <QueryPanel onResult={handleQueryResult} onReset={handleQueryReset} />

      <GraphToolbar
        graph={filteredGraph}
        exportGraph={graph}
        layout={layout}
        onLayoutChange={setLayout}
        onLoadDemo={handleLoadDemo}
        canvasHandle={canvasHandle}
      />

      {graph && <FilterPanel graph={graph} filters={filters} onChange={setFilters} />}
      {graph && filteredGraph ? (
        <AnalysisPanel
          graph={graph}
          visibleGraph={filteredGraph}
          canvasHandle={canvasHandle}
          onImportGraph={handleQueryResult}
        />
      ) : null}

      <div className="graph-explorer-body">
        <div className="graph-stage">
          <GraphCanvas
            ref={setCanvasRef}
            elements={elements}
            layout={layout}
            onSelectionChange={setSelection}
          />
        </div>
        <DetailsPanel
          graph={filteredGraph ?? { nodes: [], edges: [] }}
          selection={selection}
          canExpand={Boolean(expansionTarget) && authStatus === 'authenticated'}
          isExpanding={isExpanding}
          expansionMessage={expansionMessage}
          onExpand={() => void handleExpandSelected()}
        />
      </div>
    </section>
  );
}

function expansionTargetForNode(type: string): InvestigationTargetType | null {
  switch (type) {
    case 'user':
      return 'user';
    case 'group':
      return 'group';
    case 'appRegistration':
      return 'application';
    case 'enterpriseApplication':
      return 'servicePrincipal';
    case 'directoryRole':
      return 'directoryRole';
    case 'administrativeUnit':
      return 'administrativeUnit';
    case 'device':
      return 'device';
    default:
      return null;
  }
}
