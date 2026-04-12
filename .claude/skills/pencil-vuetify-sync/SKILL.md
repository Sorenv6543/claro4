---
name: pencil-vuetify-sync
description: >
  Design-to-code scaffolding and sync for Vue 3 + Vuetify 4 components using Pencil.dev
  .pen files as the visual source of truth. Use this skill whenever the user mentions .pen
  files, Pencil, design tokens, restyling a page, syncing design to code, generating
  components from a design, updating tokens, or creating Vue components that should match
  a design file. Also trigger when the user says things like "restyle", "match the design",
  "pull from Pencil", "sync tokens", "update the look", or asks to scaffold a component
  that needs to visually match something in the .pen library. If the user mentions both
  a component and design/visual intent together, use this skill over the basic
  new-component skill.
---

# Pencil-to-Vuetify Sync

This skill orchestrates the Pencil MCP and Vuetify MCP to scaffold and maintain Vue 3 +
Vuetify 4 components that stay in sync with `.pen` design files. It covers three workflows:
token sync, component scaffolding from design, and page restyling.

## Prerequisites

Before starting any workflow, verify these are available:

1. **Pencil MCP** — tools prefixed `mcp__pencil__`. If not connected, tell the user to
   open Pencil in VS Code (Settings → Agents and MCP → enable Claude Code).
2. **Vuetify MCP** — tools for looking up component API. If not connected, tell the user.
3. **Chrome DevTools MCP** — needed for screenshots during restyle. Optional for token-only work.
4. **Dev server** — `pnpm dev` should be running for screenshot verification.

If Pencil MCP is not available, you can still scaffold components manually using the token
file at `src/styles/tokens.css` as the design reference — but warn the user that sync
won't be live.

## Token Architecture

Understanding the token bridge is essential for every workflow:

```
Pencil .pen variables  ←→  src/styles/tokens.css  →  src/plugins/vuetify.ts
     (design truth)        (CSS custom properties)     (theme registration)
                                    ↓
                           Vue components consume
                           via var(--claro-*)
```

**Color tokens** live in both `tokens.css` AND `vuetify.ts` because Vuetify 4 requires
hex values in theme config (it generates `--v-theme-*` RGB tuples internally). When colors
change, update both files. Non-color tokens (spacing, radii, shadows) live only in
`tokens.css` and components reference them via `var(--claro-*)`.

All tokens use the `--claro-` prefix. Never use `--v-` (Vuetify's namespace).

## Workflow 1: Token Sync

Use when the user wants to sync design tokens between Pencil and code.

### Design → Code (pull tokens from .pen)

1. `mcp__pencil__open_document("design/materio-vuetify.lib.pen")`
2. `mcp__pencil__get_variables()` — returns all Pencil variables
3. Map Pencil variable names to `--claro-*` properties
4. Update `src/styles/tokens.css` with new values
5. For color tokens: also update hex values in `src/plugins/vuetify.ts` theme config
6. Run `pnpm build:fast` to verify no breakage

### Code → Design (push tokens to .pen)

1. Read current values from `src/styles/tokens.css`
2. `mcp__pencil__set_variables()` with the token values mapped back to Pencil variable names
3. `mcp__pencil__get_variables()` to verify the sync took

### Token Drift Check

Compare `tokens.css` values against Pencil variables. Report any mismatches. This is
useful as a pre-commit check or when starting a new session.

## Workflow 2: Component Scaffolding from Design

Use when the user wants to create a new component that should match a design in the
.pen file. This extends the basic `new-component` skill with design awareness.

### Step 1: Gather Requirements

Always ask the user for:
- **Component name** (PascalCase)
- **Smart or Dumb?** — Smart components use stores/composables; dumb components are
  pure props+emits. If unclear, ask.
- **Role: owner, admin, or shared?** — Determines directory placement. Always ask.

### Step 2: Extract Design Data

1. `mcp__pencil__open_document("design/materio-vuetify.lib.pen")` (if not already open)
2. `mcp__pencil__get_editor_state()` — understand what's on the canvas
3. Find the relevant design node:
   - `mcp__pencil__batch_get(filePath, patterns)` to search for matching components
   - Or ask the user which node/frame to reference
4. `mcp__pencil__get_screenshot(nodeId)` — get visual reference of the target design
5. `mcp__pencil__get_style_guide()` or `get_style_guide_tags()` — understand the
   component's design language
6. `mcp__pencil__snapshot_layout(nodeId)` — get the structural layout data

### Step 3: Research Vuetify APIs

Use the Vuetify MCP to look up component APIs before writing code. This matters because
Vuetify 4 has specific props/slots that absorb styling — using them correctly means less
custom CSS.

For each Vuetify component the design implies (VCard, VBtn, VChip, etc.):
- Look up available props, slots, and events
- Identify which design properties map to existing Vuetify props vs. need custom CSS
- Check if Vuetify global defaults (configured in `src/plugins/vuetify.ts`) already
  handle the styling

### Step 4: Generate the Component

**Placement rules:**

| Type  | Role   | Path |
|-------|--------|------|
| smart | owner  | `src/components/smart/owner/{Name}.vue` |
| smart | admin  | `src/components/smart/admin/{Name}.vue` |
| dumb  | owner  | `src/components/dumb/owner/{Name}.vue` |
| dumb  | admin  | `src/components/dumb/admin/{Name}.vue` |
| dumb  | shared | `src/components/dumb/shared/{Name}.vue` |

Smart components cannot be `shared` — they are always role-specific.

**Code generation principles:**

- Use `<script setup lang="ts">` with proper TypeScript types
- Reference design tokens via `var(--claro-*)` — never hardcode hex values
- Use Vuetify's semantic colors (`color="primary"`, `color="error"`) which read from the
  theme, which reads from tokens
- Use Vuetify component defaults — don't override `variant`, `density`, `rounded` unless
  the design explicitly deviates from global defaults
- For dumb components: props + emits only, no store/composable imports
- For smart components: use existing composables from `src/composables/{role}/`
- Check existing components in `src/components/dumb/shared/` before creating duplicates.
  Key reusable ones: DashboardCard, StatCard, DashboardShell, PropertyCard, PropertyModal,
  MaterioDataTable, ConfirmationDialog, LoadingSpinner, ErrorAlert

**Token usage in templates:**

```vue
<!-- Use Vuetify semantic colors (reads from theme ← tokens) -->
<v-card color="primary">

<!-- Use CSS custom properties for non-color tokens -->
<div :style="{ padding: 'var(--claro-space-md)', borderRadius: 'var(--claro-radius-lg)' }">

<!-- Or in <style scoped> -->
<style scoped>
.card-content {
  padding: var(--claro-card-padding);
  gap: var(--claro-card-gap);
  box-shadow: var(--claro-shadow-md);
}
</style>
```

### Step 5: Verify

1. If dev server is running, take a Chrome DevTools screenshot to compare
2. Run `pnpm build:fast` to check types
3. Compare generated component visually against the Pencil screenshot from Step 2

## Workflow 3: Page Restyle

Use when the user wants to restyle an existing page to match the .pen design.

### Phase 1: Capture Current State
1. Chrome DevTools `take_screenshot()` — save as "before" baseline
2. Identify which page/route is being restyled

### Phase 2: Read Design Intent
3. Open the .pen file and extract relevant design data (same as Workflow 2, Steps 2)
4. `mcp__pencil__get_variables()` — check token values are current
5. Screenshot the target design from Pencil for reference

### Phase 3: Research Vuetify APIs
6. For each component on the page, use Vuetify MCP to confirm which props/slots can
   absorb the new styling via tokens vs. which need wrappers or custom CSS

### Phase 4: Implement
7. Sync tokens if needed (Workflow 1)
8. Update existing components to consume tokens — replace hardcoded values with
   `var(--claro-*)` references and Vuetify semantic colors
9. Create wrapper components only where stock Vuetify + tokens can't express the design
10. Update the page component itself

### Phase 5: Verify & Sync Back
11. Chrome DevTools `take_screenshot()` — "after" screenshot
12. Compare before/after visually
13. If tokens changed: `mcp__pencil__set_variables()` to sync back to .pen
14. Run `pnpm build:fast` and `pnpm test:run`

## Git Commit Convention

One commit per visual unit. Use these prefixes:
- `tokens:` — token file changes
- `theme:` — vuetify.ts theme config changes
- `wrapper:` — new or modified wrapper components
- `restyle:` — applying tokens/wrappers to a page/component
- `sync:` — two-way sync operations between .pen and tokens.css

Commit before moving to the next component. Small, revertible commits.

## Pencil MCP Quick Reference

These are the key tools and when to use them:

| Tool | When |
|------|------|
| `open_document(path)` | Start of any workflow — opens the .pen file |
| `get_editor_state()` | Understand canvas structure and available nodes |
| `get_variables()` | Extract design tokens (colors, spacing, etc.) |
| `set_variables()` | Push code token changes back to .pen |
| `batch_get(file, patterns)` | Search for specific components (e.g., reusable ones) |
| `get_screenshot(nodeId)` | Visual reference of a specific design element |
| `get_style_guide()` | Get style rules for the document |
| `get_style_guide_tags()` | Get categorized style guide entries |
| `snapshot_layout(nodeId)` | Get structural layout data for a node |
| `export_nodes(nodeIds)` | Export specific nodes as files |
| `search_all_unique_properties()` | Find all unique property values across the design |
| `replace_all_matching_properties()` | Bulk-update properties in the .pen file |

## Fallback: No Pencil MCP

If Pencil MCP is not connected, you can still scaffold design-aware components:

1. Read `src/styles/tokens.css` for current token values
2. Use existing wrapper components (DashboardCard, StatCard, DashboardShell)
3. Follow the same code generation principles (token references, Vuetify semantics)
4. Skip the .pen sync steps
5. Note in the commit message that Pencil sync was skipped
