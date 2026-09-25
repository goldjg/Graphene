import { useCallback, useMemo, useState } from 'react';

import {
  GraphCanvas,
  type GraphCanvasHandle,
  type GraphSelection,
} from '../../graph/cytoscape/GraphCanvas.tsx';
import type { GraphLayoutId } from '../../graph/cytoscape/layouts.ts';
import { demoInvestigationGraph } from '../../graph/model/demoFixture.ts';
import type { InvestigationGraph } from '../../graph/model/types.ts';
import { toCytoscapeElements } from '../../graph/transforms/toCytoscapeElements.ts';
import { DetailsPanel } from './DetailsPanel.tsx';
import { GraphToolbar } from './GraphToolbar.tsx';

/**
 * Feature-level investigation canvas: renders whatever `InvestigationGraph`
 * is currently loaded (demo data today; Microsoft Graph ingestion in a later
 * milestone) alongside view controls and a selection details panel.
 */
export function GraphExplorer() {
  const [graph, setGraph] = useState<InvestigationGraph | null>(null);
  const [layout, setLayout] = useState<GraphLayoutId>('breadthfirst');
  const [selection, setSelection] = useState<GraphSelection | null>(null);
  const [canvasHandle, setCanvasHandle] = useState<GraphCanvasHandle | null>(null);

  const elements = useMemo(() => (graph ? toCytoscapeElements(graph) : []), [graph]);

  const handleLoadDemo = () => {
    setGraph(demoInvestigationGraph);
    setSelection(null);
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

      <GraphToolbar
        graph={graph}
        layout={layout}
        onLayoutChange={setLayout}
        onLoadDemo={handleLoadDemo}
        canvasHandle={canvasHandle}
      />

      <div className="graph-explorer-body">
        <GraphCanvas
          ref={setCanvasRef}
          elements={elements}
          layout={layout}
          onSelectionChange={setSelection}
        />
        <DetailsPanel graph={graph ?? { nodes: [], edges: [] }} selection={selection} />
      </div>
    </section>
  );
}
