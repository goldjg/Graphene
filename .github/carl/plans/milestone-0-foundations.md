# Graphene Milestone 0 — cARL and foundations

## Plan metadata
- PR / branch: initial repository / `main`
- Status: active
- Author: GitHub Copilot
- Created: 2026-09-25
- Last updated: 2026-09-25

## Task summary

Bootstrap Graphene as a cARL-governed open-source Microsoft Entra
access-path visualisation SPA. The corrected product name is Graphene.

## Current repository context

The repository was empty except for Git metadata before cARL initialization.
cARL is installed in `.github/carl/` with generated harness adapters and
instruction packs. There are no previous application files or commits.

## Goal

Implement Milestone 0:

- Bootstrap cARL and record durable project intent, assumptions, constraints,
  architecture decisions, security invariants, non-goals, testing
  expectations, and permission constraints.
- Create a Vite + React + TypeScript application foundation.
- Configure npm scripts for development, linting, testing, and production
  build.
- Add Netlify static hosting configuration, SPA fallback, and security headers.
- Add safe environment-variable configuration using `VITE_ENTRA_CLIENT_ID` and
  `VITE_ENTRA_TENANT_ID`.
- Add README, SECURITY, roadmap, and architecture decision documentation.

## Non-goals

- Do not implement MSAL sign-in yet.
- Do not call Microsoft Graph yet.
- Do not implement Cytoscape graph rendering yet.
- Do not add a backend, Netlify Function, database, secret, certificate, or
  write permission.
- Do not broaden Graph permissions beyond `User.Read` and
  `Directory.Read.All`.

## Approved scope

- cARL governance artefacts for Graphene.
- Static frontend scaffold and tooling.
- Netlify configuration.
- Documentation skeletons needed for the project foundation.
- Minimal tests validating foundational configuration invariants.

## Forbidden scope

- Multi-tenant authentication.
- `common`, `organizations`, or `consumers` Entra authorities.
- Client secrets, certificates, production tenant IDs, tokens, or credentials.
- Graph write operations or application permissions.
- Telemetry, analytics, or production Graph response logging.
- Claims that relationships imply effective privilege without evidence.

## Trust boundaries

The browser is an untrusted execution environment that stores only public SPA
configuration and delegated authentication state. Microsoft Entra is the
identity provider. Microsoft Graph is the source of directory relationship
evidence. Netlify serves static assets and must not receive secrets beyond
public SPA environment variables.

## Invariants to preserve

- Product name is Graphene.
- SPA only initially.
- Netlify static hosting.
- Single-tenant authentication.
- No backend.
- No client secret or certificate.
- Initial delegated scopes are exactly `User.Read` and `Directory.Read.All`.
- No automatic scope expansion.
- Graph relationships require provenance.
- No invented access relationships.
- Microsoft Graph DTOs and internal graph-domain model remain separate.
- Cytoscape is the intended graph renderer.
- Vite + React + TypeScript are the frontend stack.

## Expected files / directories

- `package.json`
- `package-lock.json`
- `index.html`
- `vite.config.ts`
- `tsconfig*.json`
- `eslint.config.js`
- `.prettierrc.json`
- `.env.example`
- `netlify.toml`
- `src/`
- `docs/architecture/adr/`
- `README.md`
- `SECURITY.md`
- `ROADMAP.md`
- `.github/carl/memory.md`
- `.github/carl/invariants.yml`

## Implementation phases

1. Initialize cARL and verify health.
2. Add project tooling and frontend scaffold.
3. Add environment configuration and invariant tests.
4. Add Netlify deployment/security-header configuration.
5. Add README, SECURITY, ROADMAP, and ADR documentation.
6. Run `npm install`, lint, tests, build, cARL map/status.
7. Commit Milestone 0.

## Acceptance criteria

- `carl status` reports a healthy runtime.
- `npm install` succeeds and produces `package-lock.json`.
- `npm run lint`, `npm test`, and `npm run build` pass.
- `.env.example` contains safe placeholders only.
- Netlify SPA routing fallback is configured.
- Documentation and cARL memory use Graphene as the product name.
- No backend, secrets, client credentials, write permissions, or extra Graph
  scopes are introduced.

## Contract assertions

- The authority builder rejects `common`, `organizations`, and `consumers`.
- The configured Graph scope baseline is exactly `User.Read` and
  `Directory.Read.All`.
- Missing Vite environment variables produce explicit configuration errors.
- The authority string is tenant specific.

## Test strategy

Use Vitest unit tests for configuration contracts. Tests must not require a
real Entra tenant or network calls.

## Prompt ping-pong budget

One corrective prompt is acceptable. Two corrective prompts means reset the
session. Three means abandon the session/model and restart with a clearer plan.

## Model fallback strategy

If the active model repeatedly violates Graphene invariants, restart with the
same cARL plan and acceptance criteria rather than changing scope.

## Stop conditions

Stop if cARL becomes unhealthy, required tooling cannot be installed, or a
Milestone 0 requirement appears to require violating a security invariant.

## Context reset requirements

Future sessions must read `.github/carl/memory.md`,
`.github/carl/invariants.yml`, this plan, `README.md`, `SECURITY.md`, and
`docs/architecture/adr/0001-static-spa-foundation.md` before continuing
Milestone 1.
