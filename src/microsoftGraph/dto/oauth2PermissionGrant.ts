export interface GraphOAuth2PermissionGrant {
  id: string;
  clientId: string;
  consentType?: string | null;
  principalId?: string | null;
  resourceId: string;
  scope?: string | null;
}
