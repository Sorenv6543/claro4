# Vuetify Component Reference Index

Lookup table for all 68 component reference files in `docs/references/vuetify-components/`.
Each file covers: Design Props, Slot Anatomy, Composable Hooks, SASS Hooks, and a Design→Code Cheatsheet.

Use these files **before** calling the Vuetify MCP — they include Claro4-specific context
(global defaults already set in `src/plugins/vuetify.ts`) that the MCP cannot provide.

---

## Layout (6)

| Component | File | Purpose |
|-----------|------|---------|
| `v-app` | [v-app.md](vuetify-components/v-app.md) | Root app shell, theme provider, layout context |
| `v-main` | [v-main.md](vuetify-components/v-main.md) | Page content area that adapts to sidebar/appbar offsets |
| `v-container` | [v-container.md](vuetify-components/v-container.md) | Responsive max-width content container |
| `v-row` | [v-row.md](vuetify-components/v-row.md) | 12-column flexbox grid row |
| `v-col` | [v-col.md](vuetify-components/v-col.md) | Grid column with responsive breakpoint props |
| `v-spacer` | [v-spacer.md](vuetify-components/v-spacer.md) | Flex spacer — pushes siblings apart |

---

## Navigation (7)

| Component | File | Purpose |
|-----------|------|---------|
| `v-app-bar` | [v-app-bar.md](vuetify-components/v-app-bar.md) | Top app bar with elevation, scroll behavior, density |
| `v-navigation-drawer` | [v-navigation-drawer.md](vuetify-components/v-navigation-drawer.md) | Side nav — permanent on desktop, temporary on mobile |
| `v-bottom-navigation` | [v-bottom-navigation.md](vuetify-components/v-bottom-navigation.md) | Mobile bottom tab bar |
| `v-breadcrumbs` | [v-breadcrumbs.md](vuetify-components/v-breadcrumbs.md) | Hierarchical navigation trail |
| `v-tabs` | [v-tabs.md](vuetify-components/v-tabs.md) | Tab bar container with alignment, grow, scroll |
| `v-tab` | [v-tab.md](vuetify-components/v-tab.md) | Individual tab, activated via v-model on v-tabs |
| `v-toolbar` | [v-toolbar.md](vuetify-components/v-toolbar.md) | General-purpose toolbar (base of v-app-bar) |

---

## Buttons (3)

| Component | File | Purpose |
|-----------|------|---------|
| `v-btn` | [v-btn.md](vuetify-components/v-btn.md) | Core button — Claro4 default: `variant="flat"`, `rounded` |
| `v-btn-group` | [v-btn-group.md](vuetify-components/v-btn-group.md) | Segmented button group (toggle, filter) |
| `v-fab` | [v-fab.md](vuetify-components/v-fab.md) | Floating action button with extended/mini variants |

---

## Cards (5)

| Component | File | Purpose |
|-----------|------|---------|
| `v-card` | [v-card.md](vuetify-components/v-card.md) | Surface container — Claro4 default: `elevation="0"`, `rounded` |
| `v-card-title` | [v-card-title.md](vuetify-components/v-card-title.md) | Title typography inside VCardItem |
| `v-card-subtitle` | [v-card-subtitle.md](vuetify-components/v-card-subtitle.md) | Subtitle typography inside VCardItem |
| `v-card-text` | [v-card-text.md](vuetify-components/v-card-text.md) | Body content area with `1rem` padding |
| `v-card-actions` | [v-card-actions.md](vuetify-components/v-card-actions.md) | Action button row with flex gap |

---

## Dialogs / Overlays (6)

| Component | File | Purpose |
|-----------|------|---------|
| `v-dialog` | [v-dialog.md](vuetify-components/v-dialog.md) | Modal dialog — Claro4 default: `max-width="700px"`, `rounded="lg"` |
| `v-bottom-sheet` | [v-bottom-sheet.md](vuetify-components/v-bottom-sheet.md) | Mobile contextual action sheet |
| `v-menu` | [v-menu.md](vuetify-components/v-menu.md) | Floating dropdown anchored to an element |
| `v-tooltip` | [v-tooltip.md](vuetify-components/v-tooltip.md) | Hover tooltip with directional placement |
| `v-overlay` | [v-overlay.md](vuetify-components/v-overlay.md) | Base for all floating surfaces (dialog, menu, etc.) |
| `v-snackbar` | [v-snackbar.md](vuetify-components/v-snackbar.md) | Toast notification — use `EnhancedToast.vue` wrapper |

---

## Forms (12)

| Component | File | Purpose |
|-----------|------|---------|
| `v-form` | [v-form.md](vuetify-components/v-form.md) | Form container with validation orchestration |
| `v-text-field` | [v-text-field.md](vuetify-components/v-text-field.md) | Text input — Claro4 default: `variant="outlined"`, `density="comfortable"`, `rounded="lg"` |
| `v-textarea` | [v-textarea.md](vuetify-components/v-textarea.md) | Multi-line text — same Claro4 defaults as v-text-field |
| `v-select` | [v-select.md](vuetify-components/v-select.md) | Dropdown select — same Claro4 defaults |
| `v-autocomplete` | [v-autocomplete.md](vuetify-components/v-autocomplete.md) | Typeahead select — same Claro4 defaults |
| `v-combobox` | [v-combobox.md](vuetify-components/v-combobox.md) | Free-text + select — same Claro4 defaults |
| `v-checkbox` | [v-checkbox.md](vuetify-components/v-checkbox.md) | Boolean checkbox with label |
| `v-radio` | [v-radio.md](vuetify-components/v-radio.md) | Radio button, used inside v-radio-group |
| `v-switch` | [v-switch.md](vuetify-components/v-switch.md) | Toggle switch |
| `v-slider` | [v-slider.md](vuetify-components/v-slider.md) | Range slider with ticks, thumb-label |
| `v-file-input` | [v-file-input.md](vuetify-components/v-file-input.md) | File upload input |
| `v-otp-input` | [v-otp-input.md](vuetify-components/v-otp-input.md) | One-time password / PIN input |

---

## Data Display (12)

| Component | File | Purpose |
|-----------|------|---------|
| `v-data-table` | [v-data-table.md](vuetify-components/v-data-table.md) | Sortable, paginated table — use `MaterioDataTable.vue` wrapper in Claro4 |
| `v-data-table-server` | [v-data-table-server.md](vuetify-components/v-data-table-server.md) | Server-side pagination/sort variant |
| `v-list` | [v-list.md](vuetify-components/v-list.md) | Vertical item list with density, selection, nav mode |
| `v-list-item` | [v-list-item.md](vuetify-components/v-list-item.md) | Individual list row with prepend/append areas |
| `v-list-item-title` | [v-list-item-title.md](vuetify-components/v-list-item-title.md) | Primary text inside VListItem |
| `v-list-item-subtitle` | [v-list-item-subtitle.md](vuetify-components/v-list-item-subtitle.md) | Secondary text inside VListItem |
| `v-expansion-panels` | [v-expansion-panels.md](vuetify-components/v-expansion-panels.md) | Accordion container — multiple or single mode |
| `v-expansion-panel` | [v-expansion-panel.md](vuetify-components/v-expansion-panel.md) | Individual accordion panel with title + text slots |
| `v-chip` | [v-chip.md](vuetify-components/v-chip.md) | Tag/badge chip — Claro4 default: `rounded="pill"` |
| `v-avatar` | [v-avatar.md](vuetify-components/v-avatar.md) | Circular image or icon avatar |
| `v-badge` | [v-badge.md](vuetify-components/v-badge.md) | Notification count badge — Claro4 default: `rounded="pill"` |
| `v-pagination` | [v-pagination.md](vuetify-components/v-pagination.md) | Page navigation control |

---

## Feedback (6)

| Component | File | Purpose |
|-----------|------|---------|
| `v-alert` | [v-alert.md](vuetify-components/v-alert.md) | Inline status message — Claro4 default: `variant="tonal"`, `rounded="lg"` |
| `v-banner` | [v-banner.md](vuetify-components/v-banner.md) | Persistent dismissible info bar |
| `v-progress-linear` | [v-progress-linear.md](vuetify-components/v-progress-linear.md) | Horizontal progress / loading bar |
| `v-progress-circular` | [v-progress-circular.md](vuetify-components/v-progress-circular.md) | Circular spinner / progress ring |
| `v-skeleton-loader` | [v-skeleton-loader.md](vuetify-components/v-skeleton-loader.md) | Loading placeholder — see `SkeletonLoader.vue` wrapper |
| `v-empty-state` | [v-empty-state.md](vuetify-components/v-empty-state.md) | Zero-data state with icon, title, text, action |

---

## Containers (6)

| Component | File | Purpose |
|-----------|------|---------|
| `v-sheet` | [v-sheet.md](vuetify-components/v-sheet.md) | Generic surface — background, elevation, border, rounded |
| `v-divider` | [v-divider.md](vuetify-components/v-divider.md) | Horizontal or vertical separator line |
| `v-img` | [v-img.md](vuetify-components/v-img.md) | Responsive image with aspect-ratio, lazy-load, error slot |
| `v-icon` | [v-icon.md](vuetify-components/v-icon.md) | MDI icon renderer — `mdi-*` icon names |
| `v-window` | [v-window.md](vuetify-components/v-window.md) | Slide/fade content switcher (carousel, stepper base) |
| `v-window-item` | [v-window-item.md](vuetify-components/v-window-item.md) | Individual panel inside v-window |

---

## Transitions (5)

| Component | File | Purpose |
|-----------|------|---------|
| `v-fade-transition` | [v-fade-transition.md](vuetify-components/v-fade-transition.md) | Opacity fade — dialogs, overlays, content swaps |
| `v-slide-x-transition` | [v-slide-x-transition.md](vuetify-components/v-slide-x-transition.md) | Horizontal slide — list items, drawer reveals |
| `v-slide-y-transition` | [v-slide-y-transition.md](vuetify-components/v-slide-y-transition.md) | Vertical slide — dropdowns, accordion reveals |
| `v-expand-transition` | [v-expand-transition.md](vuetify-components/v-expand-transition.md) | Height expand — collapsible panels |
| `v-scale-transition` | [v-scale-transition.md](vuetify-components/v-scale-transition.md) | Scale in/out — FABs, chips, badge pops |

---

## Quick Usage Guide

### During component scaffolding (Workflow 2)
1. Look up the component file here to find its category
2. Read `docs/references/vuetify-components/{v-component}.md` for design props, slots, SASS hooks
3. Check the "Claro4 Default" column — if a global default already covers a style, don't re-specify it
4. Use the "Design→Code Cheatsheet" to map visual intent to props
5. Only call the Vuetify MCP if the local file is insufficient

### During page restyle (Workflow 3)
- Check "SASS Hooks" to find the right override point (SASS variable / CSS custom property)
- Check "Composable Hooks" to understand what built-in behavior you get for free
- See [vuetify-sass-architecture.md](vuetify-sass-architecture.md) for the global settings layer
- See [vuetify-composition-patterns.md](vuetify-composition-patterns.md) for `useDefaults` cascade rules
