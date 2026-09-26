export interface GraphAppRoleDefinition {
  id: string;
  value?: string | null;
  displayName?: string | null;
  description?: string | null;
  allowedMemberTypes?: string[];
  isEnabled?: boolean;
}

export interface GraphPermissionScopeDefinition {
  id: string;
  value?: string | null;
  adminConsentDisplayName?: string | null;
  adminConsentDescription?: string | null;
  userConsentDisplayName?: string | null;
  userConsentDescription?: string | null;
  isEnabled?: boolean;
}

export interface GraphServicePrincipal {
  id: string;
  appId?: string | null;
  displayName?: string | null;
  description?: string | null;
  servicePrincipalType?: string | null;
  accountEnabled?: boolean | null;
  appOwnerOrganizationId?: string | null;
  appRoles?: GraphAppRoleDefinition[];
  oauth2PermissionScopes?: GraphPermissionScopeDefinition[];
}
