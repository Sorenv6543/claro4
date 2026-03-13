# Vuetify Config Audit Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 9 issues across 4 config files identified by Vuetify MCP audit, improving treeshaking, eliminating a production devtools bug, and enabling SASS modern compiler performance.

**Architecture:** All changes are isolated to config files. No component, store, composable, or router code is touched. Each file is fixed independently and committed separately.

**Tech Stack:** Vue 3, Vite 7, Vuetify 4, vite-plugin-vuetify, sass-embedded, pnpm

---

## Chunk 1: vuetify.ts + variables.scss

### Task 1: Fix `src/plugins/vuetify.ts`

**Files:**
- Modify: `src/plugins/vuetify.ts`

**Context for implementer:**
- `autoImport: true` is confirmed present in `vite.config.ts` line 43 — this is what makes removing the wildcard imports safe. `vite-plugin-vuetify` registers all Vuetify components on-demand via Vite transforms; removing wildcard imports will NOT break any component usage in templates.
- Do NOT touch the commented-out SCSS block at lines 17–24 — it is dead code but harmless.
- `import vuetify from 'vite-plugin-vuetify'` also appears in `vite.config.ts` where it is correct — **only remove it from `src/plugins/vuetify.ts`**, not from `vite.config.ts`.
- Complete Task 2 (`variables.scss`) before running the verify step in this task. Because `vite.config.ts` sets `styles.configFile: 'src/styles/variables.scss'`, build failures from an empty `variables.scss` will surface here first.

#### Issue A — Remove dead Vite build-time imports from `src/plugins/vuetify.ts`

- [ ] **Step 1: Remove lines 4–5 from `src/plugins/vuetify.ts`**

  ```diff
  -import vuetify from 'vite-plugin-vuetify'
  -import { defineConfig } from 'vite'
  ```

  These are Vite build-time tools with no business in a runtime plugin file. The same `import vuetify from 'vite-plugin-vuetify'` exists in `vite.config.ts` (line 9) where it belongs — do not touch that one.

#### Issue B + C — Remove wildcard imports and stale createVuetify keys in one edit

- [ ] **Step 2: Remove the wildcard import lines (lines 9–10)**

  ```diff
  -import * as components from 'vuetify/components'
  -import * as directives from 'vuetify/directives'
  ```

- [ ] **Step 3: Remove `components`, `directives`, and `date` from `createVuetify()` in one edit**

  The `components,` and `directives,` keys must both be removed — leaving either one causes a runtime reference error since the imports are gone. Remove the stale `// ← add this line` comment with the `date` line.

  ```diff
   export default createVuetify({
  -  components,
  -  directives,
  -  date: {},        // ← add this line
  -
     // Icon configuration
  ```

#### Issue D — Reduce variations count

- [ ] **Step 4: Reduce lighten/darken from 5 to 3**

  ```diff
     variations: {
       colors: ['primary', 'secondary', 'accent', 'error', 'info', 'success', 'warning'],
  -    lighten: 5,
  -    darken: 5
  +    lighten: 3,
  +    darken: 3
     }
  ```

  The codebase only references `darken-1` and `lighten-2` at most per CLAUDE.md. Reduces ~40 generated CSS custom properties.

#### Issue E — Add missing on-background/on-surface to light theme

- [ ] **Step 5: Add MD3 on-color tokens to the light theme colors object**

  The `darkTeal` theme already defines `'on-background'` and `'on-surface'`. Add parity values to the `light` theme immediately after `'booking-standard'`:

  ```diff
       'booking-standard': '#4CAF50',
  +    'on-background': '#1C1B1F',
  +    'on-surface': '#1C1B1F',
     },
  ```

  `#1C1B1F` is the Material Design 3 spec value for `on-background`/`on-surface` in light mode (near-black with warm undertone).

---

### Task 2: Fix `src/styles/variables.scss`

**Files:**
- Modify: `src/styles/variables.scss`

**Context for implementer:**
- File is currently empty (2 blank lines only).
- `vite-plugin-vuetify` `styles.configFile` points here — it is loaded before each Vuetify stylesheet.
- `src/styles/main.scss` does NOT contain a `@use 'vuetify/settings'` block — no conflict.
- Do NOT add actual CSS rules to this file. Only variables, mixins, and functions belong here. Actual styles go in `main.scss`.
- The `with (...)` clause is omitted because all variable stubs are comments — an empty `with ()` block is a Sass syntax error in some Sass versions. Add `with (...)` only when you have at least one actual variable to set.

#### Issue H — Add required `@use` wrapper

- [ ] **Step 1: Replace the full file content with**

  ```scss
  // Vuetify SASS variable overrides
  // Only variables, mixins, and functions here — no actual styles.
  // Docs: https://vuetifyjs.com/features/sass-variables/
  //
  // To override a variable, add the `with (...)` clause:
  //   @use 'vuetify/settings' with (
  //     $body-font-family: ('Roboto', sans-serif),
  //     $border-radius-root: 8px,
  //   );
  @use 'vuetify/settings';
  ```

- [ ] **Step 2: Verify build passes**

  ```bash
  pnpm build:fast
  ```

  Expected: no errors. This also unblocks the Task 1 verify step.

- [ ] **Step 3: Commit**

  ```bash
  git add src/styles/variables.scss
  git commit -m "fix(styles): add required @use vuetify/settings wrapper to variables.scss"
  ```

---

### Task 1 continued — Verify and commit

- [ ] **Step 6: Verify `vuetify.ts` changes compile (run after Task 2)**

  ```bash
  pnpm build:fast
  ```

  Expected: no errors. If the build fails with an SCSS error rather than a TypeScript error, confirm Task 2 was applied correctly first.

- [ ] **Step 7: Commit**

  ```bash
  git add src/plugins/vuetify.ts
  git commit -m "fix(vuetify): remove dead imports, wildcard components, fix theme tokens and variations"
  ```

---

## Chunk 2: vite.config.ts + CLAUDE.md

### Task 3: Fix `vite.config.ts`

**Files:**
- Modify: `vite.config.ts`

**Context for implementer:**
- The file has `vueDevTools(...)` registered twice. The unconditional one (inside the `plugins` array literal, before any `if` blocks) must be removed. The one inside `if (isDevelopment)` at lines 57–67 must be kept — that block also contains a `devtoolsJson()` push and an `if (vueDevToolsPlugin)` null guard; leave both intact.
- `sass-embedded` is already installed (`devDependencies: "sass-embedded": "^1.98.0"`). Vite 7 satisfies the ≥5.4 requirement. No package installation needed.
- The `vue` alias change is a comment addition only — do not remove the alias itself.

#### Prerequisite check

- [ ] **Step 1: Confirm sass-embedded is installed**

  ```bash
  pnpm list sass-embedded
  ```

  Expected: shows `sass-embedded 1.x.x`. If not found, run `pnpm add -D sass-embedded` before continuing.

#### Issue F — Remove duplicate vueDevTools registration

- [ ] **Step 2: Remove the unconditional `vueDevTools` block from the `plugins` array literal**

  The `plugins` array starts with `vueDevTools({...})` — remove that entire block. The `isDevelopment`-guarded block further down (which also pushes `devtoolsJson()` and `vueDevTools()`) must remain untouched.

  ```diff
   const plugins: PluginOption[] = [
  -  vueDevTools({
  -    componentInspector: {
  -      enabled: false,
  -      toggleComboKey: 'alt-shift',
  -      launchEditor: 'code',
  -    },
  -  }),
     vue({
  ```

  After this change `vueDevTools` is only registered inside `if (isDevelopment)` — correct behaviour.

#### Issue G — Document the `vue` alias

- [ ] **Step 3: Add comment immediately above the `'vue'` alias line in `resolve.alias`**

  ```diff
  +      // NOTE: Full Vue build (includes runtime template compiler). Normally unnecessary
  +      // with Vite SFCs — remove and test once FullCalendar runtime compilation is confirmed safe.
         'vue': 'vue/dist/vue.esm-bundler.js',
  ```

#### SASS modern compiler

- [ ] **Step 4: Add `api: 'modern-compiler'` to the `scss` preprocessor block and add a `sass` sibling block**

  ```diff
     css: {
       devSourcemap: true,
       preprocessorOptions: {
         scss: {
           quietDeps: true,
           loadPaths: ['node_modules'],
  +        api: 'modern-compiler',
         },
  +      sass: {
  +        api: 'modern-compiler',
  +      },
       },
     },
  ```

  **Why both `scss` and `sass`?** Vite separates preprocessor config by file extension. Project files use `.scss`; Vuetify's internal source (activated when `styles.configFile` is set) uses `.sass` syntax. Both need the modern compiler flag.

- [ ] **Step 5: Remove the now-stale `SASS_SILENCE_DEPRECATION_WARNINGS` define**

  The `modern-compiler` API does not use the legacy JS API, making this define contradictory. Remove it from the `define` block:

  ```diff
  -  'process.env.SASS_SILENCE_DEPRECATION_WARNINGS': JSON.stringify('legacy-js-api'),
  ```

- [ ] **Step 6: Verify build passes**

  ```bash
  pnpm build:fast
  ```

  Expected: no errors, no legacy-js-api deprecation warnings.

- [ ] **Step 7: Run full test suite**

  ```bash
  pnpm test:run
  ```

  Expected: all tests green.

- [ ] **Step 8: Commit**

  ```bash
  git add vite.config.ts
  git commit -m "fix(vite): remove duplicate vueDevTools, add SASS modern-compiler api, document vue alias"
  ```

---

### Task 4: Update `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

**Context for implementer:**
- Search for `## Vuetify 3 UI/UX Patterns` to find the insertion point. Add the new section immediately after that section's closing content, before the next `##` heading.
- Do not modify any existing content.

- [ ] **Step 1: Insert the following section after `## Vuetify 3 UI/UX Patterns`**

  ```markdown
  ## Vuetify MCP

  Use `mcp__vuetify-mcp__*` tools instead of guessing at v4 APIs or component props.

  | Situation | Tool |
  |-----------|------|
  | Check props / events / slots for any component | `get_component_api_by_version` — pass `version: "latest"` for v4 |
  | Something broke after a Vuetify upgrade | `get_v4_breaking_changes` — filter by category (`v-btn`, `theme`, `v-select`, etc.) |
  | Configure theme, SASS vars, icons, i18n, display | `get_feature_guide` — topics: `theme`, `sass-variables`, `icon-fonts`, `display-and-platform`, `global-configuration` |
  | Directive API (`v-ripple`, `v-intersect`, etc.) | `get_directive_api_by_version` |
  | Release notes for a specific version | `get_release_notes_by_version` |
  | Migrate v3 → v4 | `get_upgrade_guide` with `version: "v3"` |
  | Create a repro or file a Vuetify bug | `create_vuetify_bin` + `create_bug_report` |
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add CLAUDE.md
  git commit -m "docs: add Vuetify MCP usage guide to CLAUDE.md"
  ```

---

## Chunk 3: Final Verification

### Task 5: Full build + test verification

- [ ] **Step 1: Run the full type-checked build**

  ```bash
  pnpm build
  ```

  Expected: `vue-tsc --noEmit` passes, Vite build completes with no SASS or TypeScript errors.

- [ ] **Step 2: Run all tests**

  ```bash
  pnpm test:run
  ```

  Expected: all tests green.

- [ ] **Step 3: Start dev server and verify devtools loads once**

  ```bash
  pnpm dev
  ```

  Open the browser console. Confirm no duplicate Vue DevTools registration messages. Confirm hot reload works normally.

- [ ] **Step 4: Visual theme check**

  Toggle between `light` and `darkTeal` themes in the running dev server. Confirm text on background and surface elements is readable — the `on-background`/`on-surface` tokens are now defined in both themes.

- [ ] **Step 5: Done**

  All 9 issues resolved across 4 files. No components, stores, composables, or router files were touched.
