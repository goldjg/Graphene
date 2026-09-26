import type { GraphApplication } from '../dto/application.ts';
import type { GraphDirectoryRole } from '../dto/directoryRole.ts';
import {
  isGraphAdministrativeUnit,
  isGraphApplication,
  isGraphDirectoryRole,
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
    return {
      id: directoryObject.id,
      type: 'administrativeUnit',
      label: directoryObject.displayName ?? directoryObject.id,
      ...(directoryObject.description ? { subtitle: directoryObject.description } : {}),
      metadata: { visibility: directoryObject.visibility },
    };
  }

  return null;
}
