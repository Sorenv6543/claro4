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

**Pencil CLI fallback:** If Pencil MCP is not connected, token sync workflows (Workflow 1)
can use the Pencil CLI instead. The CLI works headlessly — no VS Code required:

```bash
# Read variables from a .pen file (headless)
pencil interactive --in design/materio-vuetify.lib.pen --out design/materio-vuetify.lib.pen <<'EOF'
get_variables({})
exit()
EOF

# Write variables (headless)
pencil interactive --in design/materio-vuetify.lib.pen --out design/materio-vuetify.lib.pen <<'EOF'
set_variables({ variables: { "--primary": { "type": "color", "value": "#7367F0" } } })
save()
exit()
EOF
```

Requires `@pencil.dev/cli` installed globally (`npm install -g @pencil.dev/cli`) and
authenticated (`pencil login`). Check with `pencil status`.

For Workflows 2 and 3 (component scaffolding, page restyle), Pencil MCP is preferred
because it provides screenshots and editor state. If MCP is unavailable, scaffold manually
using `src/styles/tokens.css` as the design reference — but warn the user that sync
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

## Variable Name Mapping

Pencil variables use `--{name}`. Tokens.css uses `--claro-{name}`. The general rule is
**prepend `claro-`**, but these exceptions must be handled:

| Pencil Variable | tokens.css Property | Note |
|-----------------|---------------------|------|
| `--color-success` | `--claro-success` | Drop `color-` prefix |
| `--color-warning` | `--claro-warning` | Drop `color-` prefix |
| `--color-error` | `--claro-error` | Drop `color-` prefix |
| `--color-info` | `--claro-info` | Drop `color-` prefix |
| `--radius-m` | `--claro-radius-md` | Pencil uses `-m`, tokens use `-md` |
| `--foreground` | `--claro-on-background` | Different name |
| `--muted-foreground` | `--claro-text-secondary` | Different name |
| `--border` | `--claro-divider` | Different name (same value as `--divider`) |
| `--card` | `--claro-card-bg` | Different name (same value as `--card-bg`) |
| `--destructive` | `--claro-error` | Alias — maps to same token as `--color-error` |

**Pencil-only variables** (no tokens.css equivalent, skip during sync):
`--font-primary`, `--font-secondary`, `--color-*-foreground` (4 vars), `--radius-none`

**Type conversions:** Pencil returns bare numbers for spacing/size tokens (e.g., `16`).
Tokens.css uses CSS units (`16px`). Append `px` to all numeric spacing, radius, and
dimension values. Shadow and gradient strings copy as-is.

**Themes:** The .pen file has 4 theme variants (Default, Variant-1, Variant-2, Variant-3).
Currently all variants share the same values. Use the `Default` theme when reading.

## Workflow 1: Token Sync

Use when the user wants to sync design tokens between Pencil and code.

### Design → Code (pull tokens from .pen)

1. `mcp__pencil__open_document(filePath)` — open the .pen file (see .pen File Selection below)
2. `mcp__pencil__get_variables(filePath)` — returns all Pencil variables
3. Map Pencil variable names to `--claro-*` properties using the Variable Name Mapping table.
   Apply type conversions (append `px` to numeric values).
4. Update `src/styles/tokens.css` with new values
5. For color tokens: also update hex values in `src/plugins/vuetify.ts` theme config
6. Run `pnpm build:fast` to verify no breakage
7. **Commit:** `git commit -m "tokens: sync design tokens from .pen to tokens.css"`

### Code → Design (push tokens to .pen)

1. Read current values from `src/styles/tokens.css`
2. Reverse-map `--claro-*` names to Pencil variable names. Strip `px` from numeric values.
3. `mcp__pencil__set_variables(filePath, variables)` with the mapped values
4. `mcp__pencil__get_variables(filePath)` to verify the sync took
5. **Commit:** `git commit -m "sync: push token values from tokens.css to .pen"`

### Token Drift Check

Use when starting a new session or as a pre-commit check.

1. Read `src/styles/tokens.css` — parse each `--claro-*` property and its value
2. `mcp__pencil__get_variables(filePath)` — extract all Pencil variables (use `Default` theme)
3. For each Pencil variable, apply the mapping table (see Variable Name Mapping above)
   to find its `--claro-*` counterpart. Apply type conversions (append `px` to numbers).
4. Compare values. Report a table:

   | Token | Pencil Value | tokens.css Value | Status |
   |-------|-------------|------------------|--------|
   | `--claro-primary` | `#7367F0` | `#7367F0` | In sync |
   | `--claro-space-md` | `16px` | `16px` | In sync |

5. For color tokens that drifted: also check if `src/plugins/vuetify.ts` matches tokens.css
6. Report: number in sync, number drifted, number Pencil-only, number tokens-only
7. Do NOT auto-fix drift — present the report and ask the user which direction to sync

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

1. `mcp__pencil__open_document(filePath)` (if not already open — see .pen File Selection below)
2. `mcp__pencil__get_editor_state({ include_schema: true })` — understand what's on the canvas
3. Find the relevant design node:
   - `mcp__pencil__batch_get(filePath, patterns: [{ reusable: true }], readDepth: 2)` to list
     all reusable components, then filter by name
   - If the user named something specific, also try `patterns: [{ name: "StatCard" }]`
   - If no match: ask the user which node/frame to reference
4. `mcp__pencil__get_screenshot(filePath, nodeId)` — get visual reference of the target design
5. `mcp__pencil__get_guidelines()` — list available guides, then load the relevant one
   (e.g., `get_guidelines({ category: "guide", name: "web-app" })`)
6. `mcp__pencil__snapshot_layout(filePath, parentId: nodeId)` — get the structural layout data

### Step 3: Research Vuetify APIs

Use the Vuetify MCP to look up component APIs before writing code. This matters because
Vuetify 4 has specific props/slots that absorb styling — using them correctly means less
custom CSS.

For each Vuetify component the design implies (VCard, VBtn, VChip, etc.):
- `mcp__claude_ai_vuetify__get_component_api_by_version({ component: "VCard", version: "v4" })`
- Identify which design properties map to existing Vuetify props vs. need custom CSS
- Check if Vuetify global defaults (configured in `src/plugins/vuetify.ts`) already
  handle the styling — if a default covers it, don't override per-component

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

### Step 6: Commit

**Commit:** `git commit -m "wrapper: add {ComponentName} dumb component for {role}"`
(Use `restyle:` prefix if updating an existing component instead of creating a new one.)

## Workflow 3: Page Restyle

Use when the user wants to restyle an existing page to match the .pen design.

### Phase 1: Capture Current State
1. Take a Chrome DevTools screenshot of the current page — save as "before" baseline
2. Identify which page/route is being restyled and find the page file:
   - Owner pages: `src/pages/owner/` — use `ls` or Glob to find the exact filename
   - Admin pages: `src/pages/admin/`
   - Auth pages: `src/pages/auth/`

### Phase 2: Read Design Intent
3. `mcp__pencil__open_document(filePath)` (see .pen File Selection below)
4. `mcp__pencil__get_variables(filePath)` — check token values are current
5. `mcp__pencil__batch_get(filePath, patterns: [{ reusable: true }], readDepth: 2)` — list
   reusable components in the design that relate to this page
6. `mcp__pencil__get_screenshot(filePath, nodeId)` — screenshot the target design for reference

### Phase 3: Research Vuetify APIs
7. Read the page component file and list every Vuetify component used (VCard, VBtn, etc.)
8. For each, look up the API:
   `mcp__claude_ai_vuetify__get_component_api_by_version({ component: "VCard", version: "v4" })`
9. For each component, decide: can the design be achieved with existing Vuetify props +
   tokens, or does it need a wrapper? Document the decision.

### Phase 4: Implement
10. **Token sync** — run Workflow 1 (Design → Code) if tokens have drifted
11. **Find hardcoded values** — in the page file and its child components:
    - Grep for hex color codes: `#[0-9a-fA-F]{3,8}`
    - Grep for hardcoded pixel values in style blocks: `\d+px` that should be tokens
    - Grep for raw `box-shadow` CSS that should use `elevation` prop
12. **Replace hardcoded values** with token references:
    - Hex colors → Vuetify semantic colors (`color="primary"`) or `var(--claro-*)`
    - Hardcoded px → `var(--claro-space-*)`, `var(--claro-radius-*)`, etc.
    - Raw box-shadow → Vuetify `elevation` prop
13. **Create wrapper components** only where stock Vuetify + tokens can't express the design
14. **Update the page component** to use wrappers where applicable
15. **Commit each visual unit separately** before moving to the next:
    - `restyle: update {PageName} to consume design tokens`
    - `wrapper: add {WrapperName} for {purpose}`

### Phase 5: Verify & Sync Back
16. Take a Chrome DevTools screenshot — "after" screenshot
17. Compare before/after visually — check elevation, spacing, colors, transitions
18. If tokens changed: `mcp__pencil__set_variables(filePath, variables)` to sync back to .pen
19. Run `pnpm build:fast` and `pnpm test:run`
20. **Final commit** if verification required fixes: `restyle: fix {PageName} post-verification`

## Git Commit Convention

One commit per visual unit. Use these prefixes:
- `tokens:` — token file changes
- `theme:` — vuetify.ts theme config changes
- `wrapper:` — new or modified wrapper components
- `restyle:` — applying tokens/wrappers to a page/component
- `sync:` — two-way sync operations between .pen and tokens.css

Commit before moving to the next component. Small, revertible commits.

## .pen File Selection

The `design/` directory contains multiple .pen files. Use the right one for the workflow:

| File | Purpose |
|------|---------|
| `design/materio-vuetify.lib.pen` | **Primary design library** — reusable components, page mockups, design tokens. Use for all restyle and scaffolding work. |
| `design/materio-vuetify.token_sync.pen` | Token sync working file — same variables as lib.pen, used for token sync workflows. Keep in sync with lib.pen. |

When the skill says `filePath`, substitute the appropriate file path. Default to
`design/materio-vuetify.lib.pen` unless the user specifies otherwise.

## Pencil MCP Quick Reference

These are the key tools and when to use them:

| Tool | When |
|------|------|
| `open_document(filePath)` | Start of any workflow — opens the .pen file |
| `get_editor_state({ include_schema })` | Understand canvas structure (pass `true` first time) |
| `get_variables(filePath)` | Extract design tokens (colors, spacing, etc.) |
| `set_variables(filePath, variables)` | Push code token changes back to .pen |
| `batch_get(filePath, patterns, readDepth)` | Search for components (e.g., `[{ reusable: true }]`) |
| `get_screenshot(filePath, nodeId)` | Visual reference of a specific design element |
| `get_guidelines()` | List available guides/styles, then load by category + name |
| `snapshot_layout(filePath, parentId)` | Get structural layout data for a node |
| `export_nodes(filePath, nodeIds, outputDir)` | Export specific nodes as image files |
| `search_all_unique_properties(filePath, parents, properties)` | Find all unique property values across the design |
| `replace_all_matching_properties(filePath, parents, properties)` | Bulk-update properties in the .pen file |

## Pencil CLI Quick Reference

The CLI (`@pencil.dev/cli`) works headlessly — no VS Code needed. Use for token sync
when Pencil MCP is unavailable, or for scripting/CI.

| Command | When |
|---------|------|
| `pencil status` | Check auth status |
| `pencil interactive --in FILE --out FILE` | Open interactive shell for a .pen file |
| `pencil --in FILE --out FILE --export img.png` | Export design to image |
| `pencil --in FILE --out FILE -p "prompt"` | AI agent mode — modify design via prompt |
| `pencil --tasks batch.json` | Batch process multiple .pen files |

**Interactive shell commands:** `get_variables({})`, `set_variables({ variables: {...} })`,
`save()`, `exit()`

**Sync both .pen files in one script:**

```bash
for f in design/materio-vuetify.lib.pen design/materio-vuetify.token_sync.pen; do
  pencil interactive --in "$f" --out "$f" <<'EOF'
set_variables({ variables: { "--primary": { "type": "color", "value": "#7367F0" } } })
save()
exit()
EOF
done
```

**CI/CD env vars:** `PENCIL_CLI_KEY` (org API key), `ANTHROPIC_API_KEY`

## Fallback: No Pencil MCP or CLI

If neither Pencil MCP nor CLI is available, you can still scaffold design-aware components:

1. Read `src/styles/tokens.css` for current token values
2. Use existing wrapper components (DashboardCard, StatCard, DashboardShell)
3. Follow the same code generation principles (token references, Vuetify semantics)
4. Skip the .pen sync steps
5. Note in the commit message that Pencil sync was skipped
