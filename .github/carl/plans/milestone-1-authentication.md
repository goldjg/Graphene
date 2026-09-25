# Graphene Milestone 1 — authentication

## Plan metadata
- PR / branch: initial repository / `main`
- Status: active
- Author: GitHub Copilot
- Created: 2026-09-25
- Last updated: 2026-09-25

## Task summary

Implement multi-tenant Microsoft Entra authentication with Graphene's own
public SPA registration using the `organizations` authority, only
`User.Read` and `Directory.Read.All`, then call Microsoft Graph `/me` and
display the authenticated identity and tenant context.

## Goal

- Create a small authentication abstraction.
- Use the public SPA client ID from environment configuration and the fixed
  `organizations` authority.
- Request only the approved delegated scopes.
- Prefer silent token acquisition and use interactive redirect flows only when
  needed.
- Call Microsoft Graph `/me` through a typed Graph client abstraction.
- Display authenticated identity and login/logout controls.
- Provide understandable auth and Graph errors for security engineers.

## Non-goals

- Directory relationship ingestion.
- Cytoscape rendering.
- Investigation query UX.
- Additional Graph scopes.
- Graph write operations.
- Backend, secrets, certificates, or persistent tenant data.

## Approved scope

- `src/auth/**`
- `src/microsoftGraph/**`
- auth UI integration in `src/App.tsx`
- related tests and documentation updates

## Forbidden scope

- Any scope beyond `User.Read` and `Directory.Read.All`.
- `common` or `consumers` authorities.
- Client secrets or certificates.
- Token logging or raw-token display.
- Production Graph response logging.

## Acceptance criteria

- App initializes MSAL with its encrypted local-storage cache so accounts,
  tokens, and redirect metadata survive mobile browser context changes.
- Sign-in initiated on an ephemeral deployment origin is handed to the
  configured canonical origin before MSAL starts.
- Signed-in users are resolved with `/me`.
- The authenticated account tenant ID is available as runtime context.
- Login and logout controls are available.
- Auth errors distinguish cancellation, missing admin consent/access denied,
  interaction-required, and generic auth failures.
- Graph errors distinguish 401, 403, 429, and transient/network failures.
- Tests do not require a real Entra tenant.

## Contract assertions

- Login requests use exactly `User.Read` and `Directory.Read.All`.
- MSAL config uses MSAL v4 encrypted local storage for accounts, tokens, and
  temporary redirect metadata, plus the `organizations` authority.
- Authentication requests use the explicitly configured canonical redirect URI
  rather than trusting the current deploy-preview origin.
- Investigation query-state synchronization waits until authentication
  initialization completes so it cannot remove OAuth response parameters
  before MSAL processes them.
- `/me` requests are made through the Graph client with bearer auth.
- 403 Graph responses produce a permission-focused error.

## Test strategy

Use Vitest unit tests for MSAL config, auth error mapping, and Graph client
request/error behavior with mocked fetch.

## Stop conditions

Stop if authentication requires broader scopes, a backend, a client secret, or
an authority outside `organizations`.
