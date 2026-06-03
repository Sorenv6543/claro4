# Design Token System Simplification

**Date:** 2026-06-02  
**Status:** Approved

## Context

The current token system has unnecessary complexity: a bidirectional Figma sync pipeline (export/import scripts, JSON files, Code Connect) that was never fully wired up (placeholder Figma node IDs), and a dual-source color problem where hex values live in both `tokens.css` and `vuetify.ts` and must be kept in sync manually. A preview theme overlay (`preview-cluely.css`) was used to test a third-party design system that is no longer needed since the codebase is being restyled from scratch.

The goal is to reduce the system to two non-overlapping sources of truth and remove all dead tooling.

---

## Target Architecture

| File | Owns |
|------|------|
| `src/plugins/vuetify.ts` | All color hex values (light + dark themes) |
| `src/styles/tokens.css` | Spacing, typography, radii, motion, shadows, layout dims — plus CSS aliases for colors pointing to Vuetify theme vars |
| `src/styles/main.scss` | Global styles consuming the above |
| `src/styles/calendar-tokens.css` | FullCalendar overrides — unchanged |
| `src/styles/responsive.scss` | Layout utilities — unchanged |

**Color alias pattern in `tokens.css`:**
```css
--claro-primary:    rgb(var(--v-theme-primary));
--claro-success:    rgb(var(--v-theme-success));
--claro-warning:    rgb(var(--v-theme-warning));
--claro-error:      rgb(var(--v-theme-error));
--claro-background: rgb(var(--v-theme-background));
--claro-surface:    rgb(var(--v-theme-surface));
/* etc. for all --claro-color-* entries */
```

Components continue using `var(--claro-primary)` unchanged — the alias resolves through Vuetify's theme vars at runtime. Zero component changes required.

---

## What Gets Deleted

### Scripts
- `scripts/export-tokens.mjs`
- `scripts/import-tokens.mjs`
- `scripts/figma-token-map.mjs`

### Config / Data
- `figma.config.json`
- `tokens/Primitives.json`
- `tokens/Domain.json`

### Figma Code Connect
- `src/components/dumb/shared/ClaroWordmark.figma.ts`
- `src/components/dumb/shared/ConfirmationDialog.figma.ts`
- `src/components/dumb/shared/PropertyCard.figma.ts`
- `src/components/dumb/shared/StatCard.figma.ts`
- `src/components/dumb/shared/TurnPriorityBadge.figma.ts`
- `src/components/dumb/shared/LoadingSpinner.figma.ts`
- `src/components/dumb/shared/ErrorAlert.figma.ts`

### Preview Theme
- `src/styles/preview-cluely.css`

---

## What Gets Modified

### `package.json` — remove scripts
- `tokens:export`
- `tokens:import`
- `tokens:preview`
- `figma:connect`
- `figma:publish`
- `figma:unpublish`

### `src/styles/tokens.css`
Convert all `--claro-*` color entries from hardcoded hex values to `rgb(var(--v-theme-*))` aliases. All non-color tokens (spacing, typography, radii, motion, shadows, layout) remain unchanged.

### `CLAUDE.md`
Remove references to the deleted pipeline (tokens:export/import, figma:connect/publish, figma-token-map, .figma.ts files, Code Connect).

### `src/composables/shared/usePreviewTheme.ts`
Delete entirely. Also remove its usage from `src/App.vue` and `src/main.ts` (both import and wire it up).

### `src/plugins/vuetify.ts`
Remove `previewCluelyTheme` definition and its registration (was only used by the preview system).

---

## What Stays the Same

- All Vue components (`--claro-*` usage continues to resolve correctly via aliases)
- `src/styles/calendar-tokens.css` (uses `--v-theme-*` directly, unaffected)
- `src/styles/responsive.scss` (no token dependency)
- `src/styles/main.scss` (consumes `--claro-*` tokens, still works via aliases)
- `src/layouts/ownerThemes.ts` and owner theme system (separate, unaffected)
- Light and dark Vuetify themes (kept as-is, colors unchanged)

---

## Verification

1. `pnpm dev` — app loads, no console errors
2. Spot-check: owner overview, admin dashboard, calendar page render correctly with correct colors
3. `pnpm build` — clean TypeScript build, no missing import errors from deleted files
4. `pnpm test:run` — existing tests pass
5. Dark mode toggle still works (Vuetify theme switch)
