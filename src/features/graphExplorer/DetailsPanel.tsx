import { useState } from 'react';

import type { GraphEdge, GraphNode, InvestigationGraph } from '../../graph/model/types.ts';
import type { GraphSelection } from '../../graph/cytoscape/GraphCanvas.tsx';

interface DetailsPanelProps {
  graph: InvestigationGraph;
  selection: GraphSelection | null;
  canExpand?: boolean;
  isExpanding?: boolean;
  expansionMessage?: string | null;
  onExpand?: () => void;
}

async function copyEvidence(
  value: GraphNode | GraphEdge,
  setMessage: (message: string) => void,
): Promise<void> {
  if (!navigator.clipboard) {
    setMessage('Clipboard access is unavailable in this browser.');
    return;
  }
  try {
    await navigator.clipboard.writeText(JSON.stringify(value, null, 2));
    setMessage('Evidence copied to the clipboard.');
  } catch {
    setMessage('The browser blocked clipboard access.');
  }
}

function getEntraPortalUrl(node: GraphNode): string | null {
  const id = encodeURIComponent(node.id);
  switch (node.type) {
    case 'user':
      return `https://entra.microsoft.com/#view/Microsoft_AAD_UsersAndTenants/UserProfileMenuBlade/~/overview/userId/${id}`;
    case 'group':
      return `https://entra.microsoft.com/#view/Microsoft_AAD_IAM/GroupDetailsMenuBlade/~/Overview/groupId/${id}`;
    case 'appRegistration':
      return `https://entra.microsoft.com/#view/Microsoft_AAD_RegisteredApps/ApplicationMenuBlade/~/Overview/appId/${id}`;
    case 'enterpriseApplication':
      return `https://entra.microsoft.com/#view/Microsoft_AAD_IAM/ManagedAppMenuBlade/~/Overview/objectId/${id}`;
    case 'device':
      return `https://entra.microsoft.com/#view/Microsoft_AAD_Devices/DeviceDetailsMenuBlade/~/Properties/objectId/${id}`;
    default:
      return null;
  }
}

/**
 * Shows the selected node or edge's normalized fields, with the raw
 * provenance/metadata payload collapsed by default (per the brief's detail
 * panel requirement: readable summary first, debug data on demand).
 */
export function DetailsPanel({
  graph,
  selection,
  canExpand = false,
  isExpanding = false,
  expansionMessage = null,
  onExpand,
}: DetailsPanelProps) {
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
    return (
      <NodeDetails
        node={node}
        canExpand={canExpand}
        isExpanding={isExpanding}
        expansionMessage={expansionMessage}
        onExpand={onExpand}
      />
    );
  }

  const edge = graph.edges.find((candidate) => candidate.id === selection.id);
  return <EdgeDetails edge={edge} />;
}

function NodeDetails({
  node,
  canExpand,
  isExpanding,
  expansionMessage,
  onExpand,
}: {
  node: GraphNode | undefined;
  canExpand: boolean;
  isExpanding: boolean;
  expansionMessage: string | null;
  onExpand: (() => void) | undefined;
}) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
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
      <MetadataDetails metadata={node.metadata} />
      <div className="button-row">
        <button type="button" onClick={() => void copyEvidence(node, setCopyMessage)}>
          Copy evidence
        </button>
        {getEntraPortalUrl(node) ? (
          <a href={getEntraPortalUrl(node) ?? undefined} target="_blank" rel="noopener noreferrer">
            Open in Entra
          </a>
        ) : null}
        {onExpand ? (
          <button type="button" disabled={!canExpand || isExpanding} onClick={onExpand}>
            {isExpanding ? 'Expanding...' : 'Expand selected object'}
          </button>
        ) : null}
      </div>
      {onExpand ? (
        <p className="analysis-message">
          Expansion loads one supported object and its bounded first-order relationships.
        </p>
      ) : null}
      {copyMessage ? <p className="analysis-message">{copyMessage}</p> : null}
      {expansionMessage ? <p className="analysis-message">{expansionMessage}</p> : null}
      <RawDataDisclosure data={node} />
    </aside>
  );
}

function EdgeDetails({ edge }: { edge: GraphEdge | undefined }) {
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
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
      <MetadataDetails metadata={edge.metadata} />
      <button type="button" onClick={() => void copyEvidence(edge, setCopyMessage)}>
        Copy evidence
      </button>
      {copyMessage ? <p className="analysis-message">{copyMessage}</p> : null}
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
  userPrincipalName: 'User principal name',
  mail: 'Mail',
  accountEnabled: 'Account enabled',
  userType: 'User type',
  groupTypes: 'Group types',
  mailEnabled: 'Mail enabled',
  securityEnabled: 'Security enabled',
  visibility: 'Visibility',
  isAssignableToRole: 'Role assignable',
  membershipRule: 'Membership rule',
  membershipRuleProcessingState: 'Membership rule processing',
  signInAudience: 'Sign-in audience',
  publisherDomain: 'Publisher domain',
  disabledByMicrosoftStatus: 'Disabled by Microsoft',
  servicePrincipalType: 'Service principal type',
  appOwnerOrganizationId: 'Publisher tenant ID',
  preferredSingleSignOnMode: 'Preferred single sign-on mode',
  tags: 'Tags',
  roleTemplateId: 'Role template ID',
  isMemberManagementRestricted: 'Restricted management',
  membershipType: 'Membership type',
  deviceId: 'Device ID',
  operatingSystem: 'Operating system',
  operatingSystemVersion: 'Operating system version',
  trustType: 'Join type',
  isCompliant: 'Compliant',
  isManaged: 'Managed',
  approximateLastSignInDateTime: 'Approximate last sign-in',
};

function MetadataDetails({ metadata }: { metadata: Record<string, unknown> }) {
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
