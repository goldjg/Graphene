import type { GraphApplication } from '../dto/application.ts';
import type { GraphAdministrativeUnit } from '../dto/administrativeUnit.ts';
import type { GraphDevice } from '../dto/device.ts';
import type { GraphDirectoryRole } from '../dto/directoryRole.ts';
import {
  isGraphAdministrativeUnit,
  isGraphApplication,
  isGraphDirectoryRole,
  isGraphDevice,
  isGraphGroup,
  isGraphServicePrincipal,
  isGraphUser,
  type GraphDirectoryObject,
} from '../dto/directoryObject.ts';
import type { GraphGroup } from '../dto/group.ts';
import type { GraphOrganization } from '../dto/organization.ts';
import type { GraphServicePrincipal } from '../dto/servicePrincipal.ts';
import type { GraphUser } from '../dto/user.ts';
import type { GraphNode } from '../../graph/model/types.ts';

export function toUserNode(user: GraphUser): GraphNode {
  return {
    id: user.id,
    type: 'user',
    label: user.displayName ?? user.userPrincipalName ?? user.id,
    ...(user.userPrincipalName ? { subtitle: user.userPrincipalName } : {}),
    metadata: {
      userPrincipalName: user.userPrincipalName,
      mail: user.mail,
      accountEnabled: user.accountEnabled,
      userType: user.userType,
    },
  };
}

export function toGroupNode(group: GraphGroup): GraphNode {
  return {
    id: group.id,
    type: 'group',
    label: group.displayName ?? group.id,
    ...(group.description ? { subtitle: group.description } : {}),
    metadata: {
      groupTypes: group.groupTypes,
      mail: group.mail,
      mailEnabled: group.mailEnabled,
      securityEnabled: group.securityEnabled,
      visibility: group.visibility,
      isAssignableToRole: group.isAssignableToRole,
      membershipRule: group.membershipRule,
      membershipRuleProcessingState: group.membershipRuleProcessingState,
    },
  };
}

export function toApplicationNode(application: GraphApplication): GraphNode {
  return {
    id: application.id,
    type: 'appRegistration',
    label: application.displayName ?? application.appId ?? application.id,
    subtitle: 'App registration',
    metadata: {
      appId: application.appId,
      description: application.description,
      signInAudience: application.signInAudience,
      publisherDomain: application.publisherDomain,
      disabledByMicrosoftStatus: application.disabledByMicrosoftStatus,
    },
  };
}

export function toServicePrincipalNode(servicePrincipal: GraphServicePrincipal): GraphNode {
  return {
    id: servicePrincipal.id,
    type: 'enterpriseApplication',
    label: servicePrincipal.displayName ?? servicePrincipal.appId ?? servicePrincipal.id,
    subtitle: 'Enterprise application / service principal',
    metadata: {
      appId: servicePrincipal.appId,
      description: servicePrincipal.description,
      servicePrincipalType: servicePrincipal.servicePrincipalType,
      accountEnabled: servicePrincipal.accountEnabled,
      appOwnerOrganizationId: servicePrincipal.appOwnerOrganizationId,
      preferredSingleSignOnMode: servicePrincipal.preferredSingleSignOnMode,
      tags: servicePrincipal.tags,
    },
  };
}

export function toDirectoryRoleNode(role: GraphDirectoryRole): GraphNode {
  return {
    id: role.id,
    type: 'directoryRole',
    label: role.displayName ?? role.id,
    ...(role.description ? { subtitle: role.description } : {}),
    metadata: { roleTemplateId: role.roleTemplateId },
  };
}

export function toTenantScopeNode(organization: GraphOrganization): GraphNode {
  const defaultDomain = organization.verifiedDomains?.find((domain) => domain.isDefault)?.name;

  return {
    id: organization.id,
    type: 'tenantScope',
    label: organization.displayName ?? defaultDomain ?? organization.id,
    subtitle: defaultDomain ?? 'Tenant scope',
    metadata: { verifiedDomains: organization.verifiedDomains },
  };
}

export function toAdministrativeUnitNode(unit: GraphAdministrativeUnit): GraphNode {
  return {
    id: unit.id,
    type: 'administrativeUnit',
    label: unit.displayName ?? unit.id,
    ...(unit.description ? { subtitle: unit.description } : {}),
    metadata: {
      visibility: unit.visibility,
      isMemberManagementRestricted: unit.isMemberManagementRestricted,
      membershipRule: unit.membershipRule,
      membershipType: unit.membershipType,
      membershipRuleProcessingState: unit.membershipRuleProcessingState,
    },
  };
}

export function toDeviceNode(device: GraphDevice): GraphNode {
  return {
    id: device.id,
    type: 'device',
    label: device.displayName ?? device.deviceId ?? device.id,
    ...(device.operatingSystem ? { subtitle: device.operatingSystem } : {}),
    metadata: {
      deviceId: device.deviceId,
      accountEnabled: device.accountEnabled,
      operatingSystem: device.operatingSystem,
      operatingSystemVersion: device.operatingSystemVersion,
      trustType: device.trustType,
      isCompliant: device.isCompliant,
      isManaged: device.isManaged,
      approximateLastSignInDateTime: device.approximateLastSignInDateTime,
    },
  };
}

export function toDirectoryObjectNode(directoryObject: GraphDirectoryObject): GraphNode | null {
  if (isGraphUser(directoryObject)) {
    return toUserNode(directoryObject);
  }

  if (isGraphGroup(directoryObject)) {
    return toGroupNode(directoryObject);
  }

  if (isGraphDirectoryRole(directoryObject)) {
    return toDirectoryRoleNode(directoryObject);
  }

  if (isGraphServicePrincipal(directoryObject)) {
    return toServicePrincipalNode(directoryObject);
  }

  if (isGraphApplication(directoryObject)) {
    return toApplicationNode(directoryObject);
  }

  if (isGraphAdministrativeUnit(directoryObject)) {
    return toAdministrativeUnitNode(directoryObject);
  }

  if (isGraphDevice(directoryObject)) {
    return toDeviceNode(directoryObject);
  }

  return null;
}
