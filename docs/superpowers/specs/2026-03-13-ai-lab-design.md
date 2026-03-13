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
  ai-mockups/
    _README.md            ← Claude reads this for project context
    example.vue           ← starter file; lab shows this on first open

src/pages/lab/
  index.vue               ← AiLab shell component

src/styles/
  tailwind.css            ← @tailwind base (minus preflight) / components / utilities

vite-plugins/
  lab-promote.ts          ← (v2 placeholder) Vite plugin for promote endpoint

tailwind.config.js        ← content scoped to ai-mockups + pages/lab only
postcss.config.js
```

---

## AiLab Shell (`src/pages/lab/index.vue`)

**Layout:**
- Left sidebar, 280px, permanent
- Header: "AI Lab" title + "DEV" chip
- Sidebar list: auto-discovered files from `src/ai-mockups/**/*.vue` via `import.meta.glob`, grouped by subfolder
- Last-selected component persisted in `localStorage` (key: `lab:selected`)
- Main area: renders selected component via `defineAsyncComponent` (lazy)
- Error boundary: if the component throws on mount, shows an error card with the error message instead of crashing the shell
- Toolbar above preview: component name + file path chip

**Route:**
```ts
{
  path: '/lab',
  name: 'lab',
  component: () => import('@/pages/lab/index.vue'),
  meta: { layout: 'bare' }
}
```

**Auth:** none — `authGuard` short-circuits for `/dev/*` and `/lab` paths.

---

## Tailwind Configuration

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

**Import order in `main.ts`:**
```ts
import 'vuetify/styles'      // Vuetify first
import './styles/tailwind.css' // Tailwind after — Vuetify wins specificity ties
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

## Workflow

1. Open `http://localhost:3000/lab`
2. Ask Claude (with `/ui-designer` skill loaded): *"Build a booking dashboard card — property name, time window, status badge, action buttons"*
3. Claude reads `_README.md`, writes `src/ai-mockups/BookingDashboardCard.vue`
4. File appears in sidebar, HMR reloads, component renders
5. Iterate: *"Make it more compact on mobile"* / *"Add a loading state"* / *"Refactor into sub-components"*
6. When satisfied: *"Promote `BookingDashboardCard.vue` to `src/components/dumb/owner/`"* — Claude copies, fixes imports, deletes original

---

## `ui-designer` Skill

A Claude Code skill stored at `.claude/skills/ui-designer.md`. Loaded via `/ui-designer` at the start of a lab session.

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

## Implementation Order

1. Install Tailwind + PostCSS (`pnpm add -D tailwindcss postcss autoprefixer`)
2. Create `tailwind.config.js` and `postcss.config.js`
3. Create `src/styles/tailwind.css` and import in `main.ts`
4. Add `/lab` route to router (alongside existing `/dev/demos`)
5. Add `'bare'` to `RouteMeta.layout` union type (already done on `main` branch)
6. Create `src/layouts/bare.vue` (already done on `main` branch — cherry-pick or recreate)
7. Register `BareLayout` in `App.vue`
8. Create `src/pages/lab/index.vue` (AiLab shell)
9. Create `src/ai-mockups/_README.md` (project context for Claude)
10. Create `src/ai-mockups/example.vue` (starter file)
11. Create `.claude/skills/ui-designer.md`
12. Verify: `pnpm dev` → navigate to `/lab` → sidebar shows `example.vue` → renders correctly
