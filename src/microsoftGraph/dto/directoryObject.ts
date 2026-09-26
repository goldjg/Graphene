/**
 * Common shape returned by `/memberOf` and `/transitiveMemberOf` collections.
 *
 * Microsoft Graph returns heterogeneous relationship collections
 * discriminated by `@odata.type`. The normalizer maps only explicitly
 * supported directory object types and skips unknown types rather than
 * guessing.
 */
export interface GraphDirectoryObject {
  id: string;
  displayName?: string | null;
  description?: string | null;
  userPrincipalName?: string | null;
  mail?: string | null;
  accountEnabled?: boolean | null;
  userType?: string | null;
  appId?: string | null;
  signInAudience?: string | null;
  servicePrincipalType?: string | null;
  roleTemplateId?: string | null;
  groupTypes?: string[];
  mailEnabled?: boolean | null;
  securityEnabled?: boolean | null;
  visibility?: string | null;
  isAssignableToRole?: boolean | null;
  membershipRule?: string | null;
  membershipRuleProcessingState?: string | null;
  isMemberManagementRestricted?: boolean | null;
  membershipType?: string | null;
  deviceId?: string | null;
  operatingSystem?: string | null;
  operatingSystemVersion?: string | null;
  trustType?: string | null;
  isCompliant?: boolean | null;
  isManaged?: boolean | null;
  approximateLastSignInDateTime?: string | null;
  '@odata.type'?: string;
}

export function isGraphUser(directoryObject: GraphDirectoryObject): boolean {
  return directoryObject['@odata.type'] === '#microsoft.graph.user';
}

export function isGraphGroup(directoryObject: GraphDirectoryObject): boolean {
  return directoryObject['@odata.type'] === '#microsoft.graph.group';
}

export function isGraphDirectoryRole(directoryObject: GraphDirectoryObject): boolean {
  return directoryObject['@odata.type'] === '#microsoft.graph.directoryRole';
}

export function isGraphServicePrincipal(directoryObject: GraphDirectoryObject): boolean {
  return directoryObject['@odata.type'] === '#microsoft.graph.servicePrincipal';
}

export function isGraphApplication(directoryObject: GraphDirectoryObject): boolean {
  return directoryObject['@odata.type'] === '#microsoft.graph.application';
}

export function isGraphAdministrativeUnit(directoryObject: GraphDirectoryObject): boolean {
  return directoryObject['@odata.type'] === '#microsoft.graph.administrativeUnit';
}

export function isGraphDevice(directoryObject: GraphDirectoryObject): boolean {
  return directoryObject['@odata.type'] === '#microsoft.graph.device';
}
