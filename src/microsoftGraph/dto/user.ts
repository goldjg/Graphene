export interface GraphUser {
  id: string;
  displayName?: string | null;
  userPrincipalName?: string | null;
  mail?: string | null;
  accountEnabled?: boolean | null;
  userType?: string | null;
}
