import { GraphApiError } from './errors.ts';
import type { GraphDirectoryObject } from '../dto/directoryObject.ts';
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

interface GraphCollectionResponse<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

/** Upper bound on pages fetched per collection so a misbehaving tenant or
 * mock cannot cause an unbounded ingestion loop. */
const MAX_COLLECTION_PAGES = 50;

export class GraphClient {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly tokenProvider: () => Promise<string>;

  constructor({
    tokenProvider,
    baseUrl = 'https://graph.microsoft.com/v1.0',
    fetchImpl,
  }: GraphClientOptions) {
    this.tokenProvider = tokenProvider;
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.fetchImpl = fetchImpl ?? ((input, init) => globalThis.fetch(input, init));
  }

  async getCurrentUser(signal?: AbortSignal): Promise<GraphUser> {
    return this.request<GraphUser>('/me', signal ? { signal } : {});
  }

  /** Fetch a user's profile by object ID, or the signed-in user via `'me'`. */
  async getUser(userId: string, signal?: AbortSignal): Promise<GraphUser> {
    if (userId === 'me') {
      return this.getCurrentUser(signal);
    }

    return this.request<GraphUser>(
      `/users/${encodeURIComponent(userId)}`,
      signal ? { signal } : {},
    );
  }

  /** Direct group and directory role memberships for a user (or `me`). */
  async getMemberOf(userId: string, signal?: AbortSignal): Promise<GraphDirectoryObject[]> {
    return this.requestCollection<GraphDirectoryObject>(
      `${this.userPath(userId)}/memberOf`,
      signal,
    );
  }

  /** Direct and transitive (nested-group) memberships for a user (or `me`). */
  async getTransitiveMemberOf(
    userId: string,
    signal?: AbortSignal,
  ): Promise<GraphDirectoryObject[]> {
    return this.requestCollection<GraphDirectoryObject>(
      `${this.userPath(userId)}/transitiveMemberOf`,
      signal,
    );
  }

  /** Microsoft Graph only supports the `/me` alias at the root; any other
   * user must be addressed as `/users/{id}`. */
  private userPath(userId: string): string {
    return userId === 'me' ? '/me' : `/users/${encodeURIComponent(userId)}`;
  }

  /**
   * Follow `@odata.nextLink` until Microsoft Graph reports no further pages,
   * returning the combined collection. Bounded by `MAX_COLLECTION_PAGES` to
   * guarantee termination.
   */
  private async requestCollection<T>(path: string, signal?: AbortSignal): Promise<T[]> {
    const items: T[] = [];
    let nextPath: string | null = path;
    let pagesFetched = 0;

    while (nextPath && pagesFetched < MAX_COLLECTION_PAGES) {
      const isAbsolute = nextPath.startsWith('http://') || nextPath.startsWith('https://');
      const page: GraphCollectionResponse<T> = isAbsolute
        ? await this.requestAbsolute<GraphCollectionResponse<T>>(nextPath, signal ? { signal } : {})
        : await this.request<GraphCollectionResponse<T>>(nextPath, signal ? { signal } : {});

      items.push(...page.value);
      nextPath = page['@odata.nextLink'] ?? null;
      pagesFetched += 1;
    }

    return items;
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    return this.requestAbsolute<T>(`${this.baseUrl}${path}`, init);
  }

  private async requestAbsolute<T>(url: string, init: RequestInit = {}): Promise<T> {
    const token = await this.tokenProvider();
    const response = await this.fetchImpl(url, {
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
