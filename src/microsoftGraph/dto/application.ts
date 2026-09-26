export interface GraphApplication {
  id: string;
  appId?: string | null;
  displayName?: string | null;
  description?: string | null;
  signInAudience?: string | null;
  publisherDomain?: string | null;
  disabledByMicrosoftStatus?: string | null;
}
