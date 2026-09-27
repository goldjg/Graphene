# Current PR Contract

## Goal

Add responsive typeahead to the live object-search field without changing
Graphene's authentication model, permission baseline, investigation semantics,
or static-SPA trust boundary.

## Contract status

completed

## Approved scope

- Debounced Microsoft Graph typeahead for every supported investigation target.
- One bounded, asynchronous Graph request for the currently selected object
  type, with stale requests aborted when input or target type changes.
- Accessible mouse and keyboard selection of suggestions.
- Focused Graph client and query-panel tests.
- Directly related styles and durable user documentation.
- A task-specific implementation plan under `.github/carl/plans/`.

## Non-goals

- Searching every object type simultaneously.
- Recursive or automatic whole-tenant traversal.
- Background workers for network I/O that is already asynchronous.
- JSON batching when one selected object collection requires only one request.
- A backend, persistent tenant data, telemetry, or new dependencies.
- Microsoft Graph beta endpoints, write operations, or broader permissions.

## Forbidden scope

- Delegated permissions beyond `User.Read` and `Directory.Read.All`.
- Application permissions, client secrets, certificates, or token exposure.
- Entra authorities other than `organizations`.
- Graph response logging or raw tenant data persistence.
- `dangerouslySetInnerHTML`.

## Architectural constraints

- Remain a Vite + React + TypeScript static SPA.
- Use Microsoft Graph v1.0 and the existing `GraphClient`.
- Keep Graph DTOs separate from normalized graph-domain objects.
- Limit typeahead results and response processing so typing remains responsive.
- Treat Graph strings as untrusted and render through React escaping.

## Files expected to change

- `.github/carl/current-pr-contract.md`
- `.github/carl/plans/object-search-typeahead.md`
- `.github/carl/memory.md`
- `README.md`
- `ROADMAP.md`
- `src/features/investigation/QueryPanel.tsx`
- `src/features/investigation/QueryPanel.test.tsx`
- `src/microsoftGraph/client/GraphClient.ts`
- `src/microsoftGraph/client/GraphClient.test.ts`
- `src/microsoftGraph/ingestion/target.ts`
- `src/styles.css`

## Contract assertions

1. Typeahead waits for a short debounce interval and never queries fewer than
   two non-whitespace characters.
2. Changing the query, target type, mode, or component lifecycle aborts stale
   requests so stale results cannot replace current suggestions.
3. Each typeahead lookup issues one bounded Microsoft Graph v1.0 collection
   request for the selected target type and returns at most eight suggestions.
4. Suggestions identify the object with useful secondary text and selecting
   one writes its exact object ID into the existing investigation query.
5. The listbox supports pointer selection plus Arrow Up, Arrow Down, Enter,
   and Escape without making the input inaccessible.
6. No dependency, permission, auth, backend, graph-ingestion, or persistence
   changes are introduced.

## Validation

- `npm test -- src/microsoftGraph/client/GraphClient.test.ts src/features/investigation/QueryPanel.test.tsx`
- `npm run lint`
- `npm run build`
- `npm audit`
- `carl map`
- `carl status`

## Stop conditions

Stop if typeahead requires a backend, a Graph beta endpoint, tenant writes,
secret material, broader delegated scopes, or application permissions.

## Escalation triggers

Ask before introducing a dependency, querying multiple object types for every
keystroke, adding telemetry or persistence, or changing the SPA trust boundary.

## Context reset notes

The typeahead implementation and validation have been reconciled into durable
project documentation. This completed contract is historical evidence and does
not constrain unrelated future work.
