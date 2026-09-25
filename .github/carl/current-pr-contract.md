# Current PR Contract

## Goal

Maintain Graphene as a static Vite + React + TypeScript SPA with safe
multi-tenant Microsoft Entra authentication configuration, Netlify deployment,
and baseline documentation using Graphene as the product name.

## Contract status

active

## Non-goals

- Replacing MSAL or changing the authorization-code-with-PKCE architecture.
- Microsoft Graph API calls.
- Cytoscape rendering.
- Investigation query UX.
- Filtering implementation.
- Backend services, Netlify Functions, databases, client secrets,
  certificates, telemetry, write permissions, or Graph application
  permissions.

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

## Intentional amendments

The pasted project brief used a working name, but the authoritative product
name is Graphene.

## Forbidden scope

- Using the earlier working name in product UI, package metadata, or
  documentation headings.
- Entra `common` or `consumers` authorities.
- Graph scopes beyond `User.Read` and `Directory.Read.All`.
- Graph write operations.
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

## Tests / validation

- `npm run lint`
- `npm test`
- `npm run build`
- `npm audit`
- `carl map`
- `carl status`

## Stop conditions

Stop if authentication requires adding a backend, secret, Graph write
permission, application permission, broader delegated scope, or an authority
outside `organizations`.

## Escalation triggers

Ask before introducing optional Graph permissions, telemetry, persistence,
backend code, or a design that changes the static SPA trust boundary.

## Context reset notes

When Milestone 0 is committed, future sessions should read this contract,
`.github/carl/plans/milestone-0-foundations.md`, `.github/carl/memory.md`,
`README.md`, `SECURITY.md`, `ROADMAP.md`, and
`docs/architecture/adr/0001-static-spa-foundation.md` before starting
Milestone 1.
