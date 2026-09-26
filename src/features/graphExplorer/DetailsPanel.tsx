import { useState } from 'react';

import type { GraphEdge, GraphNode, InvestigationGraph } from '../../graph/model/types.ts';
import type { GraphSelection } from '../../graph/cytoscape/GraphCanvas.tsx';

interface DetailsPanelProps {
  graph: InvestigationGraph;
  selection: GraphSelection | null;
}

/**
 * Shows the selected node or edge's normalized fields, with the raw
 * provenance/metadata payload collapsed by default (per the brief's detail
 * panel requirement: readable summary first, debug data on demand).
 */
export function DetailsPanel({ graph, selection }: DetailsPanelProps) {
  if (!selection) {
    return (
      <aside className="details-panel" aria-label="Selection details">
        <p className="setup-ready" role="status">
          Select a node or edge to see its details.
        </p>
      </aside>
    );
  }

  if (selection.kind === 'node') {
    const node = graph.nodes.find((candidate) => candidate.id === selection.id);
    return <NodeDetails node={node} />;
  }

  const edge = graph.edges.find((candidate) => candidate.id === selection.id);
  return <EdgeDetails edge={edge} />;
}

function NodeDetails({ node }: { node: GraphNode | undefined }) {
  if (!node) {
    return (
      <aside className="details-panel" aria-label="Selection details">
        <p className="setup-warning" role="alert">
          Selected node is no longer present in the graph.
        </p>
      </aside>
    );
  }

  return (
    <aside className="details-panel" aria-labelledby="details-heading">
      <h3 id="details-heading">{node.label}</h3>
      <dl>
        <div>
          <dt>Type</dt>
          <dd>{node.type}</dd>
        </div>
        {node.subtitle ? (
          <div>
            <dt>Subtitle</dt>
            <dd>{node.subtitle}</dd>
          </div>
        ) : null}
        <div>
          <dt>Object ID</dt>
          <dd>{node.id}</dd>
        </div>
        {node.sourceId ? (
          <div>
            <dt>Source object ID</dt>
            <dd>{node.sourceId}</dd>
          </div>
        ) : null}
      </dl>
      <MetadataDetails type={node.type} metadata={node.metadata} />
      <RawDataDisclosure data={node} />
    </aside>
  );
}

function EdgeDetails({ edge }: { edge: GraphEdge | undefined }) {
  if (!edge) {
    return (
      <aside className="details-panel" aria-label="Selection details">
        <p className="setup-warning" role="alert">
          Selected edge is no longer present in the graph.
        </p>
      </aside>
    );
  }

  return (
    <aside className="details-panel" aria-labelledby="details-heading">
      <h3 id="details-heading">{edge.type}</h3>
      <dl>
        <div>
          <dt>Direction</dt>
          <dd>{edge.inherited ? 'Inherited' : 'Direct'}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{edge.source}</dd>
        </div>
        <div>
          <dt>Target</dt>
          <dd>{edge.target}</dd>
        </div>
        <div>
          <dt>Microsoft Graph endpoint</dt>
          <dd>{edge.provenance.graphEndpoint}</dd>
        </div>
        <div>
          <dt>Queried object ID</dt>
          <dd>{edge.provenance.sourceObjectId}</dd>
        </div>
        {edge.provenance.assignmentId ? (
          <div>
            <dt>Assignment ID</dt>
            <dd>{edge.provenance.assignmentId}</dd>
          </div>
        ) : null}
      </dl>
      <MetadataDetails type={edge.type} metadata={edge.metadata} />
      <RawDataDisclosure data={edge} />
    </aside>
  );
}

const metadataLabels: Record<string, string> = {
  appRoleId: 'App role ID',
  value: 'Permission value',
  displayName: 'Display name',
  description: 'Description',
  allowedMemberTypes: 'Allowed member types',
  resourceId: 'Resource service principal ID',
  resourceDisplayName: 'Resource',
  permissionGrantId: 'Permission grant ID',
  permissionId: 'Permission ID',
  clientId: 'Client service principal ID',
  consentType: 'Consent type',
  principalId: 'Principal ID',
  scope: 'Scope',
  adminConsentDescription: 'Admin consent description',
  userConsentDescription: 'User consent description',
};

function MetadataDetails({
  type,
  metadata,
}: {
  type: GraphNode['type'] | GraphEdge['type'];
  metadata: Record<string, unknown>;
}) {
  if (
    type !== 'appRole' &&
    type !== 'delegatedPermission' &&
    type !== 'appRoleAssignment' &&
    type !== 'delegatedPermissionGrant'
  ) {
    return null;
  }

  const entries = Object.entries(metadata).filter(
    ([key, value]) => metadataLabels[key] && value !== null && value !== undefined && value !== '',
  );
  if (entries.length === 0) {
    return null;
  }

  return (
    <dl>
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt>{metadataLabels[key]}</dt>
          <dd>{formatMetadataValue(value)}</dd>
        </div>
      ))}
    </dl>
  );
}

function formatMetadataValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  return String(value);
}

function RawDataDisclosure({ data }: { data: unknown }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="raw-data-disclosure">
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {open ? 'Hide raw data' : 'Show raw data'}
      </button>
      {open ? <pre>{JSON.stringify(data, null, 2)}</pre> : null}
    </div>
  );
}
