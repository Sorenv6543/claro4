# AI Component Lab — Design Spec

**Date:** 2026-03-13
**Branch:** `ui-mockups` (`C:/Users/Soren/claro4-ui-mockups`)
**Status:** Approved, pending implementation

---

## Overview

A file-drop component lab at `/lab` in the `ui-mockups` worktree. Claude writes `.vue` files into `src/ai-mockups/`, Vite HMR reloads them instantly, and the lab shell renders the selected component with the real app theme and Vuetify + Tailwind available. Sits alongside the existing `/dev/demos` component browser — `/dev/demos` shows the real app's demo files; `/lab` is the scratch space.

---

## Goals

- Zero-friction loop: ask Claude → file appears → see it rendered
- Real app styling (Vuetify 4 theme tokens, MDI icons, existing dumb components)
- Tailwind utilities available for mockup flexibility without Vuetify conflicts
- Dev-only: blocked in production by `developmentGuard`
- No auth required

---

## Out of Scope (v1)

- Browser-based code editor (Monaco/CodeMirror)
- One-click promote button (Claude handles file promotion via chat)
- Drag-and-drop visual builder
- Export/deploy pipeline

---

## Structure

```
src/
  ai-mockups/                 ← must exist before first pnpm dev run
    _README.md                ← Claude reads this for project context
    example.vue               ← starter file; lab shows this on first open

src/pages/lab/
  index.vue                   ← AiLab shell component

src/styles/
  tailwind.css                ← @tailwind base (minus preflight) / components / utilities

src/layouts/
  bare.vue                    ← <v-app><router-view /></v-app> (cherry-pick from main or recreate)

vite-plugins/
  lab-promote.ts              ← (v2 placeholder) Vite plugin for promote endpoint

tailwind.config.js            ← content scoped to ai-mockups + pages/lab only
postcss.config.js
```

---

## Router Guards

Two guard changes are required:

**`authGuard` in `src/router/guards.ts`** — extend the early-return to skip Supabase auth for `/lab`:
```ts
if (to.path.startsWith('/dev') || to.path.startsWith('/lab')) return next()
```

**`developmentGuard` in `src/router/guards.ts`** — extend the production-block to include `/lab`:
```ts
if ((to.path.startsWith('/dev') || to.path.startsWith('/lab')) && import.meta.env.PROD) {
  next('/404')
  return
}
```

Without these changes, `/lab` is reachable in production and still triggers the Supabase auth check.

---

## AiLab Shell (`src/pages/lab/index.vue`)

**Layout:**
- Left sidebar, 280px, permanent
- Header: "AI Lab" title + "DEV" chip
- Sidebar list: auto-discovered files from `src/ai-mockups/**/*.vue` via `import.meta.glob`, grouped by subfolder
- Last-selected component persisted in `localStorage` (key: `lab:selected`)
- Main area: renders selected component via `defineAsyncComponent` (lazy)
- **Error boundary:** use `onErrorCaptured` in `<script setup>` to catch render/mount errors from the dynamically-loaded component. Maintain a `currentError` ref; when set, render an error card showing the message instead of the component. Note: `defineAsyncComponent`'s built-in `errorComponent` option only catches load-time errors — `onErrorCaptured` is required for runtime/mount errors.
- Toolbar above preview: component name + file path chip
- **Empty state:** when `src/ai-mockups/` contains no `.vue` files, show a placeholder card instructing the user to ask Claude to generate a component

**Route:**
```ts
{
  path: '/lab',
  name: 'lab',
  component: () => import('@/pages/lab/index.vue'),
  meta: { layout: 'bare', demo: true }
}
```

**Auth:** none — `authGuard` short-circuits for `/lab` paths (see Router Guards above).

---

## TypeScript Configuration

Add `src/ai-mockups` and `src/pages/lab` to `tsconfig.json` `exclude` so that in-progress mockup files do not break `pnpm build` (which runs `vue-tsc --noEmit`):

```json
{
  "exclude": [
    "src/ai-mockups",
    "src/pages/lab"
  ]
}
```

This is required. Without it, any TypeScript error in a mockup file will break the production build.

---

## Tailwind Configuration

**ESM note:** The project uses `"type": "module"` in `package.json` (standard Vite setup). Config files using `export default` in `.js` files are valid. If in doubt, use `.mjs` extension for both config files.

**`tailwind.config.js`:**
```js
export default {
  content: [
    './src/ai-mockups/**/*.vue',
    './src/pages/lab/**/*.vue',
  ],
  corePlugins: {
    preflight: false,   // prevents fighting Vuetify's CSS reset
  },
}
```

**`postcss.config.js`:**
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

**Import in `main.ts`** — add one line after the existing `main.scss` import. Do NOT add a second `vuetify/styles` import — it is already handled by `vite-plugin-vuetify` via `styles.configFile`:

```ts
// existing:
import './styles/main.scss'
// add after:
import './styles/tailwind.css'
```

Tailwind's `content` is scoped only to `src/ai-mockups/` and `src/pages/lab/` — it does not scan the rest of the app, keeping the bundle clean.

---

## `src/ai-mockups/_README.md`

A markdown file that Claude reads at the start of any lab session. Contains:

- **Available dumb components** — list of `src/components/dumb/shared/` components with their props
- **Vuetify theme color tokens** — `primary`, `secondary`, `error`, `warning`, `success`, `info`, `turn-urgent`, `turn-standard`, `booking-standard`
- **Design conventions** — `elevation="2"`, `rounded="lg"`, `variant="outlined"`, density defaults
- **Import patterns** — how to import from `@components`, `@stores`, `@utils`
- **Tailwind guidance** — use utilities for layout/spacing in mockups; use Vuetify tokens for color

---

## `ui-designer` Skill

A Claude Code custom command stored at `.claude/commands/ui-designer.md`. Loaded via `/ui-designer` at the start of a lab session.

**Instruction set:**
- Stack: Vue 3 `<script setup lang="ts">`, Vuetify 4, Tailwind CSS (no preflight)
- Write output files to `src/ai-mockups/`
- Read `src/ai-mockups/_README.md` for available components and tokens before generating
- Use existing dumb components (`ConfirmationDialog`, `LoadingSpinner`, `ErrorAlert`, etc.) rather than reimplementing
- Use Vuetify semantic color tokens — never hardcode hex values
- Mobile-first, accessible (proper landmarks, labels, focus states)
- Full `.vue` SFC output with imports
- Mention any new files created

---

## Workflow

1. Open `http://localhost:3000/lab`
2. Ask Claude (with `/ui-designer` command loaded): *"Build a booking dashboard card — property name, time window, status badge, action buttons"*
3. Claude reads `_README.md`, writes `src/ai-mockups/BookingDashboardCard.vue`
4. File appears in sidebar, HMR reloads, component renders
5. Iterate: *"Make it more compact on mobile"* / *"Add a loading state"* / *"Refactor into sub-components"*
6. When satisfied: *"Promote `BookingDashboardCard.vue` to `src/components/dumb/owner/`"* — Claude copies, fixes imports, deletes original

---

## Implementation Order

1. Verify `package.json` has `"type": "module"` (or use `.mjs` for config files)
2. Install Tailwind + PostCSS: `pnpm add -D tailwindcss postcss autoprefixer`
3. Create `tailwind.config.js` and `postcss.config.js`
4. Create `src/styles/tailwind.css` and add `import './styles/tailwind.css'` to `main.ts` after `main.scss`
5. Add `src/ai-mockups` and `src/pages/lab` to `tsconfig.json` `exclude`
6. Cherry-pick or recreate `src/layouts/bare.vue` from `main` branch (content: `<template><v-app><router-view /></v-app></template>`)
7. Add `'bare'` to `RouteMeta.layout` union in `src/types/router.ts` (cherry-pick from `main` or add manually)
8. Register `BareLayout` in `App.vue` `layouts` map (cherry-pick from `main` or add manually)
9. Update `authGuard` and `developmentGuard` in `src/router/guards.ts` to cover `/lab` (see Router Guards section)
10. Add `/lab` route to `src/router/index.ts` with `meta: { layout: 'bare', demo: true }`
11. Create `src/ai-mockups/example.vue` (starter file — must exist before `pnpm dev` first run)
12. Create `src/ai-mockups/_README.md`
13. Create `src/pages/lab/index.vue` (AiLab shell with `onErrorCaptured`, `localStorage` persistence, empty state)
14. Create `.claude/commands/ui-designer.md`
15. Verify: `pnpm dev` → navigate to `/lab` → sidebar shows `example.vue` → renders correctly → error in a component shows error card, not crash
