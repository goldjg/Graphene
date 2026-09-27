# Object search typeahead

## Status

Approved for assisted implementation on 2026-09-27.

## Goal

Make live object search discoverable and responsive by showing bounded
Microsoft Graph suggestions while the user types.

## Affected files

- `.github/carl/current-pr-contract.md`
- `.github/carl/memory.md`
- `README.md`
- `ROADMAP.md`
- `src/features/investigation/QueryPanel.tsx`
- `src/features/investigation/QueryPanel.test.tsx`
- `src/microsoftGraph/client/GraphClient.ts`
- `src/microsoftGraph/client/GraphClient.test.ts`
- `src/microsoftGraph/ingestion/target.ts`
- `src/styles.css`

## Step-by-step changes

1. Add a shared typed suggestion shape and an endpoint-specific search
   definition for each supported target.
2. Build one URL-encoded Microsoft Graph v1.0 `$search` request with
   `ConsistencyLevel: eventual`, `$select`, and `$top=8`.
3. Debounce input, abort stale requests, and avoid querying short values.
4. Add a combobox/listbox interaction with pointer and keyboard selection.
5. Add tests for request construction, result limits, debounce, cancellation,
   stale-result protection, and keyboard selection.
6. Update durable feature documentation.

## Test strategy

- Focused Vitest client and component tests.
- Full lint and production build.
- Dependency audit.
- cARL map and status checks.

## Risks

- Microsoft Graph directory search uses eventual consistency, so very recent
  directory changes may not appear immediately.
- Directory object visibility remains constrained by the signed-in user's
  delegated access and tenant role.
- Network requests cannot be made synchronous or moved meaningfully to a Web
  Worker; cancellation and bounded response processing are the relevant UI
  responsiveness controls.

## cARL/docs update expectation

Update durable memory, README, and roadmap because search behavior changes for
all supported live investigation targets.
