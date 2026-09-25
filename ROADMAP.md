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

- MSAL Browser single-tenant authentication
- `User.Read` and `Directory.Read.All` only
- `/me` call and authenticated identity display
- Login/logout
- Robust auth and consent error handling

## Milestone 2 — graph foundation

- Normalized graph domain model
- Cytoscape component
- Demo fixture with multiple node and edge types
- Selection and details panels
- Layouts, fit, reset, and export foundation

## Milestone 3 — Microsoft Graph ingestion

- Typed Graph abstraction
- Pagination and throttling handling
- Targeted user lookup
- Direct and transitive memberships
- Supported relationships available under the initial permission baseline
- Provenance metadata

## Milestone 4 — investigation UI

- Query panel
- Current-user selection
- Access graph generation
- Direct/inherited relationship toggle
- Empty, loading, and error states

## Milestone 5 — filtering

- Object-type filtering
- Edge filtering
- Active-filter indicator
- Reset filters
- Non-destructive filtering over existing graph data

## Milestone 6 — hardening

- CSP/security-header review
- Security review
- Test expansion
- Documentation and accessibility pass
- Dependency review
- Production build validation
