# Security Policy

Graphene is a security engineering tool and should behave like one.

## Supported versions

Graphene is pre-1.0. Security fixes apply to the default branch until a release
policy is established.

## Reporting a vulnerability

Please report vulnerabilities privately using GitHub private vulnerability
reporting if it is enabled for this repository. If it is not enabled, contact
the repository owner through an appropriate private channel rather than opening
a public issue with exploit details.

## Security invariants

- Initial architecture is a static SPA hosted on Netlify.
- No backend, Netlify Function, database, client secret, or certificate.
- All Microsoft Graph access is read-only.
- Initial delegated Graph scopes are exactly `User.Read` and
  `Directory.Read.All`.
- Do not introduce write permissions or application permissions.
- Do not log or display access tokens.
- Do not commit tenant-specific identifiers, access tokens, refresh tokens,
  client secrets, certificates, or production-only confidential identifiers.
- Treat Microsoft Graph strings as untrusted input.
- Do not use `dangerouslySetInnerHTML`.
- Do not dynamically execute Graph-derived content.
- Do not add telemetry or third-party analytics by default.
- Use MSAL v4's encrypted local-storage cache for cross-context mobile redirect
  recovery. Do not read, copy, log, or expose its cached accounts, tokens,
  encryption material, or temporary PKCE/state metadata.
- Start and complete authentication on the configured canonical origin.
  Ephemeral Netlify deploy-preview origins must hand sign-in to that origin
  rather than being dynamically trusted or registered as redirect URIs.
- Do not synchronize application query state into the URL until MSAL has
  finished processing any OAuth response parameters.
- Keep browser API calls receiver-safe; do not detach native `Window` methods
  such as `fetch`.
- Restrict live multi-object investigation to Microsoft Graph v1.0 endpoints
  whose documented delegated permissions include `Directory.Read.All`.
- Model OAuth2 delegated grants and app-role assignments as read-only
  permission nodes. Preserve Graph-provided grant, assignment, principal,
  client, resource, consent-type, scope, and permission IDs without treating
  those identifiers or visual proximity as proof of effective privilege.
- Do not use beta endpoints to fill relationship gaps. In particular, accept
  the documented v1.0 omission of service principals from
  `/groups/{id}/members` rather than broadening the API or permission boundary.
- Bound collection pagination and fail explicitly rather than silently
  returning a partial graph when the safety limit is exceeded.

## Trust flow

```text
Browser-hosted Graphene SPA
  -> Microsoft Entra organizations sign-in via MSAL Browser
  -> delegated access token for User.Read + Directory.Read.All
  -> Microsoft Graph REST API
  -> normalized provenance-aware graph model
  -> Cytoscape visualization
```

The browser is an untrusted environment. Public SPA configuration can be
exposed to users; secrets cannot.

## Content Security Policy

Netlify security headers are configured in `netlify.toml`. CSP intentionally
allows Microsoft Entra sign-in endpoints and Microsoft Graph API calls without
using wildcard sources.
