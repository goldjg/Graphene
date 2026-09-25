import { graphLayoutLabels, type GraphLayoutId } from '../../graph/cytoscape/layouts.ts';
import type { GraphCanvasHandle } from '../../graph/cytoscape/GraphCanvas.tsx';
import type { InvestigationGraph } from '../../graph/model/types.ts';

interface GraphToolbarProps {
  graph: InvestigationGraph | null;
  layout: GraphLayoutId;
  onLayoutChange: (layout: GraphLayoutId) => void;
  onLoadDemo: () => void;
  canvasHandle: GraphCanvasHandle | null;
}

/**
 * Toolbar for the investigation canvas: demo loading, view controls, layout
 * selection, and graph statistics. All actions operate on the already
 * rendered graph; none of them fetch data from Microsoft Graph.
 */
export function GraphToolbar({
  graph,
  layout,
  onLayoutChange,
  onLoadDemo,
  canvasHandle,
}: GraphToolbarProps) {
  const nodeCount = graph?.nodes.length ?? 0;
  const edgeCount = graph?.edges.length ?? 0;

  return (
    <div className="graph-toolbar" role="toolbar" aria-label="Graph view controls">
      <div className="button-row">
        <button type="button" onClick={onLoadDemo}>
          Load demo data
        </button>
        <button type="button" onClick={() => canvasHandle?.fit()} disabled={!graph}>
          Fit
        </button>
        <button type="button" onClick={() => canvasHandle?.resetView()} disabled={!graph}>
          Reset view
        </button>
        <button type="button" onClick={() => canvasHandle?.zoomBy(1.2)} disabled={!graph}>
          Zoom in
        </button>
        <button type="button" onClick={() => canvasHandle?.zoomBy(1 / 1.2)} disabled={!graph}>
          Zoom out
        </button>
        <button type="button" onClick={() => exportGraphJson(canvasHandle)} disabled={!graph}>
          Export graph JSON
        </button>
      </div>

      <label className="layout-select">
        Layout
        <select
          value={layout}
          onChange={(event) => onLayoutChange(event.target.value as GraphLayoutId)}
        >
          {Object.entries(graphLayoutLabels).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <p className="graph-stats" role="status">
        {graph ? `${nodeCount} nodes, ${edgeCount} edges` : 'No graph loaded'}
      </p>
    </div>
  );
}

function exportGraphJson(canvasHandle: GraphCanvasHandle | null) {
  if (!canvasHandle) {
    return;
  }

  const elements = canvasHandle.exportElementsJson();
  const blob = new Blob([JSON.stringify(elements, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'graphene-investigation-graph.json';
  link.click();
  URL.revokeObjectURL(url);
}
