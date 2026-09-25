# Roadmap

Graphene development is milestone-driven so cARL governance, security
constraints, and testability stay intact.

## Milestone 0 — cARL and foundations

- cARL runtime and durable project governance
- Vite + React + TypeScript foundation
- ESLint, Prettier, Vitest, and React Testing Library
- Netlify configuration and SPA fallback
- Environment configuration
- README, SECURITY, roadmap, and initial ADR

## Milestone 1 — authentication

- MSAL Browser multi-tenant authentication through `organizations`
- `User.Read` and `Directory.Read.All` only
- `/me` call and authenticated identity display
- Login/logout
- Robust auth and consent error handling

Status: implemented.

## Milestone 2 — graph foundation

- Normalized graph domain model
- Cytoscape component
- Demo fixture with multiple node and edge types
- Selection and details panels
- Layouts, fit, reset, and export foundation

Status: implemented.

## Milestone 3 — Microsoft Graph ingestion

- Typed Graph abstraction
- Pagination and throttling handling
- Targeted user lookup
- Direct and transitive memberships
- Supported relationships available under the initial permission baseline
- Provenance metadata

Status: implemented. Only `/me` (or `/users/{id}`), `/memberOf`, and
`/transitiveMemberOf` are wired today; administrative units, app role
assignments, delegated permission grants, and
application/service-principal relationships remain unresolved and are not
modelled yet (see `.github/carl/memory.md`).

## Milestone 4 — investigation UI

- Query panel
- Current-user selection
- Access graph generation
- Direct/inherited relationship toggle
- Empty, loading, and error states

Status: implemented. The query panel supports investigating the signed-in
user or an explicit object ID/UPN, with a query-time include-inherited
toggle, URL query-state sync (no secrets/tokens are ever encoded), and
loading/error/unauthenticated states.

## Milestone 5 — filtering

- Object-type filtering
- Edge filtering
- Active-filter indicator
- Reset filters
- Non-destructive filtering over existing graph data

Status: implemented. Filtering is a pure, display-time transform
(`applyGraphFilters`) over whatever `InvestigationGraph` is already loaded
(demo or a live query result); it never re-queries Microsoft Graph and never
mutates the source graph. Filters reset automatically whenever a new graph
is loaded.

## Milestone 6 — hardening

- CSP/security-header review
- Security review
- Test expansion
- Documentation and accessibility pass
- Dependency review
- Production build validation

Status: implemented.

- Security headers: added `X-Frame-Options: DENY` and a preload-eligible
  `Strict-Transport-Security` header alongside the existing CSP, referrer
  policy, `X-Content-Type-Options`, and `Permissions-Policy` in
  `netlify.toml`. CSP continues to avoid wildcard sources.
- Security review: confirmed no `dangerouslySetInnerHTML`, `eval`, or
  dynamic code execution; no `console.*` logging anywhere in `src/`
  (tokens and Graph-derived data are never logged); `npm audit` reports 0
  vulnerabilities.
- Production build: added `build.rollupOptions.output.manualChunks` in
  `vite.config.ts` to split Cytoscape and MSAL Browser into their own
  cacheable chunks, resolving the single->500 kB bundle warning.
- Accessibility: verified landmark/heading structure, `role="status"`/
  `role="alert"` live regions, and labelled form controls across
  `App.tsx`, `QueryPanel.tsx`, and `FilterPanel.tsx`. The Cytoscape canvas
  is exposed as `role="img"` with a descriptive label; full keyboard
  navigation of individual graph nodes/edges is a known limitation of the
  canvas-based renderer and is tracked as a follow-up rather than solved
  in this milestone.
- Dependency review: the dependency set remains minimal (React, MSAL
  Browser, Cytoscape, and their existing dev tooling); no new runtime
  dependencies were added for hardening.
