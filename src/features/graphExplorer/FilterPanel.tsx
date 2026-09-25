import type { GraphEdgeType, GraphNodeType, InvestigationGraph } from '../../graph/model/types.ts';
import {
  applyGraphFilters,
  distinctEdgeTypes,
  distinctNodeTypes,
  isFilterActive,
  type GraphFilterState,
} from '../../graph/filters/graphFilters.ts';

const nodeTypeLabels: Record<GraphNodeType, string> = {
  user: 'Users',
  group: 'Groups',
  directoryRole: 'Directory roles',
  tenantScope: 'Tenant scopes',
  administrativeUnit: 'Administrative units',
  appRegistration: 'App registrations',
  enterpriseApplication: 'Enterprise applications',
  appRole: 'App roles',
  delegatedPermission: 'Delegated permissions',
};

const edgeTypeLabels: Record<GraphEdgeType, string> = {
  memberOf: 'Member of',
  transitiveMemberOf: 'Transitive member of',
  assignedRole: 'Assigned role',
  owns: 'Owns',
  scopedTo: 'Scoped to',
  appRoleAssignment: 'App role assignment',
  delegatedPermissionGrant: 'Delegated permission grant',
  accesses: 'Accesses',
  assignedTo: 'Assigned to',
};

interface FilterPanelProps {
  graph: InvestigationGraph;
  filters: GraphFilterState;
  onChange: (filters: GraphFilterState) => void;
}

/**
 * Non-destructive, display-time filtering controls over an already-loaded
 * graph. Every toggle here only changes what is rendered; it never triggers
 * a new Microsoft Graph query and never mutates the loaded graph data.
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
      <h3 id="filter-panel-heading">Filters</h3>
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
            {nodeTypeLabels[type]}
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
            {edgeTypeLabels[type]}
          </label>
        ))}
      </fieldset>

      <label className="filter-checkbox">
        <input type="checkbox" checked={filters.hideInherited} onChange={toggleHideInherited} />
        Hide inherited (transitive) relationships
      </label>

      <button type="button" onClick={resetFilters} disabled={!active}>
        Reset filters
      </button>
    </section>
  );
}
