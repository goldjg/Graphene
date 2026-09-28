# Plan: light theme with system default and explicit override

## Status

completed

## Goal

Give Graphene a first-class light theme alongside the existing dark theme.
The effective theme follows the operating-system colour-scheme preference by
default, and the user can override it to Light or Dark from an in-app
control. The override persists across reloads.

No authentication, permission, Microsoft Graph, ingestion, analysis, or
filtering behaviour changes.

## Why this shape

Graphene's palette is currently a set of hard-coded dark hex values spread
across `src/styles.css`, plus a second hard-coded palette inside the
Cytoscape stylesheet (`src/graph/cytoscape/stylesheet.ts`). A light theme is
therefore two problems:

1. **CSS surfaces.** Solved by replacing literal colours with semantic CSS
   custom properties whose values use the CSS `light-dark()` function. A
   single token declaration then covers both themes, `color-scheme` drives
   which side is used, and the system default works before any JavaScript
   runs. That matters here because `netlify.toml` sets
   `script-src 'self'`, so the usual pre-paint inline theme script is not
   available and a CSS-resolved default is the only flash-free option.

2. **Canvas surfaces.** Cytoscape styles are JavaScript values, not CSS, so
   they cannot use custom properties. The stylesheet becomes a function of
   the resolved theme and the canvas re-applies it when the theme changes.
   Node tile colours stay stable (they carry meaning); only the contrast-
   dependent values change: label colour, label outline/background, node
   border, selection/highlight colour, and edge colours that are unreadable
   on a light background.

The resolved theme is also needed in JavaScript for the canvas, so a small
`ThemeProvider` owns preference state, resolves `system` through
`matchMedia`, mirrors the result onto `document.documentElement`, and exposes
it through a `useTheme()` hook. This mirrors the existing
`AuthContext`/`AuthProvider`/`useAuth` module shape.

Unlike `useAuth`, `useTheme` falls back to a static dark value outside a
provider rather than throwing. Theme is presentation, not a safety property,
and a missing provider must not break rendering.

## Non-goals

- Changing any existing control's behaviour, wording, or accessible name.
- Theming anything beyond colour (no spacing, type, motion, or density work).
- A design-token build step, CSS preprocessor, or UI framework.
- New dependencies.
- Persisting anything other than the user's own theme choice.

## Steps

1. Add `src/theme/theme.ts` with the `ThemePreference` / `ResolvedTheme`
   types and pure, storage-injectable read/write/resolve helpers.
2. Add `src/theme/ThemeContext.ts`, `ThemeProvider.tsx`, and `useTheme.ts`.
3. Add `src/theme/ThemeToggle.tsx`: a radio group named "Appearance" with
   System, Light, and Dark options.
4. Tokenise `src/styles.css` onto semantic custom properties using
   `light-dark()`, and set `color-scheme` from `data-theme`.
5. Make the Cytoscape stylesheet and its colour accessors theme-aware, and
   re-apply the stylesheet in `GraphCanvas` when the resolved theme changes.
6. Pass the resolved theme into `FilterPanel`'s key swatches so the legend
   matches the canvas.
7. Mount `ThemeProvider` in `src/main.tsx` and render `ThemeToggle` in the
   app hero.
8. Add media-scoped `theme-color` meta tags in `index.html`.
9. Stub `matchMedia` in `src/tests/setup.ts` (jsdom does not implement it).
10. Tests for the pure helpers, the provider/toggle behaviour, and the
    themed stylesheet.
11. Update `README.md` and `.github/carl/memory.md`.

## Validation

- `npm test`
- `npm run lint`
- `npm run format`
- `npm run build`

## Risks

- `light-dark()` requires a 2024-era browser (Chrome 123, Safari 17.5,
  Firefox 120). Consistent with the existing use of CSS media range syntax
  and `rgb(... / %)`, but it does raise the floor.
- Theme values are hand-checked for contrast, not automatically verified.

## Light-wordmark contrast follow-up

A deployed mobile screenshot showed that the original wordmark's white
"Graph" lettering disappears against the light hero background. Add
`public/graphene-logo-light.png`, derived from the transparent dark-theme
asset by remapping only its pale wordmark pixels to Graphene navy. Preserve
the icon, blue lettering, alpha channel, dimensions, and dark-theme asset.
`App` selects the asset from `resolvedTheme`; the `<h1>`, image alt text, and
intrinsic dimensions remain unchanged.
