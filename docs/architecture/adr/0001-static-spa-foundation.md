# ADR 0001: Static SPA foundation

## Status

Accepted

## Context

Graphene needs to let security engineers investigate Microsoft Entra access
relationships while preserving least privilege, avoiding confidential browser
credentials, and staying deployable as a static Netlify site.

The initial product must use a single-tenant Microsoft Entra SPA application
registration with Authorization Code Flow and PKCE through MSAL Browser.
Initial delegated Microsoft Graph scopes are exactly `User.Read` and
`Directory.Read.All`.

## Decision

Graphene will be built as a Vite + React + TypeScript static SPA, deployed to
Netlify, and authenticated directly from the browser through MSAL Browser.

The initial architecture has:

- no backend;
- no Netlify Functions;
- no database;
- no client secret;
- no certificate;
- no application permissions;
- no Microsoft Graph write permissions;
- no telemetry or third-party analytics by default.

The app uses `VITE_ENTRA_CLIENT_ID` and `VITE_ENTRA_TENANT_ID` as public SPA
configuration and constructs a tenant-specific authority:

```text
https://login.microsoftonline.com/${VITE_ENTRA_TENANT_ID}
```

The aliases `common`, `organizations`, and `consumers` are forbidden.

## Consequences

Graphene can deploy as static assets and can be developed locally without a
server component. Features that require Microsoft Graph permissions beyond
`User.Read` and `Directory.Read.All` must be represented as unavailable or
future optional capabilities rather than silently expanding scopes.

Any future backend, persistence layer, telemetry, optional permission, or
multi-tenant support requires a new ADR and cARL invariant review.
