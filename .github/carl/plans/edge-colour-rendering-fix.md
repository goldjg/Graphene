# Edge colour rendering fix

## Status

Completed on 2026-09-26.

## Goal

Make Cytoscape relationship lines use the same colours shown by the Filters
legend.

## Scope

- Reorder existing Cytoscape edge styles so relationship-specific colours
  override the generic edge default.
- Add a focused regression test covering every explicitly coloured edge type.
- Do not change the colour palette, graph model, permissions, or dependencies.

## Contract assertions

1. Every type listed in `edgeTypeColors` is styled after the generic edge rule.
2. Line and target-arrow colours continue to use `getEdgeTypeColor`.
3. Selection and path highlighting remain the final visual overrides.
4. Unlisted relationship types continue to use the shared default gray.

## Validation

- `npm test -- --run src/graph/cytoscape/icons.test.ts`
- `npm run lint`
- `npm run build`
