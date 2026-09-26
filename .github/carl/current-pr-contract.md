# Current PR Contract

## Goal

Remove the baked-in dark background from the Graphene wordmark so it renders
cleanly over the SPA hero gradient, including on mobile Safari.

## Contract status

completed

## Active follow-up scope

Only `public/graphene-logo.png`, `src/App.tsx`, `src/styles.css`, `README.md`,
this contract, the branding plan, and directly related durable branding
documentation are approved for the active follow-up. The broader sections
below describe completed prior milestones and are historical context, not
authorization for additional changes.

## Non-goals

- Replacing MSAL or changing the authorization-code-with-PKCE architecture.
- Backend services, Netlify Functions, databases, client secrets,
  certificates, telemetry, write permissions, or Graph application
  permissions.
- Adding delegated permissions beyond `User.Read` and `Directory.Read.All`.
- Microsoft Graph beta endpoints.
- Reading hidden group membership that requires `Member.Read.Hidden`.
- Treating visual proximity as proof of effective privilege.
- Introducing a graph-layout dependency.
- Adding an accessible table/tree view in this milestone.
- Recursive or automatic whole-tenant traversal.
- Application credential or secret-material inspection.
- Risk scoring or claims of effective privilege based on graph topology.

## Carry-forward rules

The project constraints in `.github/carl/memory.md`, `README.md`,
`SECURITY.md`, `ROADMAP.md`, and `docs/architecture/adr/` are durable
Graphene truths unless explicitly amended in a future cARL contract and ADR.

## Approved scope

- cARL runtime initialization and Graphene-specific cARL memory/plan/contract.
- Static frontend scaffold.
- npm scripts and dependency lockfile.
- Netlify deployment and security headers.
- Safe Vite environment configuration.
- Cross-context authentication cache recovery for mobile browsers using MSAL
  v4 encrypted local storage.
- Canonical-origin handoff before authentication when Graphene is opened from
  an ephemeral Netlify deploy-preview URL.
- Unit tests for Milestone 0 configuration invariants.
- Milestone 0 documentation.
- Typed lookup by user, group, app registration, enterprise application, and
  activated directory role.
- Object-ID lookup for all supported object types, plus UPN for users and
  application/client ID alternate-key lookup for app registrations and
  enterprise applications.
- Permission-compatible relationship ingestion for memberships, owners,
  linked app registration/service-principal objects, and app-role assignments.
- OAuth2 delegated permission grants, delegated permission definitions,
  app-role definitions, related resource service principals, and tenant scope
  where Microsoft Graph establishes the relationship.
- Provenance-preserving normalized graph nodes and edges for every relationship
  returned by the new ingestion paths.
- Query-state and investigation UI updates for selecting the target object
  type.
- Non-destructive display filtering by the object types present in the loaded
  graph.
- A deterministic, target-rooted access-path layout, readable relationship
  labels, a persistent legend, and permission/grant-specific selection details.
- Focused tests and durable documentation updates for the new behavior.
- Fluent/Entra portal-style icon badges per object type (uniform tile shape,
  colour, and pictogram), merging the graph key/legend into the Filters
  panel rather than a floating canvas overlay.
- Pure loaded-graph path finding, explanations, search/focus, summaries, and
  snapshot comparisons.
- Versioned normalized snapshot import/export, CSV relationship export, and
  selected-item evidence copy.
- Administrative-unit investigations and their first-order members.
- Device investigations and their registered owners/users.
- Safe richer group, application, service-principal, administrative-unit, and
  device metadata that excludes credentials and secret material.
- Explicit expansion of one selected supported node per user action, merging
  normalized results into the existing graph.

## Intentional amendments

The pasted project brief used a working name, but the authoritative product
name is Graphene.

## Forbidden scope

- Using the earlier working name in product UI, package metadata, or
  documentation headings.
- Entra `common` or `consumers` authorities.
- Graph scopes beyond `User.Read` and `Directory.Read.All`.
- Microsoft Graph beta endpoints or endpoints whose documented delegated
  permissions do not include `Directory.Read.All`.
- Graph write operations.
- Conditional Access, audit/sign-in logs, PIM, authentication methods,
  entitlement management, hidden membership, or application credential data.
- Client secrets, certificates, access tokens, refresh tokens, tenant secrets,
  or production confidential identifiers in repository files.
- A backend, Netlify Function, or persistent tenant Graph data.

## Architectural constraints

- Static SPA hosted on Netlify.
- Vite + React + TypeScript frontend stack.
- npm package management.
- MSAL Browser and Cytoscape are first-class planned dependencies.
- Graphene uses its own multi-tenant public SPA registration with the
  `organizations` authority; the investigated tenant comes from the
  authenticated account context.
- Microsoft Graph DTOs must remain separate from normalized graph-domain
  objects in future milestones.
- Relationship provenance is mandatory for graph relationships in future
  milestones.

## Security constraints

- Least privilege.
- Read-only Graph access.
- No token logging or raw-token display.
- MSAL v4 encrypted local storage may hold accounts, tokens, and temporary
  redirect metadata for mobile cross-context recovery. Application code must
  not directly read, log, or expose those cache entries.
- OAuth authorization and redirect handling must occur on the same explicitly
  configured and Entra-registered origin; deploy previews must not become
  implicitly trusted redirect origins.
- Application query-state synchronization must not rewrite the URL while MSAL
  is processing an OAuth redirect response.
- Browser Graph requests must invoke the native fetch function with its
  required global receiver.
- No production Graph response logging.
- Graph strings are untrusted input.
- React escaping must remain intact.
- Do not use `dangerouslySetInnerHTML`.
- Do not silently expand scopes to make unsupported capabilities work.

## Files expected to change

- `.github/carl/**`
- `.github/instructions/**`
- `.agents/**`
- `.cursor/**`
- `AGENTS.md`
- `CLAUDE.md`
- frontend scaffold and tooling files
- `src/**`
- `docs/**`
- `README.md`
- `SECURITY.md`
- `ROADMAP.md`
- `netlify.toml`
- `.env.example`
- `src/microsoftGraph/client/**`
- `src/microsoftGraph/dto/**`
- `src/microsoftGraph/ingestion/**`
- `src/features/investigation/**`
- `src/features/graphExplorer/**`
- `src/graph/**`
- `src/styles.css`

## Tests / validation

- `npm run lint`
- `npm test`
- `npm run build`
- `npm audit`
- `carl map`
- `carl status`

## Contract assertions

1. Authentication continues to request exactly `User.Read` and
   `Directory.Read.All`; no new delegated or application permissions are
   introduced.
2. A query explicitly identifies its target object type and resolves only the
   supported identifier forms for that type.
3. Every rendered relationship is backed by a Microsoft Graph response and
   retains endpoint, queried object ID, direct/transitive status, related
   object IDs, and assignment ID when available.
4. Object-type filters remain display-time, non-destructive transforms over
   the loaded `InvestigationGraph` and never trigger Microsoft Graph requests.
5. Unsupported, hidden, incomplete, or permission-constrained relationships
   are skipped or reported explicitly; Graphene never invents relationships or
   silently broadens permissions.
6. App-role and delegated-permission nodes preserve the assignment/grant ID,
   resource service principal, permission identifier, consent type, principal,
   and scope value available from Microsoft Graph.
7. The access-path layout is deterministic, dependency-free, and preserves
   user control through the existing alternative layouts.
8. Local analysis and snapshot comparison operate only on normalized loaded
   data and do not issue Graph requests.
9. Snapshot imports are schema/version validated and malformed files fail
   explicitly without replacing the current graph.
10. Administrative-unit and device edges preserve complete relationship
    provenance.
11. Expansion is user-initiated, limited to one selected supported node per
    action, and merges without deleting existing graph data.
12. Exports contain no token or MSAL cache data and clearly warn that directory
    metadata may be sensitive.

## Stop conditions

Stop if authentication requires adding a backend, secret, Graph write
permission, application permission, broader delegated scope, or an authority
outside `organizations`.
Stop if a desired relationship is available only through a beta endpoint or
requires a delegated permission outside the approved baseline.
Stop if device or administrative-unit relationship documentation no longer
lists `Directory.Read.All` as an accepted delegated permission.

## Escalation triggers

Ask before introducing optional Graph permissions, telemetry, persistence,
backend code, or a design that changes the static SPA trust boundary.

## Context reset notes

Future sessions should read this contract,
`.github/carl/plans/multi-object-investigation.md`, `.github/carl/memory.md`,
`.github/carl/plans/reference-access-paths.md`, `README.md`, `SECURITY.md`, and
`ROADMAP.md` before changing investigation targets, Microsoft Graph endpoints,
permissions, graph relationship semantics, or graph visualization behavior.
The active implementation plan is
`.github/carl/plans/edge-colour-rendering-fix.md`.
The focused edge-colour follow-up is complete. Future work should create a new
active contract.
