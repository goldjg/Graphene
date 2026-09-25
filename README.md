# Graphene

Graphene is an open-source Microsoft Entra access-path visualisation and
investigation tool. It is designed to help security engineers explore questions
such as "How does this identity obtain access to this resource?" and "What can
this identity reach, and through which relationships?"

Graphene is initially an access-relationship explorer, not a
privilege-escalation engine, attack-path product, or risk-scoring system.

## Current feature status

Milestones 0 through 4 are implemented: cARL governance, Vite + React +
TypeScript foundation, Netlify configuration, environment configuration,
baseline documentation, MSAL single-tenant authentication, Microsoft Graph
`/me`, a normalized graph domain model, a Cytoscape investigation canvas with
demo fixture data, node/edge details panels, Microsoft Graph ingestion of
a user's direct and transitive group/directory-role memberships (with
pagination, throttling handling, and provenance metadata), and a live
investigation query panel (current user or search by object ID/UPN, with a
query-time direct/inherited relationship toggle and loading/error/
unauthenticated states).

Filtering and hardening are planned milestones.

## Architecture overview

Graphene is a static SPA:

```text
Browser SPA -> Microsoft Entra sign-in -> Microsoft Graph REST API
```

There is no backend in the initial architecture. The browser uses MSAL Browser
with a public single-tenant SPA app registration and delegated access tokens.
The application is intended for Netlify static hosting.

Core technology choices:

- Vite
- TypeScript
- React
- Cytoscape.js from the npm `cytoscape` package
- MSAL Browser
- Microsoft Graph REST API
- Netlify
- npm
- ESLint
- Prettier
- Vitest
- React Testing Library

## Prerequisites

- Node.js 22.12 or newer
- npm 10 or newer
- A Microsoft Entra tenant
- A Microsoft Entra SPA app registration
- Administrator consent for `Directory.Read.All`

## Entra app registration

Create a Microsoft Entra application registration for a single tenant:

1. In Microsoft Entra admin center, create a new app registration.
2. Set supported account types to accounts in this organizational directory
   only.
3. Add a **Single-page application** platform.
4. Add the localhost development redirect URI, for example
   `http://localhost:5173`.
5. For production, add the final Netlify site URL as an SPA redirect URI, for
   example `https://your-site-name.netlify.app`.
6. Do not create a client secret or upload a certificate.
7. Add only these delegated Microsoft Graph permissions:
   - `User.Read`
   - `Directory.Read.All`
8. Grant administrator consent for `Directory.Read.All`.

`Directory.Read.All` needs administrator consent because Graphene must read
directory relationship information that ordinary profile-only consent cannot
provide.

## Environment variables

Copy `.env.example` to `.env.local` and set:

```text
VITE_ENTRA_CLIENT_ID=<your SPA application client ID>
VITE_ENTRA_TENANT_ID=<your tenant ID>
```

Graphene constructs the authority as:

```text
https://login.microsoftonline.com/${VITE_ENTRA_TENANT_ID}
```

Do not use `common`, `organizations`, or `consumers`.

## Local development

```bash
npm install
npm run dev
npm run build
npm test
```

Useful quality commands:

```bash
npm run lint
npm run format
```

## Netlify deployment

Netlify configuration lives in `netlify.toml`.

- Build command: `npm run build`
- Publish directory: `dist`
- SPA fallback: `/* /index.html 200`

Set `VITE_ENTRA_CLIENT_ID` and `VITE_ENTRA_TENANT_ID` in Netlify environment
variables. These are public SPA configuration values, not secrets. Do not store
tokens, client secrets, certificates, or production-only confidential values in
the repository.

## Threat and security model summary

Graphene follows least privilege and read-only Graph access:

- No backend or server-held credential.
- No client secret or certificate.
- No write permissions.
- No telemetry or third-party analytics by default.
- No access-token logging or raw-token display.
- Graph strings are untrusted input.
- React escaping must remain intact; do not use `dangerouslySetInnerHTML`.
- Microsoft Graph responses plus Graphene's normalized provenance-aware
  relationship model are the source of truth, not visual proximity in the
  rendered graph.

## Current Graph permission limitations

The initial permission baseline is exactly:

- `User.Read`
- `Directory.Read.All`

If a future Microsoft Graph endpoint requires additional permissions, Graphene
must report that capability as unavailable under the current baseline rather
than silently requesting broader access.

## Roadmap

See [ROADMAP.md](ROADMAP.md).

## Governance

Graphene uses cARL from the first meaningful commit. Durable project
instructions, assumptions, constraints, architectural decisions, permission
constraints, and security invariants live under `.github/carl/`.
