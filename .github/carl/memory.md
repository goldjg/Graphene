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

## Branding assets

Branding artwork lives in `public/` and is served from the site root:

- `graphene-logo.png` is the wordmark. It is rendered inside the hero `<h1>`
  with `alt="Graphene"`, which preserves the accessible name referenced by
  `aria-labelledby="graphene-title"`, and is reused at the top of `README.md`.
- `graphene-icon.png` is the 512px node-graph glyph master. `favicon.ico`,
  `favicon-16x16.png`, `favicon-32x32.png`, `favicon-192x192.png`, and
  `apple-touch-icon.png` are all derived from it.

The wordmark has a genuine alpha channel and must remain transparent so it
renders cleanly over the hero gradient on all browsers. Regenerate icon
variants from the glyph master rather than re-cropping the original artwork.

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

## Multi-object investigation baseline

Live investigation targets are users, groups, app registrations, enterprise
applications/service principals, activated directory roles, administrative
units, and devices. Exact
identifier forms are user object ID/UPN, group object ID, application object
ID/application ID, service-principal object ID/application ID, and directory
role object ID/role template ID, administrative-unit object ID, and device
object ID/device ID.

The `User.Read` plus `Directory.Read.All` delegated baseline is sufficient for
the implemented Microsoft Graph v1.0 reads:

- user and group direct/transitive memberships;
- group direct/transitive members and group owners;
- user-owned directory objects;
- user and group app-role assignments;
- application and service-principal owners;
- app registration to service-principal linkage by `appId`;
- incoming and outgoing service-principal app-role assignments; and
- activated directory-role members;
- OAuth2 delegated permission grants for the selected user or client service
  principal; and
- organization scope for activated directory roles.
- administrative-unit members; and
- device registered owners and registered users.

Relationship expansion is deliberately first-order rather than recursive
whole-tenant traversal. App-role assignments and OAuth2 delegated grants are
modelled as explicit permission nodes connected to resource service principals.
The default access-path layout is rooted at the investigation target and is a
visual organization aid only; it does not infer privilege from proximity.
Hidden group membership still requires `Member.Read.Hidden` and is not queried.
Microsoft Graph v1.0 omits service principals from `/groups/{id}/members`;
Graphene does not use the beta endpoint workaround.

## Local graph analysis and snapshots

Graphene performs search/focus, summaries, path discovery/explanation, and
snapshot comparison entirely over the normalized graph already loaded in the
browser. Path enumeration is bounded to 10 results, depth 12, and 5,000
generated path states and must not be described as proof of effective
privilege.

Normalized investigation snapshots use schema version 1 and preserve graph
nodes, edges, metadata, and relationship provenance. Imports must validate the
schema and graph references before replacing the loaded graph. Snapshot, CSV,
and copied evidence outputs can contain sensitive tenant directory metadata
but must never contain tokens or MSAL cache data.

One-node expansion is an explicit user action for supported investigation
targets. It loads only that object's existing first-order builder, strips the
secondary target marker, and merges normalized nodes/edges by ID into the
current graph; it is not recursive whole-tenant traversal.

## Node icon and legend presentation

Every graph node type renders as a uniform rounded-tile "badge" shape
(`src/graph/cytoscape/stylesheet.ts`) with a colour-coded background and a
distinct filled pictogram (`src/graph/cytoscape/icons.ts`), matching
Microsoft Entra/Fluent-style portal icon badges rather than varying
geometric shapes. Meaning must never rely on colour alone; the icon glyph is
the primary type signal.

The graph key/legend is not a separate floating overlay. It is merged into
`FilterPanel` (`src/features/graphExplorer/FilterPanel.tsx`): each
object-type filter checkbox shows the same icon badge rendered on the canvas,
and a relationship key below the checkboxes explains edge colour
(`getEdgeTypeColor` in `stylesheet.ts`) and direct/inherited line style. Do
not reintroduce a separate floating canvas legend component.
