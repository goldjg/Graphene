import type { GraphNodeType } from '../model/types.ts';

/**
 * Original, minimal line-art glyphs used to visually distinguish each
 * GraphNodeType on the canvas.
 *
 * These are deliberately simple, independently authored icons rather than
 * reproductions of Microsoft's trademarked Entra/Fluent icon artwork. They
 * exist purely so node meaning is never encoded by colour alone.
 */
function toDataUri(svgBody: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${svgBody}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const icons: Record<GraphNodeType, string> = {
  // Single person silhouette.
  user: toDataUri(
    '<circle cx="12" cy="8" r="3.4" fill="#ffffff" stroke="none" />' +
      '<path d="M5 19.5c0-3.6 3.1-6.2 7-6.2s7 2.6 7 6.2" />',
  ),
  // Two overlapping person silhouettes.
  group: toDataUri(
    '<circle cx="9" cy="8" r="2.8" fill="#ffffff" stroke="none" />' +
      '<circle cx="16" cy="9.2" r="2.3" fill="#ffffff" stroke="none" opacity="0.75" />' +
      '<path d="M3.5 19.2c0-3.1 2.7-5.3 5.9-5.3 2.1 0 3.9 1 4.9 2.5" />' +
      '<path d="M13.6 19.2c0-2.1 1.8-3.9 4.4-3.9 2.3 0 4 1.6 4 3.9" opacity="0.75" />',
  ),
  // Shield outline (directory role authority).
  directoryRole: toDataUri(
    '<path d="M12 3.2 5.2 5.6v5.1c0 4.4 2.9 7.5 6.8 8.7 3.9-1.2 6.8-4.3 6.8-8.7V5.6Z" fill="none" />' +
      '<path d="M9.2 12.1l2 2 3.6-3.9" />',
  ),
  // Globe (tenant scope).
  tenantScope: toDataUri(
    '<circle cx="12" cy="12" r="8.4" fill="none" />' +
      '<ellipse cx="12" cy="12" rx="3.6" ry="8.4" fill="none" />' +
      '<path d="M3.6 12h16.8M4.6 7.6h14.8M4.6 16.4h14.8" />',
  ),
  // Simple building (administrative unit).
  administrativeUnit: toDataUri(
    '<rect x="5.2" y="4" width="13.6" height="16" rx="1" fill="none" />' +
      '<path d="M8.4 7.6h1.8M13.8 7.6h1.8M8.4 11.6h1.8M13.8 11.6h1.8M8.4 15.6h1.8M13.8 15.6h1.8" />' +
      '<path d="M10.6 20v-3.2h2.8V20" />',
  ),
  // Code brackets in a rounded tag (app registration = developer-owned definition).
  appRegistration: toDataUri(
    '<path d="M6 4.4H5.2A1.2 1.2 0 0 0 4 5.6v3.1c0 .9-.4 1.3-1 1.6.6.3 1 .7 1 1.6v3.1a1.2 1.2 0 0 0 1.2 1.2H6" />' +
      '<path d="M18 4.4h.8A1.2 1.2 0 0 1 20 5.6v3.1c0 .9.4 1.3 1 1.6-.6.3-1 .7-1 1.6v3.1a1.2 1.2 0 0 1-1.2 1.2H18" />' +
      '<path d="M10.4 8.8 8.2 12l2.2 3.2M13.6 8.8 15.8 12l-2.2 3.2" />',
  ),
  // Rounded window with a title bar (enterprise application = deployed instance).
  enterpriseApplication: toDataUri(
    '<rect x="3.6" y="5.2" width="16.8" height="13.6" rx="1.4" fill="none" />' +
      '<path d="M3.6 8.8h16.8" />' +
      '<circle cx="6" cy="7" r="0.5" fill="#ffffff" stroke="none" />' +
      '<circle cx="7.8" cy="7" r="0.5" fill="#ffffff" stroke="none" />',
  ),
  // Key (app role = a grantable permission credential).
  appRole: toDataUri(
    '<circle cx="8.2" cy="15.8" r="3.4" fill="none" />' +
      '<path d="M10.6 13.4 18 6M18 6l2 2M15.4 8.6l1.7 1.7" />',
  ),
  // Check inside a rounded outline (delegated permission = a granted consent).
  delegatedPermission: toDataUri(
    '<rect x="4.4" y="4.4" width="15.2" height="15.2" rx="4" fill="none" />' +
      '<path d="M8.4 12.4l2.4 2.4 5-5.2" />',
  ),
};

export function getNodeTypeIcon(type: GraphNodeType): string {
  return icons[type];
}
