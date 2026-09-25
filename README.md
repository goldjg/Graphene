# Graphene

Graphene is an open-source Microsoft Entra access-path visualisation and
investigation tool. It is designed to help security engineers explore questions
such as "How does this identity obtain access to this resource?" and "What can
this identity reach, and through which relationships?"

Graphene is initially an access-relationship explorer, not a
privilege-escalation engine, attack-path product, or risk-scoring system.

## Current feature status

Milestones 0 through 6 are implemented: cARL governance, Vite + React +
TypeScript foundation, Netlify configuration, environment configuration,
baseline documentation, MSAL multi-tenant authentication, Microsoft Graph
`/me`, a normalized graph domain model, a Cytoscape investigation canvas with
demo fixture data, node/edge details panels, Microsoft Graph ingestion of
a user's direct and transitive group/directory-role memberships (with
pagination, throttling handling, and provenance metadata), a live
investigation query panel (current user or search by object ID/UPN, with a
query-time direct/inherited relationship toggle and loading/error/
unauthenticated states), non-destructive, display-time filtering by object
type, relationship type, and inherited/direct status, and a hardening pass
covering security headers, dependency/security review, an accessibility
pass, and production bundle code-splitting.

See `ROADMAP.md` for full milestone detail, including known follow-up items
(such as keyboard navigation of individual graph nodes/edges).

## Architecture overview

Graphene is a static SPA:

```text
Browser SPA -> Microsoft Entra sign-in -> Microsoft Graph REST API
```

There is no backend in the initial architecture. The browser uses MSAL Browser
with Graphene's own public multi-tenant SPA app registration and delegated
access tokens. The tenant under investigation is derived from the authenticated
account context.
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
- A Microsoft Entra multi-tenant SPA app registration owned by the Graphene
  deployment
- Administrator consent for `Directory.Read.All`

## Entra app registration

Create Graphene's own Microsoft Entra public client application registration
for accounts in any organizational directory. The application registration is
public browser configuration: it must not have a client secret or certificate.

1. In Microsoft Entra admin center, create a new app registration.
2. Set supported account types to accounts in any organizational directory.
3. Add a **Single-page application** platform.
4. Copy the **Application (client) ID**; this is the value for
   `VITE_ENTRA_CLIENT_ID`.
5. Add the exact SPA redirect URI used by local development:
   `http://localhost:5173/`.
6. Add the exact production Netlify site URL as another SPA redirect URI, for
   example `https://your-site-name.netlify.app/`. If a custom domain is used,
   register that URL instead.
7. Do not create a client secret or upload a certificate.
8. Add only these **delegated** Microsoft Graph permissions:
   - `User.Read`
   - `Directory.Read.All`
9. Grant administrator consent for `Directory.Read.All` in the target
   organizational directories.

`Directory.Read.All` needs administrator consent because Graphene must read
directory relationship information that ordinary profile-only consent cannot
provide.

## Environment variables

For local development, copy the example file and set the client ID copied from
the app registration:

```text
cp .env.example .env.local
VITE_ENTRA_CLIENT_ID=<your SPA application client ID>
```

Do not add a tenant ID. Graphene always uses the Microsoft Entra
`organizations` authority:

```text
https://login.microsoftonline.com/organizations
```

This accepts work or school accounts from organizational directories and
derives the investigated tenant from the authenticated account. Do not use
`common` or `consumers`.

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

Set `VITE_ENTRA_CLIENT_ID` in Netlify environment variables. This is public SPA
configuration, not a secret. Set it for each deploy context that builds the
site, and ensure the corresponding Netlify URL is registered as an SPA
redirect URI in Microsoft Entra. Do not store tokens, client secrets,
certificates, tenant IDs, or production-only confidential values in the
repository.

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
