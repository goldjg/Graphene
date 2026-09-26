import { useEffect, useState, type FormEvent } from 'react';

import { useAuth } from '../../auth/useAuth.ts';
import { mapGraphError } from '../../microsoftGraph/client/errors.ts';
import { buildInvestigationGraph } from '../../microsoftGraph/ingestion/buildInvestigationGraph.ts';
import {
  validateInvestigationTarget,
  type InvestigationTargetType,
} from '../../microsoftGraph/ingestion/target.ts';
import type { InvestigationGraph } from '../../graph/model/types.ts';
import {
  decodeQueryState,
  defaultQueryState,
  encodeQueryState,
  type InvestigationMode,
  type InvestigationQueryState,
} from './queryState.ts';

interface QueryPanelProps {
  onResult: (graph: InvestigationGraph) => void;
  onReset: () => void;
}

type QueryStatus = 'idle' | 'loading' | 'error';

const targetTypeLabels: Record<InvestigationTargetType, string> = {
  user: 'User',
  group: 'Group',
  application: 'App registration',
  servicePrincipal: 'Enterprise application',
  directoryRole: 'Directory role',
  administrativeUnit: 'Administrative unit',
  device: 'Device',
};

const targetPlaceholders: Record<InvestigationTargetType, string> = {
  user: 'user@tenant.example or object ID',
  group: 'Group object ID',
  application: 'Application object ID or application (client) ID',
  servicePrincipal: 'Service principal object ID or application (client) ID',
  directoryRole: 'Role object ID or role template ID',
  administrativeUnit: 'Administrative unit object ID',
  device: 'Device object ID or device ID',
};

/**
 * Investigation query panel: choose the current signed-in user or a
 * specific object ID/UPN, decide whether transitive (inherited) group and
 * role relationships should be included, and run the query against
 * Microsoft Graph. Query state (never tokens or Graph responses) is synced
 * to the URL so an investigation can be reshared.
 */
export function QueryPanel({ onResult, onReset }: QueryPanelProps) {
  const { getGraphClient, status: authStatus } = useAuth();
  const [queryState, setQueryState] = useState<InvestigationQueryState>(() =>
    typeof window === 'undefined'
      ? defaultQueryState
      : decodeQueryState(new URLSearchParams(window.location.search)),
  );
  const [status, setStatus] = useState<QueryStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || authStatus === 'initializing') {
      return;
    }

    const params = encodeQueryState(queryState);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', url);
  }, [authStatus, queryState]);

  const handleModeChange = (mode: InvestigationMode) => {
    setQueryState((current) => ({ ...current, mode }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (queryState.mode === 'search') {
      const validationError = validateInvestigationTarget({
        type: queryState.targetType,
        identifier: queryState.targetId,
      });
      if (validationError) {
        setErrorMessage(validationError);
        return;
      }
    }

    const graphClient = getGraphClient();

    if (!graphClient) {
      setErrorMessage('Sign in with Microsoft Entra before running an investigation.');
      return;
    }

    setStatus('loading');

    try {
      const graph = await buildInvestigationGraph(graphClient, {
        type: queryState.mode === 'me' ? 'user' : queryState.targetType,
        identifier: queryState.mode === 'me' ? 'me' : queryState.targetId.trim(),
      });
      const filtered = queryState.includeInherited
        ? graph
        : {
            nodes: graph.nodes,
            edges: graph.edges.filter((edge) => !edge.inherited),
          };

      onResult(filtered);
      setStatus('idle');
    } catch (error) {
      setStatus('error');
      setErrorMessage(mapGraphError(error).message);
    }
  };

  const handleReset = () => {
    setQueryState(defaultQueryState);
    setErrorMessage(null);
    setStatus('idle');
    onReset();
  };

  return (
    <form className="query-panel" onSubmit={(event) => void handleSubmit(event)}>
      <fieldset>
        <legend>Investigate</legend>

        <div className="query-mode">
          <label>
            <input
              type="radio"
              name="investigation-mode"
              value="me"
              checked={queryState.mode === 'me'}
              onChange={() => handleModeChange('me')}
            />
            Current signed-in user
          </label>
          <label>
            <input
              type="radio"
              name="investigation-mode"
              value="search"
              checked={queryState.mode === 'search'}
              onChange={() => handleModeChange('search')}
            />
            Search by object type and identifier
          </label>
        </div>

        {queryState.mode === 'search' ? (
          <>
            <label className="query-target">
              Object type
              <select
                value={queryState.targetType}
                onChange={(event) =>
                  setQueryState((current) => ({
                    ...current,
                    targetType: event.target.value as InvestigationTargetType,
                  }))
                }
              >
                {Object.entries(targetTypeLabels).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="query-target">
              Identifier
              <input
                type="text"
                value={queryState.targetId}
                placeholder={targetPlaceholders[queryState.targetType]}
                onChange={(event) =>
                  setQueryState((current) => ({ ...current, targetId: event.target.value }))
                }
              />
            </label>
          </>
        ) : null}

        <label className="query-toggle">
          <input
            type="checkbox"
            checked={queryState.includeInherited}
            onChange={(event) =>
              setQueryState((current) => ({ ...current, includeInherited: event.target.checked }))
            }
          />
          Include inherited (transitive) relationships
        </label>

        <div className="button-row">
          <button type="submit" disabled={status === 'loading' || authStatus !== 'authenticated'}>
            {status === 'loading' ? 'Running investigation...' : 'Run investigation'}
          </button>
          <button type="button" onClick={handleReset}>
            Reset
          </button>
        </div>

        {authStatus !== 'authenticated' ? (
          <p className="setup-warning" role="status">
            Sign in to run a live Microsoft Graph investigation.
          </p>
        ) : null}

        {errorMessage ? (
          <p className="setup-warning" role="alert">
            {errorMessage}
          </p>
        ) : null}
      </fieldset>
    </form>
  );
}
