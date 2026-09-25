/**
 * Common shape returned by `/memberOf` and `/transitiveMemberOf` collections.
 *
 * Microsoft Graph returns a heterogeneous collection discriminated by
 * `@odata.type`. Only `#microsoft.graph.group` and
 * `#microsoft.graph.directoryRole` are modelled today because those are the
 * relationship kinds confirmed available under the `User.Read` plus
 * `Directory.Read.All` delegated permission baseline. Any other
 * `@odata.type` is treated as unsupported and skipped rather than guessed at
 * (see `.github/carl/memory.md` unresolved permission uncertainties).
 */
export interface GraphDirectoryObject {
  id: string;
  displayName?: string | null;
  description?: string | null;
  '@odata.type'?: string;
}

export function isGraphGroup(directoryObject: GraphDirectoryObject): boolean {
  return directoryObject['@odata.type'] === '#microsoft.graph.group';
}

export function isGraphDirectoryRole(directoryObject: GraphDirectoryObject): boolean {
  return directoryObject['@odata.type'] === '#microsoft.graph.directoryRole';
}
