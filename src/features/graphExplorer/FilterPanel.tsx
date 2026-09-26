import type { GraphEdgeType, GraphNodeType, InvestigationGraph } from '../../graph/model/types.ts';
import { edgeTypeLabels, nodeTypeLabels } from '../../graph/model/labels.ts';
import { getNodeTypeIcon } from '../../graph/cytoscape/icons.ts';
import { getEdgeTypeColor, nodeTypeAppearance } from '../../graph/cytoscape/stylesheet.ts';
import {
  applyGraphFilters,
  distinctEdgeTypes,
  distinctNodeTypes,
  isFilterActive,
  type GraphFilterState,
} from '../../graph/filters/graphFilters.ts';

interface FilterPanelProps {
  graph: InvestigationGraph;
  filters: GraphFilterState;
  onChange: (filters: GraphFilterState) => void;
}

/**
 * Non-destructive, display-time filtering controls over an already-loaded
 * graph. Every toggle here only changes what is rendered; it never triggers
 * a new Microsoft Graph query and never mutates the loaded graph data.
 *
 * This panel doubles as the graph's key/legend: every object-type filter
 * shows the same icon badge rendered on the canvas, and the relationship
 * key at the bottom explains edge colour and direct/inherited line style.
 */
export function FilterPanel({ graph, filters, onChange }: FilterPanelProps) {
  const nodeTypes = distinctNodeTypes(graph);
  const edgeTypes = distinctEdgeTypes(graph);
  const visible = applyGraphFilters(graph, filters);
  const hiddenNodeCount = graph.nodes.length - visible.nodes.length;
  const hiddenEdgeCount = graph.edges.length - visible.edges.length;
  const active = isFilterActive(filters);

  const toggleNodeType = (type: GraphNodeType) => {
    const hiddenNodeTypes = new Set(filters.hiddenNodeTypes);
    if (hiddenNodeTypes.has(type)) {
      hiddenNodeTypes.delete(type);
    } else {
      hiddenNodeTypes.add(type);
    }
    onChange({ ...filters, hiddenNodeTypes });
  };

  const toggleEdgeType = (type: GraphEdgeType) => {
    const hiddenEdgeTypes = new Set(filters.hiddenEdgeTypes);
    if (hiddenEdgeTypes.has(type)) {
      hiddenEdgeTypes.delete(type);
    } else {
      hiddenEdgeTypes.add(type);
    }
    onChange({ ...filters, hiddenEdgeTypes });
  };

  const toggleHideInherited = () => {
    onChange({ ...filters, hideInherited: !filters.hideInherited });
  };

  const resetFilters = () => {
    onChange({ hiddenNodeTypes: new Set(), hiddenEdgeTypes: new Set(), hideInherited: false });
  };

  return (
    <section className="filter-panel" aria-labelledby="filter-panel-heading">
      <h3 id="filter-panel-heading">Filters &amp; key</h3>
      <p className="filter-status" role="status">
        {active
          ? `Filters active: ${hiddenNodeCount} of ${graph.nodes.length} nodes hidden, ` +
            `${hiddenEdgeCount} of ${graph.edges.length} edges hidden.`
          : 'No filters active. Showing the full loaded graph.'}
      </p>

      <fieldset>
        <legend>Object types</legend>
        {nodeTypes.map((type) => (
          <label key={type} className="filter-checkbox">
            <input
              type="checkbox"
              checked={!filters.hiddenNodeTypes.has(type)}
              onChange={() => toggleNodeType(type)}
            />
            <span
              className="filter-icon-badge"
              style={{
                backgroundColor: nodeTypeAppearance[type].color,
                borderColor: nodeTypeAppearance[type].borderColor,
                backgroundImage: `url("${getNodeTypeIcon(type)}")`,
              }}
              aria-hidden="true"
            />
            {nodeTypeLabels[type]}s
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend>Relationship types</legend>
        {edgeTypes.map((type) => (
          <label key={type} className="filter-checkbox">
            <input
              type="checkbox"
              checked={!filters.hiddenEdgeTypes.has(type)}
              onChange={() => toggleEdgeType(type)}
            />
            <i
              className="filter-edge-swatch"
              style={{ borderTopColor: getEdgeTypeColor(type) }}
              aria-hidden="true"
            />
            {edgeTypeLabels[type]}
          </label>
        ))}
      </fieldset>

      <label className="filter-checkbox">
        <input type="checkbox" checked={filters.hideInherited} onChange={toggleHideInherited} />
        Hide inherited (transitive) relationships
      </label>

      <div className="filter-key-lines">
        <span>
          <i className="legend-line legend-line-direct" aria-hidden="true" />
          Direct relationship
        </span>
        <span>
          <i className="legend-line legend-line-inherited" aria-hidden="true" />
          Inherited through a group
        </span>
      </div>

      <button type="button" onClick={resetFilters} disabled={!active}>
        Reset filters
      </button>
    </section>
  );
}
