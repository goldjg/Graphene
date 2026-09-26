# Plan: Graphene branding assets

## Goal

Introduce the supplied Graphene wordmark logo and node-graph glyph as
first-class repository assets, wire them into the SPA shell and README, and
generate correctly sized favicon/app-icon variants.

## Background

The repository previously shipped no branding assets. `index.html` declared no
`<link rel="icon">`, so browsers fell back to a default favicon, and the hero
heading rendered the product name as plain text.

Two source images were supplied as large JPEGs (1448x1086 wordmark,
1254x1254 glyph) with generous dead margin and embedded EXIF metadata. Neither
was suitable for direct use.

## Approach

1. Trim the dead margin from the wordmark, downscale to 900px wide, and store
   it as `public/graphene-logo.png`.
2. Centre the glyph inside a square crop of the original artwork and derive a
   512px master as `public/graphene-icon.png`.
3. Derive sized icon variants from that master:
   - `favicon.ico` (16/32/48 multi-resolution)
   - `favicon-16x16.png`, `favicon-32x32.png`
   - `favicon-192x192.png` for Android home screens
   - `apple-touch-icon.png` at 180x180 for iOS home screens
4. Declare the icon variants and a `theme-color` in `index.html`.
5. Render the wordmark inside the existing hero `<h1>` with `alt="Graphene"`,
   preserving the accessible name used by `aria-labelledby="graphene-title"`.
6. Add the wordmark to the top of `README.md`.

## Notes and constraints

- Assets are static, same-origin files. The `img-src 'self' data:` CSP in
  `netlify.toml` already permits them, so no header change is required.
- Large gradient artwork compresses poorly as full-colour PNG. The larger
  variants are palette-quantized with dithering, which roughly halves their
  size with no visible banding at display sizes.
- Re-encoding through Pillow strips the EXIF metadata carried by the source
  JPEGs.
- The artwork carries its own near-black backdrop. The hero applies
  `mix-blend-mode: screen` so that backdrop merges into the hero gradient
  instead of showing a rectangular seam.
- Pillow was used as a local, one-off authoring tool. It is not added to the
  project's dependency manifests.

## Non-goals

- A web app manifest or installable PWA behaviour.
- Replacing the Cytoscape node badge icons, which remain generated SVG.
- Any change to authentication, Microsoft Graph scopes, or ingestion.
