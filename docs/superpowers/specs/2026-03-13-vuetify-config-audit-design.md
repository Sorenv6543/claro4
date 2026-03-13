# Vuetify Config Audit & MCP Recommendations — Design Spec

**Date:** 2026-03-13
**Scope:** Option 2 — Full audit + all fixes across config files + CLAUDE.md MCP section
**Files touched:** `src/plugins/vuetify.ts`, `vite.config.ts`, `src/styles/variables.scss`, `CLAUDE.md`

---

## 1. Overview

A targeted audit of the Vuetify 4 configuration files using the Vuetify MCP (`get_v4_breaking_changes`, `get_feature_guide(theme)`, `get_feature_guide(global-configuration)`, `get_feature_guide(sass-variables)`). Eight issues found across four files, ranging from a critical bug (vueDevTools double-registration) to a high-impact treeshaking issue (wildcard component imports). No component or store code is touched.

---

## 2. Changes by File

### 2.1 `src/plugins/vuetify.ts`

#### Issue A — Dead Vite imports
**Severity:** Low
**Problem:** Lines 4–5 import `vite-plugin-vuetify` and `defineConfig` from Vite. These are build-time tools with no place in a runtime plugin file. They are never used in the file.
**Fix:** Remove both import statements.

```diff
-import vuetify from 'vite-plugin-vuetify'
-import { defineConfig } from 'vite'
```

#### Issue B — Wildcard component/directive imports defeat treeshaking
**Severity:** High
**Problem:** `import * as components from 'vuetify/components'` (line 9) and `import * as directives from 'vuetify/directives'` (line 10) force every Vuetify component and directive into the bundle regardless of usage. `vite-plugin-vuetify` with `autoImport: true` (confirmed present in `vite.config.ts` line 43) handles on-demand registration via Vite transforms, making these imports redundant and harmful.
**Fix:** Remove BOTH the import statements (lines 9–10) AND their corresponding keys in the `createVuetify()` options object (the `components,` and `directives,` lines). Both must be removed; leaving either causes a runtime reference error.

```diff
-import * as components from 'vuetify/components'
-import * as directives from 'vuetify/directives'

 export default createVuetify({
-  components,
-  directives,
```

#### Issue C — Empty `date: {}` config
**Severity:** Low
**Problem:** An empty date configuration object provides no value and implies a date adapter is configured when it is not.
**Fix:** Remove the `date: {},` line entirely. Re-add with a proper adapter if date picker functionality is added later.

#### Issue D — Excessive `variations` count
**Severity:** Medium
**Problem:** `variations: { lighten: 5, darken: 5 }` generates 70 extra CSS custom properties (7 colors × 10 levels). The codebase only references `primary-darken-1` and `primary-lighten-2` per CLAUDE.md domain patterns. Reducing this shrinks generated CSS output without losing any currently-used classes.
**Fix:** Reduce to `{ lighten: 3, darken: 3 }`.

```diff
 variations: {
   colors: ['primary', 'secondary', 'accent', 'error', 'info', 'success', 'warning'],
-  lighten: 5,
-  darken: 5
+  lighten: 3,
+  darken: 3
 }
```

#### Issue E — Light theme missing `on-background` / `on-surface`
**Severity:** Medium
**Problem:** The `darkTeal` theme defines `'on-background'` and `'on-surface'` for text contrast on those surfaces, but the `light` theme omits them entirely. Vuetify 4 uses these tokens for text rendering on `background` and `surface` colored elements. The inconsistency can cause contrast issues when switching themes.
**Fix:** Add Material Design 3 default light-theme values for these tokens. `#1C1B1F` is the MD3 spec `on-background` / `on-surface` color for light mode (near-black with warm undertone, matching Google's Material You reference implementation).

```diff
 light: {
   colors: {
     ...existing colors...
+    'on-background': '#1C1B1F',
+    'on-surface': '#1C1B1F',
   }
 }
```

---

### 2.2 `vite.config.ts`

#### Issue F — `vueDevTools` registered twice (critical bug)
**Severity:** High
**Problem:** `vueDevTools(...)` is instantiated unconditionally at lines 28–34 and added to the `plugins[]` array — this runs in ALL modes including production. It is then instantiated a second time inside `if (isDevelopment)` at lines 57–67 and pushed again. Result: devtools plugin is active in production builds and double-registered in development.
**Fix:** Remove the first unconditional `vueDevTools` block (lines 28–34) from the `plugins` array. Keep the guarded block inside `if (isDevelopment)`. The `if (vueDevToolsPlugin)` null guard in the development block is unnecessary but harmless — leave it in place to avoid scope creep.

```diff
 const plugins: PluginOption[] = [
-  vueDevTools({
-    componentInspector: {
-      enabled: false,
-      toggleComboKey: 'alt-shift',
-      launchEditor: 'code',
-    },
-  }),
   vue({ ... }),
   vuetify({ ... }),
 ]
```

#### Issue G — `vue` alias includes template compiler (add comment, no code change)
**Severity:** Low (informational only)
**Problem:** `'vue': 'vue/dist/vue.esm-bundler.js'` resolves Vue to the full build including the runtime template compiler (~30% larger). With Vite + SFCs this is normally unnecessary since Vite compiles templates at build time. Removing it without testing is risky — FullCalendar's Vue 3 adapter may require runtime compilation.
**Fix:** Add the following exact comment above the alias line and make no other change:

```diff
+// NOTE: Full Vue build (includes runtime template compiler). Normally unnecessary
+// with Vite SFCs — remove and test once FullCalendar runtime compilation is confirmed safe.
 'vue': 'vue/dist/vue.esm-bundler.js',
```

---

### 2.3 `src/styles/variables.scss`

#### Issue H — Empty file missing required `@use` wrapper
**Severity:** Medium
**Pre-conditions confirmed:**
- `variables.scss` is verified empty (whitespace only, 2 lines)
- `src/styles/main.scss` does NOT contain a `@use 'vuetify/settings'` block (it only contains `@use '../styles/responsive.scss'` and global layout resets) — no conflict
- `vite-plugin-vuetify` `styles.configFile` points to this file, meaning the file is loaded before each Vuetify stylesheet

**Problem:** Per the Vuetify SASS variables guide, this file must use `@use 'vuetify/settings' with (...)` as its wrapper. Without it, any variables added in future will silently do nothing. The `configFile` option is currently non-functional.
**Fix:** Add the correct wrapper with commented stubs. No actual variable values are changed.

```scss
// Vuetify SASS variable overrides
// Only variables, mixins, and functions here — no actual styles.
// See: https://vuetifyjs.com/features/sass-variables/
@use 'vuetify/settings' with (
  // $body-font-family: ('Roboto', sans-serif),
  // $border-radius-root: 8px,
  // $rounded-lg: 12px,
);
```

---

### 2.4 `CLAUDE.md`

#### Addition — Vuetify MCP usage section
**Problem:** No guidance exists for when or how to use the Vuetify MCP, leading to guesswork on API details and v4 compatibility questions.
**Fix:** Add a `## Vuetify MCP` section immediately after the existing `## Vuetify 3 UI/UX Patterns` section.

| Situation | Tool |
|-----------|------|
| Checking props/events/slots for any component | `get_component_api_by_version` (pass `version: "latest"` for v4) |
| Something broke after a Vuetify upgrade | `get_v4_breaking_changes` (filter by category: `v-btn`, `theme`, `v-select`, etc.) |
| Configuring theme, SASS, icons, i18n, display | `get_feature_guide` (topics: `theme`, `sass-variables`, `icon-fonts`, `display-and-platform`, `global-configuration`) |
| Directive API (`v-ripple`, `v-intersect`, etc.) | `get_directive_api_by_version` |
| Release notes for a specific version | `get_release_notes_by_version` |
| Migration from v3 → v4 | `get_upgrade_guide` with `version: "v3"` |
| Creating a repro / filing a bug | `create_vuetify_bin` + `create_bug_report` |

---

## 3. What Is NOT Changed

- No component, store, composable, or router files touched
- No new patterns introduced (contextual defaults, aliases) — deferred to a separate session
- The `vue` alias is commented but not removed (needs FullCalendar testing first)
- ESLint config is not changed (`eslint-config-vuetify@4.3.5-beta.1` is acceptable as-is)
- No actual SASS variable values are set in `variables.scss` — only the wrapper structure is added

---

## 4. Verification Steps

After applying all fixes:
1. `pnpm build` — must complete without errors or type failures
2. `pnpm dev` — confirm devtools plugin loads once (check browser console for no duplicate registration warnings)
3. `pnpm test:run` — all tests must remain green
4. Visual check: toggle between `light` and `darkTeal` themes and confirm text contrast is correct on background/surface elements

---

## 5. Out of Scope (Future Sessions)

- Contextual defaults (e.g. `VCard: { VBtn: { variant: 'text' } }`)
- Component aliases (`VBtnPrimary`, `VBtnDanger`)
- Populating actual SASS variable values in `variables.scss`
- Removing the `vue` alias after FullCalendar runtime compilation is confirmed safe
- Lazy route imports to eliminate circular chunk warnings noted in `vite.config.ts`
