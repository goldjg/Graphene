# Node icon rendering fix

## Status

Completed on 2026-09-26.

## Goal

Make the existing node-type SVG badges render reliably inside Cytoscape's
canvas, including mobile Safari, without changing icon semantics or adding a
dependency.

## Scope

- Add intrinsic dimensions to generated SVG images.
- Use a canvas-compatible base64 SVG data URI.
- Update focused icon tests and durable documentation only if behavior or
  constraints change.

## Contract assertions

1. Every graph node type still has a distinct icon.
2. The same icon source continues to render in the Filters legend and the
   Cytoscape canvas.
3. Icon data remains repository-authored, inline, and compatible with the
   existing `img-src 'self' data:` CSP.
4. No Graph permissions, endpoints, dependencies, or graph semantics change.

## Validation

- `npm test -- --run src/graph/cytoscape/icons.test.ts`
- `npm run lint`
- `npm run build`

## Risks

SVG images used by a canvas renderer depend on browser image decoding rather
than ordinary CSS background rendering. Intrinsic dimensions and a base64 data
URI avoid the zero-size and URL parsing behavior seen on mobile browsers.
