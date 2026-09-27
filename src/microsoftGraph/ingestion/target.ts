export type InvestigationTargetType =
  | 'user'
  | 'group'
  | 'application'
  | 'servicePrincipal'
  | 'directoryRole'
  | 'administrativeUnit'
  | 'device';

export interface InvestigationTarget {
  type: InvestigationTargetType;
  identifier: string;
}

export interface InvestigationTargetSuggestion {
  id: string;
  label: string;
  detail: string;
  type: InvestigationTargetType;
}

const guidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function validateInvestigationTarget(target: InvestigationTarget): string | null {
  if (!target.identifier.trim()) {
    return 'Enter an identifier for the selected object type.';
  }

  if (target.type !== 'user' && !guidPattern.test(target.identifier.trim())) {
    return 'Enter a valid Microsoft Entra object ID, application ID, or role template ID.';
  }

  return null;
}
