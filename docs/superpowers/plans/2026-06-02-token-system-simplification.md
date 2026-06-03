# Token System Simplification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the dead Figma sync pipeline and preview theme system, and make `vuetify.ts` the single source of truth for all color hex values.

**Architecture:** Delete 13 files (scripts, config, JSON exports, `.figma.ts` files, preview CSS, preview composable). Convert `--claro-*` color entries in `tokens.css` from hardcoded hex to `rgb(var(--v-theme-*))` aliases so components need zero changes. Remove `previewCluelyTheme` from `vuetify.ts` and its wiring from `App.vue` and `main.ts`.

**Tech Stack:** Vue 3, Vuetify 4, CSS custom properties, TypeScript

---

### Task 1: Delete Figma pipeline files

**Files:**
- Delete: `scripts/export-tokens.mjs`
- Delete: `scripts/import-tokens.mjs`
- Delete: `scripts/figma-token-map.mjs`
- Delete: `figma.config.json`
- Delete: `tokens/Primitives.json`
- Delete: `tokens/Domain.json`
- Delete: `src/components/dumb/shared/ClaroWordmark.figma.ts`
- Delete: `src/components/dumb/shared/ConfirmationDialog.figma.ts`
- Delete: `src/components/dumb/shared/ErrorAlert.figma.ts`
- Delete: `src/components/dumb/shared/LoadingSpinner.figma.ts`
- Delete: `src/components/dumb/shared/PropertyCard.figma.ts`
- Delete: `src/components/dumb/shared/StatCard.figma.ts`
- Delete: `src/components/dumb/shared/TurnPriorityBadge.figma.ts`

- [ ] **Step 1: Delete all Figma pipeline files**

```bash
cd C:/Users/soren/claro4
rm scripts/export-tokens.mjs scripts/import-tokens.mjs scripts/figma-token-map.mjs
rm figma.config.json
rm tokens/Primitives.json tokens/Domain.json
rm src/components/dumb/shared/ClaroWordmark.figma.ts
rm src/components/dumb/shared/ConfirmationDialog.figma.ts
rm src/components/dumb/shared/ErrorAlert.figma.ts
rm src/components/dumb/shared/LoadingSpinner.figma.ts
rm src/components/dumb/shared/PropertyCard.figma.ts
rm src/components/dumb/shared/StatCard.figma.ts
rm src/components/dumb/shared/TurnPriorityBadge.figma.ts
```

- [ ] **Step 2: Remove the now-empty tokens/ directory**

```bash
rmdir tokens
```

- [ ] **Step 3: Verify files are gone**

```bash
ls scripts/ src/components/dumb/shared/*.figma.ts 2>&1
Test-Path tokens
```

Expected: `scripts/` contains only non-token files; `tokens/` path returns `False`; no `.figma.ts` files found.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "chore: delete Figma sync pipeline (scripts, JSON exports, Code Connect files)"
```

---

### Task 2: Remove dead package.json scripts

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove the 6 dead scripts from package.json**

Open `package.json` and delete these lines from the `"scripts"` section:

```json
"tokens:export": "node scripts/export-tokens.mjs",
"tokens:import": "node scripts/import-tokens.mjs",
"tokens:preview": "node scripts/export-tokens.mjs && cat tokens/*.json",
"figma:connect": "figma connect",
"figma:publish": "figma connect publish",
"figma:unpublish": "figma connect unpublish",
```

- [ ] **Step 2: Remove @figma/code-connect from devDependencies**

```bash
pnpm remove @figma/code-connect
```

Expected: package removed, lockfile updated.

- [ ] **Step 3: Verify the scripts section and devDependencies are clean**

```bash
grep -E "tokens:|figma:" package.json
```

Expected: no output (all removed).

- [ ] **Step 4: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "chore: remove dead tokens:export/import and figma:* scripts, uninstall @figma/code-connect"
```

---

### Task 3: Remove preview theme system

**Files:**
- Delete: `src/styles/preview-cluely.css`
- Delete: `src/composables/shared/usePreviewTheme.ts`
- Modify: `src/main.ts` (remove CSS import)
- Modify: `src/App.vue` (remove composable import and call)
- Modify: `src/plugins/vuetify.ts` (remove `previewCluelyTheme`)

- [ ] **Step 1: Delete the preview CSS and composable**

```bash
rm src/styles/preview-cluely.css
rm src/composables/shared/usePreviewTheme.ts
```

- [ ] **Step 2: Remove the CSS import from src/main.ts**

Find and remove this line in `src/main.ts`:

```typescript
import '@/styles/preview-cluely.css'
```

- [ ] **Step 3: Remove usePreviewTheme from src/App.vue**

In `src/App.vue` `<script setup>`, remove these two lines:

```typescript
import { usePreviewTheme } from '@/composables/shared/usePreviewTheme'

usePreviewTheme()
```

- [ ] **Step 4: Remove previewCluelyTheme from src/plugins/vuetify.ts**

In `src/plugins/vuetify.ts`:

1. Remove the import of `ThemeDefinition` if it's only used by `previewCluelyTheme` (check — it's also used by `lightTheme` and `darkTheme`, so keep it).

2. Delete the entire `previewCluelyTheme` const block (lines that define `const previewCluelyTheme: ThemeDefinition = { ... }`).

3. In the `createVuetify({ theme: { themes: { ... } } })` call, remove the `previewCluely: previewCluelyTheme` line.

The `themes` object should end up as:
```typescript
themes: {
  light: lightTheme,
  dark: darkTheme,
},
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm build:fast
```

Expected: clean build, no errors about missing `usePreviewTheme` or `previewCluelyTheme`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove preview theme system (preview-cluely.css, usePreviewTheme, previewCluelyTheme)"
```

---

### Task 4: Convert color tokens to CSS aliases

**Files:**
- Modify: `src/styles/tokens.css`

The colors in `tokens.css` that have a matching Vuetify theme key get converted from hex values to `rgb(var(--v-theme-*))` aliases. Colors that are NOT in Vuetify themes (tonals, fg scale, property accents, borders) stay as-is.

- [ ] **Step 1: Replace the color section header comment and convert Primary Palette tokens**

Replace this block in `src/styles/tokens.css`:

```css
/**
 * tokens.css — Design Token Single Source of Truth
 *
 * Two-Way Sync Protocol (Pencil MCP):
 * These tokens are bootstrapped from src/plugins/vuetify.ts theme values.
 * In sessions where Pencil MCP is available, run the sync to pull live
 * computed values from the browser and update the hex values here.
 * Conversely, editing a token here and re-syncing will propagate the
 * change back into Vuetify's runtime theme via CSS custom property
 * overrides. Never edit hex values in two places — always treat this
 * file as the canonical source and vuetify.ts as the registration point.
 *
 * Prefix convention: all properties use --claro- to avoid collisions
 * with Vuetify's own --v- namespace.
 */
```

With:

```css
/**
 * tokens.css — Non-Color Design Tokens + Color Aliases
 *
 * COLOR SOURCE OF TRUTH: src/plugins/vuetify.ts
 * Color tokens here are aliases to Vuetify theme vars — edit hex values
 * in vuetify.ts only. Vuetify registers them as --v-theme-* RGB tuples;
 * these aliases wrap them in rgb() for direct CSS use.
 *
 * NON-COLOR TOKENS (spacing, typography, radii, motion, shadows, layout)
 * live here exclusively — no Vuetify equivalent exists for them.
 *
 * Prefix convention: --claro-* avoids collision with Vuetify's --v-* namespace.
 */
```

- [ ] **Step 2: Convert Primary Palette color tokens to aliases**

Replace:

```css
  /* ─── Colors: Primary Palette ─────────────────────────────────────── */
  --claro-primary:        #7367F0;
  --claro-primary-light:  #9E95F5;
  --claro-primary-dark:   #5E52EE;
  --claro-primary-tint:   #F0EEFF;
  --claro-secondary:      #A8AAAE;
  /* 12.5% tint for soft backgrounds / overlays (CSS-side only — the
     Vuetify theme has no `accent` semantic; consumers read this var
     directly). */
  --claro-accent:         rgba(115, 103, 240, 0.125);
  --claro-on-primary:     #FFFFFF;
```

With:

```css
  /* ─── Colors: Primary Palette ─────────────────────────────────────── */
  --claro-primary:        rgb(var(--v-theme-primary));
  --claro-primary-light:  rgb(var(--v-theme-primary-light));
  --claro-primary-dark:   rgb(var(--v-theme-primary-dark));
  --claro-primary-tint:   #F0EEFF;
  --claro-secondary:      rgb(var(--v-theme-secondary));
  --claro-accent:         rgba(115, 103, 240, 0.125);
  --claro-on-primary:     #FFFFFF;
```

- [ ] **Step 3: Convert Surface color tokens to aliases**

Replace:

```css
  /* ─── Colors: Surfaces ────────────────────────────────────────────── */
  --claro-background:      #F5F5F9;
  --claro-surface:         #FFFFFF;
  --claro-surface-variant: #F5F5F9;
  --claro-card-bg:         #FFFFFF;
```

With:

```css
  /* ─── Colors: Surfaces ────────────────────────────────────────────── */
  --claro-background:      rgb(var(--v-theme-background));
  --claro-surface:         rgb(var(--v-theme-surface));
  --claro-surface-variant: rgb(var(--v-theme-surface-variant));
  --claro-card-bg:         rgb(var(--v-theme-card-bg));
```

- [ ] **Step 4: Convert Semantic color tokens to aliases**

Replace:

```css
  /* ─── Colors: Semantic ────────────────────────────────────────────── */
  --claro-success: #28C76F;
  --claro-warning: #FF9F43;
  --claro-error:   #EA5455;
  --claro-info:    #00CFE8;
```

With:

```css
  /* ─── Colors: Semantic ────────────────────────────────────────────── */
  --claro-success: rgb(var(--v-theme-success));
  --claro-warning: rgb(var(--v-theme-warning));
  --claro-error:   rgb(var(--v-theme-error));
  --claro-info:    rgb(var(--v-theme-info));
```

- [ ] **Step 5: Convert Domain color tokens to aliases**

Replace:

```css
  /* ─── Colors: Domain-Specific ─────────────────────────────────────── */
  --claro-turn-urgent:       #EA5455;
  --claro-turn-standard:     #FF9F43;
  --claro-booking-standard:  #28C76F;
```

With:

```css
  /* ─── Colors: Domain-Specific ─────────────────────────────────────── */
  --claro-turn-urgent:       rgb(var(--v-theme-turn-urgent));
  --claro-turn-standard:     rgb(var(--v-theme-turn-standard));
  --claro-booking-standard:  rgb(var(--v-theme-booking-standard));
```

- [ ] **Step 6: Convert Divider color token to alias**

Replace:

```css
  --claro-divider:        #E8E8E8;
```

With:

```css
  --claro-divider:        rgb(var(--v-theme-divider));
```

- [ ] **Step 7: Verify the file has no remaining duplicate hex values**

```bash
grep -n "#7367F0\|#9E95F5\|#5E52EE\|#A8AAAE\|#F5F5F9\|#FFFFFF\|#28C76F\|#FF9F43\|#EA5455\|#00CFE8\|#E8E8E8" src/styles/tokens.css
```

Expected: no output. If any remain, they're either tonal/fg/prop/border tokens — check the token name to confirm they don't have a Vuetify equivalent.

- [ ] **Step 8: Verify build passes**

```bash
pnpm build:fast
```

Expected: clean build with no CSS variable errors.

- [ ] **Step 9: Commit**

```bash
git add src/styles/tokens.css
git commit -m "refactor(tokens): convert color entries to rgb(var(--v-theme-*)) aliases"
```

---

### Task 5: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Remove deleted script references from the Commands section**

In `CLAUDE.md`, find the Commands section and remove these lines:

```markdown
pnpm tokens:export          # Export tokens to tokens/*.json
pnpm tokens:import          # Import tokens from tokens/*.json into CSS/SCSS

# Figma Code Connect
pnpm figma:connect          # Verify Code Connect links
pnpm figma:publish          # Publish Code Connect stories to Figma
```

- [ ] **Step 2: Update the token system description in Gotchas or wherever referenced**

Find any mention of `figma-token-map`, `.figma.ts`, `tokens/*.json`, `previewCluely`, `usePreviewTheme`, or "two-way sync" and remove those references.

Also update the Figma Code Connect section if present — remove the `pnpm figma:connect` / `pnpm figma:publish` description entirely.

Update the token system description to reflect the new architecture:
- `src/plugins/vuetify.ts` — single source of truth for all color hex values
- `src/styles/tokens.css` — spacing, typography, radii, motion, shadows, layout + CSS aliases for colors

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(CLAUDE.md): remove Figma pipeline references, update token system description"
```

---

### Task 6: Verify end-to-end

- [ ] **Step 1: Start the dev server and spot-check visually**

```bash
pnpm dev
```

Open http://localhost:5173 and check:
- Owner overview page loads with correct colors
- Admin dashboard loads with correct colors
- Calendar page renders correctly
- Dark mode toggle still works (Vuetify theme switch)

- [ ] **Step 2: Run the full test suite**

```bash
pnpm test:run
```

Expected: all tests pass.

- [ ] **Step 3: Run a full production build**

```bash
pnpm build
```

Expected: TypeScript type check passes, Vite build completes with no errors.

- [ ] **Step 4: Push**

```bash
git push origin main
```
