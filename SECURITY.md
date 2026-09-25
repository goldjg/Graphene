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
- Keep accounts and tokens in session storage. Local storage may contain only
  MSAL's short-lived redirect metadata needed to recover PKCE/state across
  mobile browser context changes.

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
