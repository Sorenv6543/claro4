# Vuetify MCP Reference

Quick reference for all Vuetify MCP tools available in Claude Code. Use these instead of Context7 for all Vuetify questions.

## Component & API Lookup

### `get_component_api_by_version`
Look up props, slots, and events for any Vuetify component.

```
componentName: "VCard"     # Component name (PascalCase or kebab-case)
version: "latest"          # Optional: "latest", "4.0.0", etc.
```

**Use when:** Before writing any component — verify props exist before using them.

**All components:** https://vuetifyjs.com/components/all/

### `get_directive_api_by_version`
Look up Vuetify directive API (v-ripple, v-intersect, v-scroll, etc.).

```
directiveName: "v-ripple"  # Or just "ripple"
version: "latest"
```

### `get_vuetify_api_by_version`
Download and cache the full Vuetify API types for a version. Returns everything — components, directives, composables.

```
version: "latest"
```

**Use when:** You need a broad overview of what's available, not a specific component.

### `get_exposed_exports`
List all exports from the Vuetify npm package (composables, utilities, types).

**Use when:** Checking what can be imported from `vuetify` or `vuetify/components`.

## Feature Guides

### `get_feature_guides`
List all available feature documentation topics (no params).

### `get_feature_guide`
Get detailed docs for a specific feature.

```
feature: "theme"   # One of the available features below
```

**Available features:**

| Feature | What it covers |
|---------|---------------|
| `accessibility` | A11y best practices, ARIA, keyboard nav |
| `aliasing` | Component aliases for custom names |
| `application-layout` | v-app, v-main, v-app-bar, v-navigation-drawer, v-footer layout system |
| `blueprints` | Pre-made design presets (MD1, MD2, MD3) |
| `dates` | Date adapter configuration |
| `display-and-platform` | `useDisplay` composable, breakpoints, platform detection |
| `global-configuration` | Component defaults, `defaults` config |
| `icon-fonts` | MDI, Font Awesome, custom icon sets |
| `internationalization` | i18n, RTL support |
| `programmatic-scrolling` | `useGoTo` composable |
| `sass-variables` | Customizing Vuetify SASS variables |
| `theme` | Theme configuration, dark/light mode, custom colors |

## Migration & Versioning

### `get_v4_breaking_changes`
Get Vuetify 4 breaking changes with migration guidance.

```
category: "v-btn"  # Optional filter. Omit for all changes.
```

**Available categories:** `styles`, `theme`, `display`, `grid`, `typography`, `elevation`, `v-btn`, `v-snackbar`, `v-select`, `v-date-picker`, `v-form`, `v-img`, `nested`

**Use when:** Something broke after upgrading, or before using a v3 pattern in v4.

### `get_upgrade_guide`
Full migration guide between major versions.

```
version: "v3"   # Source version: "v1.5", "v2.7", or "v3"
```

### `get_release_notes_by_version`
Release notes for any version.

```
version: "latest"   # Or specific: "4.0.0"
```

## Installation

### `get_installation_guide`
Platform-specific installation instructions.

```
platform: "vite"   # "vite", "nuxt", "nuxt-module", "laravel", "cdn", "cdn-esm", "vitepress", "vuetify0"
fresh: false       # true if starting from scratch
ssr: false         # true for SSR setup
```

## FAQ

### `get_frequently_asked_questions`
Common Vuetify questions and answers (no params).

## Playground & Bins

### `create_vuetify_playground`
Create a live Vue SFC playground on Vuetify's platform. Requires `VUETIFY_API_KEY`.

```
content: "<template>...</template>"   # Vue SFC content
title: "My playground"
visibility: "public"                  # "public" or "private"
```

### `create_vuetify_bin`
Create a Vuetify bin (code snippet). Requires `VUETIFY_API_KEY`.

```
content: "..."
title: "My bin"
language: "markdown"
visibility: "public"
```

### `get_all_playgrounds` / `get_all_bins`
List your saved playgrounds/bins.

### `update_vuetify_playground` / `update_vuetify_bin`
Update existing playground/bin by ID.

## Bug Reports

### `create_bug_report`
Generate a link to file a bug report.

```
repo: "vuetify"   # "vuetify", "vuetify/docs", "vuetify0", "mcp", "play", "bin", etc.
label: "v-card"   # Optional label
```

## Vuetify0 (Headless Meta-Framework)

These tools are for `@vuetify/v0` — a headless component library that provides unstyled building blocks. Separate from Vuetify 4.

| Tool | Purpose |
|------|---------|
| `get_vuetify0_component_list` | List all 46 headless components |
| `get_vuetify0_component_guide` | Detailed docs for a specific component (Alert, Button, Dialog, DataGrid, Form, Tabs, etc.) |
| `get_vuetify0_composable_list` | List all 63 composables by category |
| `get_vuetify0_composable_guide` | Detailed docs for a specific composable |
| `get_vuetify0_exports_list` | List all subpath exports |
| `get_vuetify0_installation_guide` | Installation instructions |
| `get_vuetify0_package_guide` | Package documentation |
| `get_vuetify0_skill` | AI-optimized reference with patterns and anti-patterns |
| `get_vuetify_one_installation_guide` | `@vuetify/one` package README |

## Official Vuetify Documentation

The MCP covers API lookups and feature guides, but for visual examples and wireframes, use the official docs directly:

| Resource | URL | What it provides |
|----------|-----|-----------------|
| **All Components** | https://vuetifyjs.com/components/all/ | Interactive examples for every component |
| **Wireframes** | https://vuetifyjs.com/en/getting-started/wireframes/ | Pre-built page layout templates (requires browser — JS-rendered) |
| **Blueprints** | Use `get_feature_guide("blueprints")` | MD1/MD2/MD3 design presets via MCP |
| **Application Layout** | Use `get_feature_guide("application-layout")` | Layout system docs via MCP |
| **Theme** | Use `get_feature_guide("theme")` | Theme configuration via MCP |
| **Display** | Use `get_feature_guide("display-and-platform")` | `useDisplay`, breakpoints via MCP |
| **Global Config** | Use `get_feature_guide("global-configuration")` | Component defaults via MCP |

### When to use the website vs MCP

- **Use MCP** for: component API (props/slots/events), feature guides, breaking changes, upgrade guides, FAQ — structured data that feeds directly into code generation
- **Use website** for: visual wireframe examples, interactive component demos, seeing how components look with real data — things that need a browser to render
- **Never use Context7** for Vuetify — the MCP is the authoritative source

## Quick Recipes for This Project

### Look up a component before using it
```
get_component_api_by_version({ componentName: "VDataTable", version: "latest" })
```

### Check if a v3 pattern still works in v4
```
get_v4_breaking_changes({ category: "v-btn" })
```

### Understand the layout system
```
get_feature_guide({ feature: "application-layout" })
```

### Configure theme colors
```
get_feature_guide({ feature: "theme" })
```

### Check useDisplay breakpoints
```
get_feature_guide({ feature: "display-and-platform" })
```
