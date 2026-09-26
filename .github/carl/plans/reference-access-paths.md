# Reference access-path graph

## Status

Approved for assisted implementation on 2026-09-25 from the supplied reference
screenshots.

## Goal

Match the reference graph's useful behavior: permission and app-role nodes,
resource and tenant relationships, a readable target-rooted access-path layout,
clear labels and legend, and structured permission/grant details. Keep the
delegated permission baseline exactly `User.Read` and `Directory.Read.All`.

## Contract assertions

1. OAuth2 delegated grants are read from Microsoft Graph v1.0 using
   `Directory.Read.All`; no new scope is requested.
2. App-role and delegated-permission nodes resolve human-readable definitions
   from resource service principals when available and retain raw IDs when not.
3. Every permission edge preserves assignment/grant provenance and never
   implies effective privilege beyond the Graph response.
4. The access-path layout places the investigation target first and produces
   deterministic layers without a new dependency.
5. The legend, labels, filters, and details panel describe the same normalized
   node and edge types.

## Implementation

1. Extend Graph DTOs and client methods for organizations and
   `oauth2PermissionGrant`, plus app-role and delegated-scope definitions on
   service principals.
2. Expand user and service-principal/application investigations with delegated
   grants. Resolve permission definitions and resource service principals,
   then normalize permission nodes and provenance-bearing edges.
3. Replace direct app-role-assignment-to-resource edges with explicit app-role
   nodes connected to their resource service principals.
4. Add tenant scope only where Graph-backed role scope semantics establish it.
5. Mark the selected investigation target in the normalized graph and add a
   deterministic breadth-layered access-path layout derived from undirected
   distance to that target.
6. Add readable edge labels, stronger dark-canvas text treatment, a persistent
   legend for present node/relationship types, and structured permission/grant
   fields in the details panel.
7. Add tests for permission normalization, unresolved definitions, layout
   determinism, legend contents, labels, details, and unchanged scopes.

## Validation

- `npm run lint`
- `npm test`
- `npm run build`
- `npm audit`
- `carl map`
- `carl status`

## Risks

- OAuth2 grants and app-role assignments can be numerous, increasing graph
  density.
- Graph may omit or return stale definitions; IDs must remain visible as safe
  fallbacks.
- Delegated grant reads and some application reads depend on the signed-in
  user's directory role despite tenant admin consent.
- Layout improves readability but cannot eliminate all crossings in dense
  access graphs.
