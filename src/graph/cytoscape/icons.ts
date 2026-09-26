import type { GraphNodeType } from '../model/types.ts';

/**
 * Bold, mostly-filled "badge" pictograms used to visually distinguish each
 * GraphNodeType when rendered on a uniform coloured tile (Fluent/Entra
 * portal-style icon badges), so meaning is never encoded by colour alone.
 *
 * These are deliberately simple, independently authored icons rather than
 * reproductions of Microsoft's trademarked Entra/Fluent icon artwork.
 */
function toDataUri(svgBody: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${svgBody}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const icons: Record<GraphNodeType, string> = {
  // Filled person badge.
  user: toDataUri(
    '<circle cx="12" cy="8.4" r="3.8" fill="#ffffff" stroke="none" />' +
      '<path d="M4.4 20c0-4.1 3.4-7 7.6-7s7.6 2.9 7.6 7" fill="#ffffff" stroke="none" />',
  ),
  // Two filled, overlapping person badges.
  group: toDataUri(
    '<circle cx="8.6" cy="8.2" r="3.1" fill="#ffffff" stroke="none" />' +
      '<circle cx="16.2" cy="9.4" r="2.6" fill="#ffffff" stroke="none" opacity="0.8" />' +
      '<path d="M2.6 19.8c0-3.5 2.9-6 6.6-6 2.6 0 4.8 1.3 6 3.2" fill="#ffffff" stroke="none" />' +
      '<path d="M13.6 19.8c0-2.4 2.1-4.4 5.1-4.4 2.6 0 4.7 1.8 4.7 4.4" fill="#ffffff" stroke="none" opacity="0.8" />',
  ),
  // Filled shield with a cut-out checkmark (directory role authority).
  directoryRole: toDataUri(
    '<path d="M12 2.8 4.6 5.4v5.4c0 4.9 3.1 8.2 7.4 9.4 4.3-1.2 7.4-4.5 7.4-9.4V5.4Z" fill="#ffffff" stroke="none" />' +
      '<path d="M9 12.2l2.1 2.1 3.9-4.2" stroke="#0b1220" stroke-width="2.2" />',
  ),
  // Filled globe with cut-out meridian/parallel lines (tenant scope).
  tenantScope: toDataUri(
    '<circle cx="12" cy="12" r="9" fill="#ffffff" stroke="none" />' +
      '<ellipse cx="12" cy="12" rx="3.6" ry="9" stroke="#0b1220" stroke-width="1.8" />' +
      '<path d="M3 12h18M3.9 7.2h16.2M3.9 16.8h16.2" stroke="#0b1220" stroke-width="1.8" />',
  ),
  // Filled building silhouette with cut-out windows (administrative unit).
  administrativeUnit: toDataUri(
    '<rect x="4.6" y="3.4" width="14.8" height="17.2" rx="1.2" fill="#ffffff" stroke="none" />' +
      '<path d="M7.8 6.6h1.8M14.4 6.6h1.8M7.8 10.6h1.8M14.4 10.6h1.8M7.8 14.6h1.8M14.4 14.6h1.8" stroke="#0b1220" stroke-width="1.8" />' +
      '<rect x="9.8" y="17" width="4.4" height="3.6" fill="#0b1220" stroke="none" />',
  ),
  // Filled rounded tag with cut-out code brackets (app registration = developer-owned definition).
  appRegistration: toDataUri(
    '<path d="M4.6 4.4a2 2 0 0 1 2-2h10.8a2 2 0 0 1 2 2v15.2a2 2 0 0 1-2 2H6.6a2 2 0 0 1-2-2Z" fill="#ffffff" stroke="none" />' +
      '<path d="M10.2 8.6 7.6 12l2.6 3.4M13.8 8.6 16.4 12l-2.6 3.4" stroke="#0b1220" stroke-width="2.1" />',
  ),
  // Filled window with a title bar (enterprise application = deployed instance).
  enterpriseApplication: toDataUri(
    '<rect x="3.2" y="4.6" width="17.6" height="14.8" rx="1.6" fill="#ffffff" stroke="none" />' +
      '<rect x="3.2" y="4.6" width="17.6" height="4" rx="1.6" fill="#0b1220" stroke="none" />' +
      '<circle cx="5.6" cy="6.6" r="0.55" fill="#ffffff" stroke="none" />' +
      '<circle cx="7.4" cy="6.6" r="0.55" fill="#ffffff" stroke="none" />',
  ),
  // Filled key badge (app role = a grantable permission credential).
  appRole: toDataUri(
    '<circle cx="7.8" cy="16.2" r="4" fill="#ffffff" stroke="none" />' +
      '<circle cx="7.8" cy="16.2" r="1.5" fill="#0b1220" stroke="none" />' +
      '<path d="M10.6 13.4 18.4 5.6M18.4 5.6l2.2 2.2M15.6 8.4l1.9 1.9" stroke="#ffffff" stroke-width="2.2" />',
  ),
  // Filled rounded outline with a cut-out check (delegated permission = a granted consent).
  delegatedPermission: toDataUri(
    '<rect x="3.4" y="3.4" width="17.2" height="17.2" rx="4.4" fill="#ffffff" stroke="none" />' +
      '<path d="M7.8 12.4l2.8 2.8 5.6-6" stroke="#0b1220" stroke-width="2.3" />',
  ),
};

export function getNodeTypeIcon(type: GraphNodeType): string {
  return icons[type];
}
