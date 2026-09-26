export interface GraphGroup {
  id: string;
  displayName?: string | null;
  description?: string | null;
  groupTypes?: string[];
  mail?: string | null;
  mailEnabled?: boolean | null;
  securityEnabled?: boolean | null;
  visibility?: string | null;
}
