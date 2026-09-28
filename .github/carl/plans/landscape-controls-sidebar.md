# Plan: collapsible landscape controls sidebar

## Goal

On landscape displays, present the investigation control surfaces (query,
toolbar, filters, analysis) in a collapsible sidebar on the left of the graph
stage, instead of stacking them above the canvas.

## Constraints

- Presentation-only change. No auth, permission, Graph, ingestion, or
  persistence changes.
- No new dependencies.
- Preserve existing accessible names, roles, and control behaviour.
- Keep the portrait/narrow stacked layout working.

## Approach

1. Wrap the control surfaces in `GraphExplorer` inside an `aside` labelled
   "Investigation controls" containing a disclosure button and a content
   region.
2. Track disclosure state in local component state, defaulting to expanded so
   controls remain discoverable and existing behaviour is unchanged on load.
3. Use `aria-expanded` plus `aria-controls` on the toggle and the `hidden`
   attribute on the content region so collapsing removes controls from the
   accessibility tree rather than merely hiding them visually.
4. Add CSS that switches `.graph-explorer-layout` to a two-column grid only
   under `(orientation: landscape) and (width >= 60rem)`; when collapsed the
   sidebar column shrinks to the toggle width so the canvas gains space.
5. Keep `.graph-explorer-body` (stage + details) unchanged.

## Validation

- `npm test -- src/features/graphExplorer/GraphExplorer.test.tsx`
- `npm run lint`
- `npm run build`
