export interface GraphOrganization {
  id: string;
  displayName?: string | null;
  verifiedDomains?: Array<{
    name?: string | null;
    isDefault?: boolean;
  }>;
}
