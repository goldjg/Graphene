export interface GraphAppRoleAssignment {
  id: string;
  appRoleId?: string | null;
  principalDisplayName?: string | null;
  principalId: string;
  principalType?: string | null;
  resourceDisplayName?: string | null;
  resourceId: string;
}
