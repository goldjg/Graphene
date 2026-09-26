export interface GraphAdministrativeUnit {
  id: string;
  displayName?: string | null;
  description?: string | null;
  visibility?: string | null;
  isMemberManagementRestricted?: boolean | null;
  membershipRule?: string | null;
  membershipType?: string | null;
  membershipRuleProcessingState?: string | null;
}
