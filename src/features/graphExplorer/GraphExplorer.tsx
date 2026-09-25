import { useCallback, useMemo, useState } from 'react';

import {
  GraphCanvas,
  type GraphCanvasHandle,
  type GraphSelection,
} from '../../graph/cytoscape/GraphCanvas.tsx';
import type { GraphLayoutId } from '../../graph/cytoscape/layouts.ts';
import { applyGraphFilters, defaultFilterState } from '../../graph/filters/graphFilters.ts';
import { demoInvestigationGraph } from '../../graph/model/demoFixture.ts';
import type { InvestigationGraph } from '../../graph/model/types.ts';
import { toCytoscapeElements } from '../../graph/transforms/toCytoscapeElements.ts';
import { QueryPanel } from '../investigation/QueryPanel.tsx';
import { DetailsPanel } from './DetailsPanel.tsx';
import { FilterPanel } from './FilterPanel.tsx';
import { GraphToolbar } from './GraphToolbar.tsx';

/**
 * Feature-level investigation canvas: renders whatever `InvestigationGraph`
 * is currently loaded (demo data, or a live Microsoft Graph investigation
 * from `QueryPanel`) alongside view controls and a selection details panel.
 */
export function GraphExplorer() {
  const [graph, setGraph] = useState<InvestigationGraph | null>(null);
  const [layout, setLayout] = useState<GraphLayoutId>('breadthfirst');
  const [selection, setSelection] = useState<GraphSelection | null>(null);
  const [canvasHandle, setCanvasHandle] = useState<GraphCanvasHandle | null>(null);
  const [filters, setFilters] = useState(defaultFilterState());

  const filteredGraph = useMemo(
    () => (graph ? applyGraphFilters(graph, filters) : null),
    [graph, filters],
  );

  const elements = useMemo(
    () => (filteredGraph ? toCytoscapeElements(filteredGraph) : []),
    [filteredGraph],
  );

  const handleLoadDemo = () => {
    setGraph(demoInvestigationGraph);
    setSelection(null);
    setFilters(defaultFilterState());
  };

  const handleQueryResult = (result: InvestigationGraph) => {
    setGraph(result);
    setSelection(null);
    setFilters(defaultFilterState());
  };

  const handleQueryReset = () => {
    setGraph(null);
    setSelection(null);
    setFilters(defaultFilterState());
  };

  const setCanvasRef = useCallback((handle: GraphCanvasHandle | null) => {
    setCanvasHandle(handle);
  }, []);

  return (
    <section className="graph-explorer" aria-labelledby="graph-explorer-heading">
      <h2 id="graph-explorer-heading">Investigation graph</h2>
      <p className="setup-ready" role="status">
        Demo data is clearly labelled sample data. Loading it never calls Microsoft Graph.
      </p>

      <QueryPanel onResult={handleQueryResult} onReset={handleQueryReset} />

      <GraphToolbar
        graph={filteredGraph}
        layout={layout}
        onLayoutChange={setLayout}
        onLoadDemo={handleLoadDemo}
        canvasHandle={canvasHandle}
      />

      {graph && <FilterPanel graph={graph} filters={filters} onChange={setFilters} />}

      <div className="graph-explorer-body">
        <GraphCanvas
          ref={setCanvasRef}
          elements={elements}
          layout={layout}
          onSelectionChange={setSelection}
        />
        <DetailsPanel graph={filteredGraph ?? { nodes: [], edges: [] }} selection={selection} />
      </div>
    </section>
  );
}
