# Graph analysis and directory expansion

## Status

Approved for assisted implementation on 2026-09-26.

## Goal

Add the requested investigation capabilities except an accessible table/tree
view, while keeping Microsoft Graph delegated permissions exactly
`User.Read` and `Directory.Read.All`.

## Affected files

- `.github/carl/current-pr-contract.md`
- `.github/carl/memory.md`
- `README.md`
- `ROADMAP.md`
- `src/graph/**`
- `src/features/graphExplorer/**`
- `src/features/investigation/**`
- `src/microsoftGraph/client/**`
- `src/microsoftGraph/dto/**`
- `src/microsoftGraph/ingestion/**`
- `src/styles.css`

## Contract assertions

1. Authentication continues to request exactly `User.Read` and
   `Directory.Read.All`; all new Graph calls use Microsoft Graph v1.0
   endpoints documented for that delegated baseline.
2. Path finding, search/focus, summaries, snapshot comparison, and report
   generation operate only on loaded normalized graph data and never infer
   effective privilege from visual proximity.
3. Imported snapshots are versioned normalized graphs, validated at runtime,
   and rejected explicitly when malformed; imports never trigger Graph calls.
4. Administrative-unit and device relationships retain endpoint, queried
   object, directness, and related-object provenance.
5. Expansion is explicit and bounded to one selected supported node per user
   action; it merges normalized graphs without replacing or corrupting the
   existing investigation.
6. Exports warn that directory metadata can be sensitive and do not include
   tokens or MSAL cache data.

## Step-by-step changes

1. Add pure graph-analysis utilities for search, focus, shortest/all simple
   paths with a safe cap, summaries, merging, snapshot validation/comparison,
   CSV reports, and readable path explanations.
2. Extend canvas controls so local search and path results can focus/highlight
   matching graph elements without changing the source graph.
3. Replace the renderer-only JSON export with a versioned normalized snapshot,
   add snapshot import/compare, CSV export, and selected-item evidence copy.
4. Add administrative-unit and device DTOs, node types, icons, labels, client
   methods, target validation, and first-order relationship builders.
5. Enrich existing normalized group, application, and service-principal
   metadata using non-credential properties returned under the current scope.
6. Add explicit one-node expansion for supported directory-object node types.
7. Add focused unit/component tests and update durable documentation.

## Test strategy

- `npm run lint`
- `npm test`
- `npm run build`
- `npm audit`
- `carl map`
- `carl status`

Tests must prove the six contract assertions without a live tenant.

## Risks

- Large first-order collections can still be expensive despite the existing
  50-page safety bound.
- Administrative-unit and device reads can also depend on the signed-in
  user's Entra role; permission failures must remain explicit.
- Imported snapshots contain tenant directory metadata and must be handled as
  sensitive local files.
- Path enumeration must be capped to avoid exponential work on dense graphs.

## cARL/docs update expectation

Update `.github/carl/memory.md`, `README.md`, and `ROADMAP.md` because the
supported target types, local-analysis behavior, snapshot format, and bounded
expansion become durable project behavior.
