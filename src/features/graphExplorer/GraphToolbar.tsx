import { graphLayoutLabels, type GraphLayoutId } from '../../graph/cytoscape/layouts.ts';
import type { GraphCanvasHandle } from '../../graph/cytoscape/GraphCanvas.tsx';
import type { InvestigationGraph } from '../../graph/model/types.ts';
import { createSnapshot, graphToCsv } from '../../graph/analysis/snapshots.ts';

interface GraphToolbarProps {
  graph: InvestigationGraph | null;
  exportGraph: InvestigationGraph | null;
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
  exportGraph,
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
        <button type="button" onClick={() => exportGraphSnapshot(exportGraph)} disabled={!graph}>
          Export snapshot
        </button>
        <button type="button" onClick={() => exportGraphCsv(graph)} disabled={!graph}>
          Export relationships CSV
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

function exportGraphSnapshot(graph: InvestigationGraph | null) {
  if (!graph) {
    return;
  }

  downloadFile(
    JSON.stringify(createSnapshot(graph), null, 2),
    'application/json',
    'graphene-investigation-snapshot.json',
  );
}

function exportGraphCsv(graph: InvestigationGraph | null) {
  if (!graph) {
    return;
  }
  downloadFile(graphToCsv(graph), 'text/csv;charset=utf-8', 'graphene-relationships.csv');
}

function downloadFile(contents: string, type: string, fileName: string) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}
