import { GraphApiError } from './errors.ts';
import type { GraphApplication } from '../dto/application.ts';
import type { GraphAppRoleAssignment } from '../dto/appRoleAssignment.ts';
import type { GraphDirectoryRole } from '../dto/directoryRole.ts';
import type { GraphDirectoryObject } from '../dto/directoryObject.ts';
import type { GraphGroup } from '../dto/group.ts';
import type { GraphOAuth2PermissionGrant } from '../dto/oauth2PermissionGrant.ts';
import type { GraphOrganization } from '../dto/organization.ts';
import type { GraphServicePrincipal } from '../dto/servicePrincipal.ts';
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

  async getOwnedObjects(userId: string, signal?: AbortSignal): Promise<GraphDirectoryObject[]> {
    return this.requestCollection<GraphDirectoryObject>(
      `${this.userPath(userId)}/ownedObjects`,
      signal,
    );
  }

  async getUserAppRoleAssignments(
    userId: string,
    signal?: AbortSignal,
  ): Promise<GraphAppRoleAssignment[]> {
    return this.requestCollection<GraphAppRoleAssignment>(
      `${this.userPath(userId)}/appRoleAssignments?$count=true`,
      signal,
      { ConsistencyLevel: 'eventual' },
    );
  }

  async getGroup(groupId: string, signal?: AbortSignal): Promise<GraphGroup> {
    return this.request<GraphGroup>(
      `/groups/${encodeURIComponent(groupId)}`,
      signal ? { signal } : {},
    );
  }

  async getGroupMembers(groupId: string, signal?: AbortSignal): Promise<GraphDirectoryObject[]> {
    return this.requestCollection<GraphDirectoryObject>(
      `/groups/${encodeURIComponent(groupId)}/members`,
      signal,
    );
  }

  async getGroupTransitiveMembers(
    groupId: string,
    signal?: AbortSignal,
  ): Promise<GraphDirectoryObject[]> {
    return this.requestCollection<GraphDirectoryObject>(
      `/groups/${encodeURIComponent(groupId)}/transitiveMembers`,
      signal,
    );
  }

  async getGroupMemberOf(groupId: string, signal?: AbortSignal): Promise<GraphDirectoryObject[]> {
    return this.requestCollection<GraphDirectoryObject>(
      `/groups/${encodeURIComponent(groupId)}/memberOf`,
      signal,
    );
  }

  async getGroupTransitiveMemberOf(
    groupId: string,
    signal?: AbortSignal,
  ): Promise<GraphDirectoryObject[]> {
    return this.requestCollection<GraphDirectoryObject>(
      `/groups/${encodeURIComponent(groupId)}/transitiveMemberOf`,
      signal,
    );
  }

  async getGroupOwners(groupId: string, signal?: AbortSignal): Promise<GraphDirectoryObject[]> {
    return this.requestCollection<GraphDirectoryObject>(
      `/groups/${encodeURIComponent(groupId)}/owners`,
      signal,
    );
  }

  async getGroupAppRoleAssignments(
    groupId: string,
    signal?: AbortSignal,
  ): Promise<GraphAppRoleAssignment[]> {
    return this.requestCollection<GraphAppRoleAssignment>(
      `/groups/${encodeURIComponent(groupId)}/appRoleAssignments`,
      signal,
    );
  }

  async getApplication(identifier: string, signal?: AbortSignal): Promise<GraphApplication> {
    return this.requestByObjectOrAlternateKey<GraphApplication>(
      'applications',
      'appId',
      identifier,
      signal,
    );
  }

  async getApplicationByAppId(
    appId: string,
    signal?: AbortSignal,
  ): Promise<GraphApplication | null> {
    return this.requestOptional<GraphApplication>(
      `/applications(appId='${escapeODataString(appId)}')`,
      signal,
    );
  }

  async getApplicationOwners(
    applicationId: string,
    signal?: AbortSignal,
  ): Promise<GraphDirectoryObject[]> {
    return this.requestCollection<GraphDirectoryObject>(
      `/applications/${encodeURIComponent(applicationId)}/owners`,
      signal,
    );
  }

  async getServicePrincipal(
    identifier: string,
    signal?: AbortSignal,
  ): Promise<GraphServicePrincipal> {
    return this.requestByObjectOrAlternateKey<GraphServicePrincipal>(
      'servicePrincipals',
      'appId',
      identifier,
      signal,
      servicePrincipalSelect,
    );
  }

  async getServicePrincipalByAppId(
    appId: string,
    signal?: AbortSignal,
  ): Promise<GraphServicePrincipal | null> {
    return this.requestOptional<GraphServicePrincipal>(
      `/servicePrincipals(appId='${escapeODataString(appId)}')${servicePrincipalSelect}`,
      signal,
    );
  }

  async getServicePrincipalOwners(
    servicePrincipalId: string,
    signal?: AbortSignal,
  ): Promise<GraphDirectoryObject[]> {
    return this.requestCollection<GraphDirectoryObject>(
      `/servicePrincipals/${encodeURIComponent(servicePrincipalId)}/owners`,
      signal,
    );
  }

  async getServicePrincipalAppRoleAssignments(
    servicePrincipalId: string,
    signal?: AbortSignal,
  ): Promise<GraphAppRoleAssignment[]> {
    return this.requestCollection<GraphAppRoleAssignment>(
      `/servicePrincipals/${encodeURIComponent(servicePrincipalId)}/appRoleAssignments`,
      signal,
    );
  }

  async getServicePrincipalAppRoleAssignedTo(
    servicePrincipalId: string,
    signal?: AbortSignal,
  ): Promise<GraphAppRoleAssignment[]> {
    return this.requestCollection<GraphAppRoleAssignment>(
      `/servicePrincipals/${encodeURIComponent(servicePrincipalId)}/appRoleAssignedTo`,
      signal,
    );
  }

  async getDirectoryRole(identifier: string, signal?: AbortSignal): Promise<GraphDirectoryRole> {
    return this.requestByObjectOrAlternateKey<GraphDirectoryRole>(
      'directoryRoles',
      'roleTemplateId',
      identifier,
      signal,
    );
  }

  async getDirectoryRoleMembers(
    roleId: string,
    signal?: AbortSignal,
  ): Promise<GraphDirectoryObject[]> {
    return this.requestCollection<GraphDirectoryObject>(
      `/directoryRoles/${encodeURIComponent(roleId)}/members`,
      signal,
    );
  }

  async getDirectoryObject(objectId: string, signal?: AbortSignal): Promise<GraphDirectoryObject> {
    return this.request<GraphDirectoryObject>(
      `/directoryObjects/${encodeURIComponent(objectId)}`,
      signal ? { signal } : {},
    );
  }

  async getOAuth2PermissionGrantsByClient(
    clientId: string,
    signal?: AbortSignal,
  ): Promise<GraphOAuth2PermissionGrant[]> {
    return this.getOAuth2PermissionGrants('clientId', clientId, signal);
  }

  async getOAuth2PermissionGrantsByPrincipal(
    principalId: string,
    signal?: AbortSignal,
  ): Promise<GraphOAuth2PermissionGrant[]> {
    return this.getOAuth2PermissionGrants('principalId', principalId, signal);
  }

  async getOrganization(signal?: AbortSignal): Promise<GraphOrganization> {
    const organizations = await this.requestCollection<GraphOrganization>('/organization', signal);
    const organization = organizations[0];

    if (!organization) {
      throw new Error('Microsoft Graph returned no organization for the signed-in tenant.');
    }

    return organization;
  }

  /** Microsoft Graph only supports the `/me` alias at the root; any other
   * user must be addressed as `/users/{id}`. */
  private userPath(userId: string): string {
    return userId === 'me' ? '/me' : `/users/${encodeURIComponent(userId)}`;
  }

  private getOAuth2PermissionGrants(
    filterProperty: 'clientId' | 'principalId',
    objectId: string,
    signal?: AbortSignal,
  ): Promise<GraphOAuth2PermissionGrant[]> {
    const params = new URLSearchParams({
      $filter: `${filterProperty} eq '${escapeODataString(objectId)}'`,
    });
    return this.requestCollection<GraphOAuth2PermissionGrant>(
      `/oauth2PermissionGrants?${params.toString()}`,
      signal,
    );
  }

  private async requestByObjectOrAlternateKey<T>(
    collection: string,
    alternateKey: string,
    identifier: string,
    signal?: AbortSignal,
    query = '',
  ): Promise<T> {
    try {
      return await this.request<T>(
        `/${collection}/${encodeURIComponent(identifier)}${query}`,
        signal ? { signal } : {},
      );
    } catch (error) {
      if (!(error instanceof GraphApiError) || error.status !== 404) {
        throw error;
      }
    }

    return this.request<T>(
      `/${collection}(${alternateKey}='${escapeODataString(identifier)}')${query}`,
      signal ? { signal } : {},
    );
  }

  private async requestOptional<T>(path: string, signal?: AbortSignal): Promise<T | null> {
    try {
      return await this.request<T>(path, signal ? { signal } : {});
    } catch (error) {
      if (error instanceof GraphApiError && error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Follow `@odata.nextLink` until Microsoft Graph reports no further pages,
   * returning the combined collection. Bounded by `MAX_COLLECTION_PAGES` to
   * guarantee termination.
   */
  private async requestCollection<T>(
    path: string,
    signal?: AbortSignal,
    headers?: HeadersInit,
  ): Promise<T[]> {
    const items: T[] = [];
    let nextPath: string | null = path;
    let pagesFetched = 0;

    while (nextPath && pagesFetched < MAX_COLLECTION_PAGES) {
      const isAbsolute = nextPath.startsWith('http://') || nextPath.startsWith('https://');
      const init: RequestInit = {
        ...(signal ? { signal } : {}),
        ...(headers ? { headers } : {}),
      };
      const page: GraphCollectionResponse<T> = isAbsolute
        ? await this.requestAbsolute<GraphCollectionResponse<T>>(nextPath, init)
        : await this.request<GraphCollectionResponse<T>>(nextPath, init);

      items.push(...page.value);
      nextPath = page['@odata.nextLink'] ?? null;
      pagesFetched += 1;
    }

    if (nextPath) {
      throw new Error(
        `Microsoft Graph collection exceeded the safe ${MAX_COLLECTION_PAGES}-page limit.`,
      );
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

function escapeODataString(value: string): string {
  return value.replaceAll("'", "''");
}

const servicePrincipalSelect =
  '?$select=id,appId,displayName,description,servicePrincipalType,accountEnabled,' +
  'appOwnerOrganizationId,appRoles,oauth2PermissionScopes';

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
