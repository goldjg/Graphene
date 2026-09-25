export type InvestigationMode = 'me' | 'search';

export interface InvestigationQueryState {
  mode: InvestigationMode;
  /** Object ID or user principal name; only meaningful when `mode` is `'search'`. */
  targetId: string;
  includeInherited: boolean;
}

export const defaultQueryState: InvestigationQueryState = {
  mode: 'me',
  targetId: '',
  includeInherited: true,
};

/**
 * Encode investigation query state into URL search params so an
 * investigation can be reshared or bookmarked. Access tokens, identities
 * returned by Microsoft Graph beyond the queried target ID, and any other
 * secret material must never be encoded here.
 */
export function encodeQueryState(state: InvestigationQueryState): URLSearchParams {
  const params = new URLSearchParams();
  params.set('mode', state.mode);

  if (state.mode === 'search' && state.targetId) {
    params.set('target', state.targetId);
  }

  params.set('inherited', state.includeInherited ? '1' : '0');
  return params;
}

/** Decode URL search params back into investigation query state, falling
 * back to defaults for missing or malformed values. */
export function decodeQueryState(params: URLSearchParams): InvestigationQueryState {
  const mode: InvestigationMode = params.get('mode') === 'search' ? 'search' : 'me';
  const targetId = mode === 'search' ? (params.get('target') ?? '') : '';
  const includeInherited = params.get('inherited') !== '0';

  return { mode, targetId, includeInherited };
}
