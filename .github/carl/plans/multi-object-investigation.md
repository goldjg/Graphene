# Multi-object investigation

## Status

Approved for assisted implementation on 2026-09-25.

## Goal

Allow Graphene to investigate users, groups, app registrations, enterprise
applications, and activated directory roles, graph the relationships available
through Microsoft Graph v1.0 under the existing `User.Read` and
`Directory.Read.All` delegated scopes, and preserve the existing
non-destructive object-type filters.

## Affected files

- `.github/carl/current-pr-contract.md`
- `.github/carl/memory.md`
- `README.md`
- `ROADMAP.md`
- `src/microsoftGraph/client/GraphClient.ts`
- `src/microsoftGraph/client/GraphClient.test.ts`
- `src/microsoftGraph/dto/**`
- `src/microsoftGraph/ingestion/**`
- `src/features/investigation/QueryPanel.tsx`
- `src/features/investigation/QueryPanel.test.tsx`
- `src/features/investigation/queryState.ts`
- `src/features/investigation/queryState.test.ts`
- Graph model, filter, and renderer files only if a supported relationship
  requires a missing normalized type.

## Contract assertions

1. MSAL requests remain exactly `User.Read` and `Directory.Read.All`.
2. Queries carry an explicit target type and type-appropriate identifier.
3. Relationship builders emit only Graph-backed, provenance-bearing edges.
4. Display filters do not mutate source graph data or issue Graph requests.
5. Permission-limited and unsupported object types fail safely without guessed
   relationships.

## Step-by-step changes

1. Add DTOs for groups, applications, service principals, directory roles,
   and app-role assignments, keeping Graph DTOs separate from graph-domain
   objects.
2. Extend `GraphClient` with bounded paginated reads for supported objects and
   relationships. Use v1.0 endpoints only and preserve native-fetch binding,
   authentication, error mapping, and pagination limits.
3. Add a typed investigation target and dispatcher:
   - user: profile, direct/transitive memberships, owned directory objects,
     and app-role assignments;
   - group: group, owners, direct/transitive members, direct/transitive parent
     memberships, and app-role assignments;
   - app registration: application, owners, and linked service principals;
   - enterprise application: service principal, owners, incoming and outgoing
     app-role assignments, and related principals/resources;
   - directory role: activated role and assigned members.
4. Normalize related directory objects into supported graph node types and
   deduplicate nodes/edges while preserving relationship provenance.
5. Update query state and UI with an accessible target-type selector and
   type-specific identifier guidance. Keep current-user mode and OAuth response
   URL protection intact.
6. Reuse the existing object-type filter implementation; extend labels/types
   only if the live ingestion introduces a normalized type not already
   represented.
7. Add focused unit and component tests for endpoint construction, pagination,
   alternate identifiers, each object builder, deduplication, provenance,
   query-state serialization, validation, and object-type filtering.
8. Update README, roadmap, and durable cARL memory with the supported object
   types, relationship limits, and unchanged permission baseline.

## Test strategy

- `npm run lint`
- `npm test`
- `npm run build`
- `npm audit`
- `carl map`
- `carl status`

Tests must directly prove the five contract assertions and must not require a
live Entra tenant.

## Risks

- Large groups can produce large graphs; existing pagination is bounded, but
  the UI may still receive many nodes.
- Microsoft Graph can return limited-information directory objects; the
  normalizer must tolerate missing display properties.
- The v1.0 group-members endpoint omits service principals due to a documented
  Graph limitation; this change must not use beta as a workaround.
- Directory roles are limited to activated `directoryRole` instances.
- Some delegated operations also depend on the signed-in user's Entra role,
  even when `Directory.Read.All` consent exists; failures must surface through
  existing Graph error handling.

## cARL/docs update expectation

Update the current PR contract before implementation. After implementation,
update `.github/carl/memory.md`, `README.md`, and `ROADMAP.md` because supported
behavior and the resolved permission baseline are durable project truth.
