<!-- version: 1.0.0 -->
# Durable Architectural Truth Cache

This cache stores durable Graphene project truths that should persist beyond a
single task. Update it only when a stable fact, decision, invariant, or
unresolved question should carry forward.

## Project purpose

Graphene is an open-source, browser-based Microsoft Entra access-path
visualisation and investigation tool. It helps authenticated Microsoft Entra
users explore how identities relate to users, groups, directory roles,
administrative units, applications, service principals, delegated permissions,
app roles, and tenant scope using a provenance-aware Cytoscape graph.

The primary investigation questions are:

- How does this identity obtain access to this resource?
- What can this identity reach, and through which relationships?

Graphene is initially an access-relationship explorer, not a
privilege-escalation engine, attack-path product, or risk-scoring system.

## Stable product name

The product and repository name is **Graphene**. Do not use the earlier working
name in product UI, documentation headings, package names, or project metadata.

## Architecture summary

Graphene is a static SPA hosted on Netlify and built with Vite, React,
TypeScript, Cytoscape.js, MSAL Browser, Microsoft Graph REST APIs, npm, ESLint,
Prettier, Vitest, and React Testing Library.

There is no backend in the initial implementation: no Netlify Functions, no
database, no client secret, no certificate, and no confidential credential. The
browser authenticates directly with Microsoft Entra and calls Microsoft Graph
with delegated access tokens.

## Authentication and Graph permission baseline

Graphene uses its own multi-tenant Microsoft Entra SPA app registration using
Authorization Code Flow with PKCE via MSAL Browser. The `organizations`
authority permits work/school accounts without hardcoding an Entra tenant; the
authenticated account's tenant context identifies the tenant being investigated.
MSAL v4 encrypted local storage holds accounts, tokens, and temporary redirect
metadata so mobile browsers can recover authentication when the response
returns through a different browsing context. Application code must not read,
log, or expose those cache entries directly.
Authentication starts and completes on an explicitly configured canonical
origin. Ephemeral Netlify deploy-preview origins hand sign-in to that origin
before invoking MSAL and are never registered or trusted dynamically.
URL-backed investigation state must not rewrite the location while MSAL
authentication is initializing because OAuth response parameters are delivered
through that same URL.
The Graph client wraps the browser's native fetch call through `globalThis`
instead of detaching the method, because mobile Safari requires the Window
receiver.

Initial delegated Microsoft Graph scopes are exactly:

- `User.Read`
- `Directory.Read.All`

`Directory.Read.All` requires administrator consent. Do not silently add
additional scopes or application permissions to make a feature work. If a
Graph endpoint requires additional permissions, model that capability
explicitly and report that it is unavailable under the current baseline.

## Security invariants

- SPA only initially.
- Netlify static hosting.
- Organizations authority only:
  `https://login.microsoftonline.com/organizations`.
- No `common` or `consumers` authority.
- No backend.
- No client secret or certificate.
- No write permissions.
- No automatic Graph scope expansion.
- No access-token logging or raw-token display.
- No telemetry or third-party analytics by default.
- No tenant state modification.
- No Graph response logging in production.
- Treat Graph strings as untrusted input.
- Do not use `dangerouslySetInnerHTML`.

## Graph modelling invariants

- Microsoft Graph DTOs remain separate from Graphene's normalized graph-domain
  model.
- Cytoscape elements are derived from normalized domain nodes and edges, not
  raw Graph responses.
- Every relationship must retain provenance: endpoint, source object, direct
  versus transitive status, relevant object IDs, and assignment/grant IDs where
  available.
- Never infer effective privilege or authority from visual proximity.
- Do not invent access relationships when Microsoft Graph data does not
  establish them.
- Filtering must operate on the existing investigation dataset where possible
  and must not mutate or destroy the underlying graph state.

## Testing expectations

Tests must not require a real Entra tenant. Authentication and Microsoft Graph
integration should remain abstract and mockable. Deterministic fixture data
should cover pagination, throttling, normalized graph generation, direct versus
inherited relationships, deduplication, provenance preservation, filtering,
query-state parsing, and safe error handling as those features are introduced.

## Current unresolved Graph-permission uncertainties

Future milestones must verify which role, administrative-unit, OAuth grant,
application, service-principal, and app-role relationships are actually
available with only `User.Read` and `Directory.Read.All`. Do not resolve those
uncertainties by adding permissions during the initial implementation.
