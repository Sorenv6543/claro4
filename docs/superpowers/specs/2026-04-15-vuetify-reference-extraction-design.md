# Vuetify Reference Extraction for Claro4 Workflows

## Context

Claro4's `pencil-vuetify-sync` skill orchestrates design-to-code workflows (token sync, component scaffolding, page restyle) using Vuetify 4. These workflows call the Vuetify MCP for component APIs, but the MCP lacks depth on:
- Which props absorb design intent vs. need custom CSS
- How Vuetify components compose internally (slots, provide/inject, composables)
- How the SASS/CSS architecture works and where custom tokens can hook in

This leads to guesswork during component scaffolding and restyle workflows, producing suboptimal code that fights Vuetify's cascade instead of leveraging it.

**Goal**: Extract structured reference material from the Vuetify monorepo source into `claro4/docs/references/`, optimized for Claude Code consumption during skill execution.

## Deliverables

### 1. Per-Component Reference Files (68 files)

**Location**: `docs/references/vuetify-components/`
**Naming**: kebab-case — `v-card.md`, `v-btn.md`, `v-data-table.md`

Each file covers one Vuetify component:
- **Design Props** — which props absorb design intent, their values, CSS effect, and whether claro4 already sets a global default
- **Slot Anatomy** — named slots, what they render, sub-component acceptance
- **Composable Hooks** — internal composables the component uses
- **SASS Hooks** — CSS classes emitted, SASS variables, CSS custom properties read from theme
- **Design-to-Code Cheatsheet** — "if the design shows X, use Y"

**68 components across 10 categories**: Layout (6), Navigation (7), Buttons (3), Cards (5), Dialogs/Overlays (6), Forms (12), Data Display (12), Feedback (6), Containers (6), Transitions (5).

### 2. Architecture Guides (3 files)

**Location**: `docs/references/`

- **vuetify-sass-architecture.md** — SASS settings/tools, component styles, theme integration, custom token hookpoints
- **vuetify-composition-patterns.md** — useDefaults cascade, useTheme/useDisplay/useLocale, slot composition, provide/inject, anti-patterns
- **vuetify-component-index.md** — lookup table for all 68 component files, grouped by category

### 3. Integration

- Add reference pointers to claro4's CLAUDE.md under "Vuetify Reference"

## Extraction Source

All reference material extracted from the Vuetify monorepo at `packages/vuetify/src/`. Cross-referenced with claro4's `src/plugins/vuetify.ts` global defaults.
