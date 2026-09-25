import type { UserFacingError } from '../../auth/errors.ts';

export class GraphApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string | undefined,
    message: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'GraphApiError';
  }
}

export function mapGraphError(error: unknown): UserFacingError {
  if (error instanceof GraphApiError) {
    if (error.status === 401) {
      return {
        title: 'Microsoft Graph session expired',
        message: 'Microsoft Graph rejected the access token for this request.',
        remediation: 'Sign in again so Graphene can request a fresh delegated token.',
      };
    }

    if (error.status === 403) {
      return {
        title: 'Microsoft Graph permission unavailable',
        message:
          'Microsoft Graph denied this request with the current delegated permission baseline.',
        remediation:
          'Confirm administrator consent for Directory.Read.All. Graphene will not silently request broader permissions.',
      };
    }

    if (error.status === 429) {
      return {
        title: 'Microsoft Graph throttled the request',
        message: error.retryAfterSeconds
          ? `Microsoft Graph asked Graphene to retry after ${error.retryAfterSeconds} seconds.`
          : 'Microsoft Graph throttled the request without a Retry-After value.',
        remediation: 'Wait briefly, then retry the identity refresh.',
      };
    }

    return {
      title: 'Microsoft Graph request failed',
      message: error.message,
      remediation: 'Check tenant permissions and network connectivity, then retry.',
    };
  }

  if (error instanceof TypeError) {
    return {
      title: 'Network error',
      message: 'Graphene could not reach Microsoft Graph.',
      remediation: 'Check network connectivity and retry.',
    };
  }

  if (error instanceof Error) {
    return {
      title: 'Request failed',
      message: error.message,
    };
  }

  return {
    title: 'Request failed',
    message: 'Graphene could not complete the Microsoft Graph request.',
  };
}
