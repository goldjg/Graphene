import { useEffect, useId, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';

import { useAuth } from '../../auth/useAuth.ts';
import { mapGraphError } from '../../microsoftGraph/client/errors.ts';
import { buildInvestigationGraph } from '../../microsoftGraph/ingestion/buildInvestigationGraph.ts';
import {
  validateInvestigationTarget,
  type InvestigationTargetSuggestion,
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
type SuggestionStatus = 'idle' | 'loading' | 'error';

const TYPEAHEAD_DEBOUNCE_MS = 250;

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
  const [suggestions, setSuggestions] = useState<InvestigationTargetSuggestion[]>([]);
  const [suggestionStatus, setSuggestionStatus] = useState<SuggestionStatus>('idle');
  const [suggestionError, setSuggestionError] = useState<string | null>(null);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
  const searchSequenceRef = useRef(0);
  const suppressSearchValueRef = useRef<string | null>(null);
  const suggestionListId = useId();

  useEffect(() => {
    if (typeof window === 'undefined' || authStatus === 'initializing') {
      return;
    }

    const params = encodeQueryState(queryState);
    const url = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', url);
  }, [authStatus, queryState]);

  useEffect(() => {
    if (queryState.mode !== 'search' || authStatus !== 'authenticated') {
      setSuggestions([]);
      setSuggestionStatus('idle');
      setSuggestionError(null);
      setActiveSuggestionIndex(-1);
      return;
    }

    const trimmed = queryState.targetId.trim();
    if (suppressSearchValueRef.current === trimmed) {
      suppressSearchValueRef.current = null;
      setSuggestions([]);
      setSuggestionStatus('idle');
      setSuggestionError(null);
      setActiveSuggestionIndex(-1);
      return;
    }

    if (trimmed.length < 2) {
      setSuggestions([]);
      setSuggestionStatus('idle');
      setSuggestionError(null);
      setActiveSuggestionIndex(-1);
      return;
    }

    const controller = new AbortController();
    const sequence = ++searchSequenceRef.current;
    setSuggestions([]);
    setSuggestionStatus('idle');
    setSuggestionError(null);
    setActiveSuggestionIndex(-1);

    const debounce = window.setTimeout(() => {
      void (async () => {
        setSuggestionStatus('loading');
        try {
          const graphClient = getGraphClient();
          if (!graphClient) {
            setSuggestionStatus('error');
            setSuggestionError('Sign in to search Microsoft Entra objects.');
            return;
          }

          const nextSuggestions = await graphClient.searchObjects(
            queryState.targetType,
            trimmed,
            controller.signal,
          );
          if (controller.signal.aborted || sequence !== searchSequenceRef.current) {
            return;
          }

          setSuggestions(nextSuggestions);
          setSuggestionStatus('idle');
        } catch (error) {
          if (!controller.signal.aborted && sequence === searchSequenceRef.current) {
            setSuggestions([]);
            setSuggestionStatus('error');
            setSuggestionError(
              `${mapGraphError(error).message} You can still enter an exact identifier.`,
            );
          }
        }
      })();
    }, TYPEAHEAD_DEBOUNCE_MS);

    return () => {
      controller.abort();
      window.clearTimeout(debounce);
    };
  }, [authStatus, getGraphClient, queryState.mode, queryState.targetId, queryState.targetType]);

  const handleModeChange = (mode: InvestigationMode) => {
    setQueryState((current) => ({ ...current, mode }));
  };

  const selectSuggestion = (suggestion: InvestigationTargetSuggestion) => {
    suppressSearchValueRef.current = suggestion.id;
    setQueryState((current) => ({ ...current, targetId: suggestion.id }));
    setSuggestions([]);
    setSuggestionStatus('idle');
    setSuggestionError(null);
    setActiveSuggestionIndex(-1);
  };

  const handleSuggestionKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      setSuggestions([]);
      setSuggestionStatus('idle');
      setSuggestionError(null);
      setActiveSuggestionIndex(-1);
      return;
    }

    if (!suggestions.length) {
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveSuggestionIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
      return;
    }

    if (event.key === 'Enter' && activeSuggestionIndex >= 0) {
      event.preventDefault();
      const suggestion = suggestions[activeSuggestionIndex];
      if (suggestion) {
        selectSuggestion(suggestion);
      }
    }
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
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={suggestions.length > 0}
                aria-controls={suggestionListId}
                aria-activedescendant={
                  activeSuggestionIndex >= 0
                    ? `${suggestionListId}-${activeSuggestionIndex}`
                    : undefined
                }
                onKeyDown={handleSuggestionKeyDown}
              />
            </label>
            {suggestionStatus === 'loading' ? (
              <p className="object-suggestion-status" role="status">
                Searching Microsoft Entra...
              </p>
            ) : null}
            {suggestionError ? (
              <p className="object-suggestion-error" role="status">
                {suggestionError}
              </p>
            ) : null}
            {suggestions.length > 0 ? (
              <div className="object-suggestions" id={suggestionListId} role="listbox">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion.type}:${suggestion.id}`}
                    id={`${suggestionListId}-${index}`}
                    type="button"
                    className={`object-suggestion${
                      index === activeSuggestionIndex ? ' object-suggestion-active' : ''
                    }`}
                    role="option"
                    aria-selected={index === activeSuggestionIndex}
                    tabIndex={-1}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => selectSuggestion(suggestion)}
                  >
                    <span className="object-suggestion-copy">
                      <span className="object-suggestion-label">{suggestion.label}</span>
                      <span className="object-suggestion-detail">{suggestion.detail}</span>
                    </span>
                    <span className="object-suggestion-meta">
                      {targetTypeLabels[suggestion.type]}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
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
