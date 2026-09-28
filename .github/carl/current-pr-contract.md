# Current PR Contract

## Goal

Present the investigation control surfaces in a collapsible left sidebar on
landscape displays, without changing Graphene's authentication model,
permission baseline, investigation semantics, or static-SPA trust boundary.

## Contract status

completed

## Approved scope

- Restructure `GraphExplorer` so the query, toolbar, filter, and analysis
  controls live inside a labelled, collapsible controls region.
- Responsive CSS that places the controls region to the left of the graph
  stage on landscape displays and collapses it to a narrow rail.
- Focused `GraphExplorer` tests for disclosure behaviour.
- A task-specific implementation plan under `.github/carl/plans/`.
- Amendment: stabilise the hoisted `useAuth` mock in
  `GraphExplorer.test.tsx`. The existing mock returned a fresh object per
  render, which made `QueryPanel`'s typeahead effect loop until the Node
  heap was exhausted, so the file could not be validated at all.

## Non-goals

- Changing any control's behaviour, wording, or accessible name.
- Persisting sidebar state, adding animations, or adding a UI framework.
- Changing graph ingestion, analysis, filtering, or export behaviour.
- A backend, persistent tenant data, telemetry, or new dependencies.

## Forbidden scope

- Delegated permissions beyond `User.Read` and `Directory.Read.All`.
- Application permissions, client secrets, certificates, or token exposure.
- Entra authorities other than `organizations`.
- Graph response logging or raw tenant data persistence.
- `dangerouslySetInnerHTML`.

## Architectural constraints

- Remain a Vite + React + TypeScript static SPA.
- Presentation-only change; no Microsoft Graph or ingestion code is touched.
- Use native CSS media queries and grid; no layout dependency.
- Use native disclosure semantics so collapsed controls leave the
  accessibility tree rather than being visually hidden only.

## Files expected to change

- `.github/carl/current-pr-contract.md`
- `.github/carl/plans/landscape-controls-sidebar.md`
- `.github/carl/memory.md`
- `README.md`
- `src/features/graphExplorer/GraphExplorer.tsx`
- `src/features/graphExplorer/GraphExplorer.test.tsx`
- `src/styles.css`

## Contract assertions

1. The control surfaces are wrapped in a single region with the accessible
   name "Investigation controls".
2. A toggle button exposes `aria-expanded` and `aria-controls` for that
   region, and the region starts expanded.
3. Collapsing the region removes the query, toolbar, filter, and analysis
   controls from the accessibility tree; expanding restores them.
4. On landscape viewports at or above 60rem wide, the controls region renders
   as a left column beside the graph stage; narrower or portrait viewports
   keep the stacked layout.
5. `GraphExplorer.test.tsx` completes instead of exhausting the Node heap.
6. No dependency, permission, auth, Graph-request, ingestion, or persistence
   changes are introduced.

## Validation

- `npm test -- src/features/graphExplorer/GraphExplorer.test.tsx`
- `npm run lint`
- `npm run build`

## Stop conditions

Stop if the layout change would require a new dependency, a change to Graph
requests or permissions, or removal of an existing control.

## Escalation triggers

Ask before persisting UI state, changing control wording or behaviour, or
altering the SPA trust boundary.

## Context reset notes

All contract assertions were validated by `npm test`, `npm run lint`, and
`npm run build`. Previous completed contract (object-search typeahead) is historical evidence
and does not constrain this work.
