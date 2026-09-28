# Current PR Contract

## Goal

Add a light theme to Graphene. The effective theme follows the operating
system colour-scheme preference by default and can be overridden by the user
to Light or Dark, with the override persisted locally. No change to the
authentication model, permission baseline, investigation semantics, or the
static-SPA trust boundary.

## Contract status

completed

## Approved scope

- A `src/theme/` module: preference types, pure storage/resolution helpers,
  a React context/provider, a `useTheme` hook, and an appearance toggle.
- Replacing hard-coded colours in `src/styles.css` with semantic CSS custom
  properties resolved through `light-dark()` and `color-scheme`.
- Making the Cytoscape stylesheet and its exported colour accessors a
  function of the resolved theme, and re-applying canvas styles on change.
- Passing the resolved theme into `FilterPanel` so the key matches the canvas.
- Media-scoped `theme-color` meta tags in `index.html`.
- A `matchMedia` stub in `src/tests/setup.ts`, since jsdom lacks it.
- Tests for the new helpers, provider, toggle, and themed stylesheet, plus
  updating `icons.test.ts` for the new stylesheet signature.
- A task-specific implementation plan under `.github/carl/plans/`.
- Follow-up: derive a light-background wordmark from the existing transparent
  source, changing only pale wordmark pixels to Graphene navy while preserving
  the icon and blue lettering, and select the asset from the resolved theme.

## Non-goals

- Changing any control behaviour, wording, or accessible name.
- Theming beyond colour; no spacing, type, motion, or density changes.
- A design-token build step, CSS preprocessor, or UI framework.
- Persisting anything other than the user's own theme choice.

## Forbidden scope

- New runtime or development dependencies.
- Delegated permissions beyond `User.Read` and `Directory.Read.All`.
- Application permissions, client secrets, certificates, or token exposure.
- Entra authorities other than `organizations`.
- Graph response logging or raw tenant data persistence.
- Persisting any tenant, directory, account, or investigation data.
- Relaxing the `netlify.toml` Content-Security-Policy, including adding
  `unsafe-inline` to `script-src` for a pre-paint theme script.
- `dangerouslySetInnerHTML`.

## Architectural constraints

- Remain a Vite + React + TypeScript static SPA with no backend.
- Resolve the system default in CSS so it is correct before JavaScript runs
  and without an inline script, preserving `script-src 'self'`.
- Mirror the existing `AuthContext` / `AuthProvider` / `useAuth` module shape.
- `useTheme` must not throw outside a provider; theme is presentation, not a
  safety property.
- Access `localStorage` defensively; unavailable or malformed storage must
  degrade to the system preference, never throw.
- Node tile colours keep their meaning across themes; only contrast-dependent
  values change.

## Files expected to change

- `.github/carl/current-pr-contract.md`
- `.github/carl/plans/light-theme.md`
- `.github/carl/memory.md`
- `README.md`
- `public/graphene-logo-light.png`
- `index.html`
- `src/main.tsx`
- `src/App.tsx`
- `src/styles.css`
- `src/tests/setup.ts`
- `src/theme/theme.ts`
- `src/theme/theme.test.ts`
- `src/theme/ThemeContext.ts`
- `src/theme/ThemeProvider.tsx`
- `src/theme/ThemeProvider.test.tsx`
- `src/theme/ThemeLogo.tsx`
- `src/theme/useTheme.ts`
- `src/theme/ThemeToggle.tsx`
- `src/graph/cytoscape/stylesheet.ts`
- `src/graph/cytoscape/GraphCanvas.tsx`
- `src/graph/cytoscape/icons.test.ts`
- `src/features/graphExplorer/FilterPanel.tsx`

## Contract assertions

1. With no stored preference, the resolved theme follows
   `prefers-color-scheme`, and it does so in CSS without any script.
2. An "Appearance" control offers exactly System, Light, and Dark; System is
   selected by default and the selected option is exposed accessibly.
3. Choosing Light or Dark sets `data-theme` on the document element to that
   value, overriding the system preference; choosing System removes the
   override and follows the media query again, including live changes.
4. The chosen preference is persisted under a single non-sensitive key and
   restored on reload; unavailable or malformed storage falls back to System
   without throwing.
5. The Cytoscape stylesheet is derived from the resolved theme: label,
   outline, border, selection, and low-contrast edge colours differ between
   themes while node type tile colours stay identical, and `FilterPanel`'s
   key uses the same accessors as the canvas.
6. No dependency, permission, auth, Graph-request, ingestion, CSP, or tenant
   data persistence change is introduced.
7. The light theme uses a high-contrast wordmark without changing the dark
   theme asset, accessible name, intrinsic dimensions, or icon colours.

## Validation

- `npm test`
- `npm run lint`
- `npm run format`
- `npm run build`

## Stop conditions

Stop if a light theme would require a new dependency, a CSP relaxation, a
change to Microsoft Graph requests or permissions, or persistence of any data
beyond the theme preference itself.

## Escalation triggers

Ask before changing existing control wording or behaviour, persisting
anything beyond the theme preference, or altering the SPA trust boundary.

## Context reset notes

Supersedes the completed landscape-controls-sidebar contract, which is
historical evidence and does not constrain this work.

All contract assertions were validated by `npm test`, `npm run lint`, and
`npm run build`, plus a production `vite preview` smoke check confirming that
`light-dark()`, the `data-theme` overrides, and the media-scoped
`theme-color` meta tags survive the build. `npm run format` reports 37
pre-existing unformatted Markdown files, unchanged from `HEAD`; every file
touched by this work passes Prettier.

The light-wordmark follow-up was validated by the full 110-test suite, lint,
Prettier on all touched text files, and a production build. Pixel-level checks
confirmed that the derived asset remains 900x325, retains the original alpha
channel, and leaves the icon region unchanged.
