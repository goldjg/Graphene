import { GraphApiError } from './errors.ts';
import type { GraphUser } from '../dto/user.ts';

interface GraphClientOptions {
  tokenProvider: () => Promise<string>;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

interface GraphErrorBody {
  error?: {
    code?: string;
    message?: string;
  };
}

export class GraphClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly tokenProvider: () => Promise<string>;

  constructor({ tokenProvider, baseUrl = 'https://graph.microsoft.com/v1.0', fetchImpl }: GraphClientOptions) {
    this.tokenProvider = tokenProvider;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetchImpl = fetchImpl ?? fetch;
  }

  async getCurrentUser(signal?: AbortSignal): Promise<GraphUser> {
    return this.request<GraphUser>('/me', signal ? { signal } : {});
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const token = await this.tokenProvider();
    const response = await this.fetchImpl(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
        ...init.headers,
      },
    });

    if (!response.ok) {
      throw await toGraphApiError(response);
    }

    return (await response.json()) as T;
  }
}

async function toGraphApiError(response: Response): Promise<GraphApiError> {
  const body = await readGraphErrorBody(response);
  const retryAfterSeconds = readRetryAfterSeconds(response.headers);

  return new GraphApiError(
    response.status,
    body.error?.code,
    body.error?.message ?? `Microsoft Graph returned HTTP ${response.status}.`,
    retryAfterSeconds,
  );
}

async function readGraphErrorBody(response: Response): Promise<GraphErrorBody> {
  try {
    return (await response.json()) as GraphErrorBody;
  } catch {
    return {};
  }
}

function readRetryAfterSeconds(headers: Headers): number | undefined {
  const retryAfter = headers.get('Retry-After');

  if (!retryAfter) {
    return undefined;
  }

  const seconds = Number.parseInt(retryAfter, 10);
  return Number.isFinite(seconds) ? seconds : undefined;
}
