---
name: claro4-vuetify
description: Claro4 Vuetify 4 UI patterns, component defaults, design rules, existing component list, and MCP workflow. Use when writing or reviewing Vue/Vuetify UI code, creating components, or doing any visual/UI work in this project.
---

## Setup
- **Version**: Vuetify 4 (`^4.0.1`) with `vite-plugin-vuetify` — components are auto-imported, no manual import needed
- **Icons**: MDI (`mdi-*`) via `@mdi/font`
- **Config**: `src/plugins/vuetify.ts` - theme colors, component defaults, breakpoints

## Component Defaults (globally configured — don't override unless necessary)
Radius rule: all components use `rounded="sm"` (2px) except buttons and chips/badges (pill).
- `VBtn`: `variant="flat"`, `rounded="pill"`, no uppercase
- `VCard`: `elevation="0"`, `rounded="sm"` (global `box-shadow: var(--claro-shadow-sm)` in `main.scss`)
- `VTextField`, `VSelect`, `VTextarea`, `VAutocomplete`, `VCombobox`: `variant="outlined"`, `density="comfortable"`, `rounded="sm"`, `hideDetails="auto"`
- `VDialog`: `max-width="700px"`, `rounded="sm"`
- `VAlert`: `variant="tonal"`, `rounded="sm"`
- `VList`, `VListItem`, `VNavigationDrawer`, `VExpansionPanel`: `rounded="sm"`
- `VChip`, `VBadge`: `rounded="pill"`

## Elevation = Hierarchy
Cards use global `--claro-shadow-sm` via `main.scss` (overrides Vuetify elevation for cards). For non-card components use `elevation` prop. NEVER add raw CSS `box-shadow` to individual components.

| Role | Elevation | Examples |
|------|-----------|----------|
| Page background | 0 | `v-main`, `v-container` |
| Grouped/nested content | 1–2 | Secondary cards inside a layout |
| Primary content card | 2–4 | Booking cards, property cards |
| Floating action / popover | 6–8 | FABs, menus, popovers |
| Modal / dialog | 12–16 | `v-dialog`, `v-bottom-sheet` |

## v-card Variant Selection

| Variant | When to use |
|---------|-------------|
| `elevated` | Primary content — bookings, properties, dashboard widgets |
| `tonal` | Secondary info — stats, role badges, status indicators |
| `outlined` | Form sections, non-interactive containers, settings groups |
| `flat` | Nested inside another card, subtle visual grouping |
| `text` | Inline links, minimal action areas |

## Transitions
Never use raw CSS transitions for show/hide when a Vuetify transition exists:
- `v-fade-transition` — dialogs, overlays, content swaps, loading states
- `v-expand-transition` — collapsible panels, accordion cards, detail reveals
- `v-slide-x-transition` — list insertions, drawer reveals, horizontal navigation
- `v-slide-y-transition` — dropdown menus, vertical reveals
- `v-scale-transition` — FABs appearing, chips being added, badge pops

## Loading, Empty, and Error States
Every data-dependent component MUST handle all three:
- **Loading**: `v-skeleton-loader` with `type` strings (e.g. `type="card, list-item-three-line@3"`). Use existing `SkeletonLoader.vue` if applicable.
- **Empty**: `v-empty-state` (Vuetify 4 native) with icon, title, text, and an action slot
- **Error**: Use existing `ErrorAlert.vue` from `src/components/dumb/shared/`

## Notification Patterns
- `v-snackbar` — transient feedback (saved, deleted, synced) — auto-dismiss 4–6s. Use existing `EnhancedToast.vue`.
- `v-banner` — persistent info (offline notice, trial expiry) — user must dismiss
- `v-bottom-sheet` — contextual action menus on mobile

## Responsive Patterns
Use `useDisplay` from Vuetify. Never use CSS media queries for layout decisions Vuetify can handle reactively.

```ts
import { useDisplay } from 'vuetify'
const { mobile, mdAndUp, lgAndUp, smAndDown } = useDisplay()
```

- **Nav drawer**: `:permanent="mdAndUp"` / `:temporary="!mdAndUp"`
- **Bottom sheet on mobile, dialog on desktop**: `v-bottom-sheet v-if="mobile"` / `v-dialog v-else`
- **Responsive grid**: `cols="12" sm="6" lg="4"` — never nest `v-row` more than 2 levels deep
- **Data table → card list on mobile**: `v-data-table v-if="!mobile"` / card loop `v-else`

## Design Depth — Forbidden
- No raw CSS `box-shadow` on individual components
- No CSS media queries for layout logic `useDisplay` handles
- No data components without loading/empty/error states
- No hardcoded hex colors — use theme tokens
- No conditional content without a Vuetify transition
- No `v-row` nested more than 2 levels deep
- No new notification components without checking `EnhancedToast.vue` first

## Theme Colors
Use semantic colors, not hex values:
- `primary`, `secondary`, `accent`, `error`, `warning`, `success`, `info`
- Domain-specific: `turn-urgent`, `turn-standard`, `booking-standard`
- Variants: `primary-darken-1`, `primary-lighten-2`

## Layout Patterns

```vue
<!-- Standard form layout -->
<v-container>
  <v-row>
    <v-col cols="12" md="6">
      <v-text-field v-model="field" label="Label" :rules="rules" />
    </v-col>
  </v-row>
</v-container>

<!-- Modal with scroll -->
<v-dialog v-model="open" persistent scrollable>
  <v-card class="d-flex flex-column" style="max-height: 90vh">
    <v-card-title>Title</v-card-title>
    <v-divider />
    <v-card-text class="grow overflow-y-auto">Content</v-card-text>
    <v-divider />
    <v-card-actions>
      <v-spacer />
      <v-btn @click="close">Cancel</v-btn>
      <v-btn color="primary" @click="save">Save</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
```

## Form Validation

```vue
<script setup lang="ts">
import type { VForm } from 'vuetify/components'

const formRef = ref<VForm | null>(null)
const formValid = ref(false)

const rules = [
  (v: string) => !!v || 'Required',
  (v: string) => v.length >= 3 || 'Min 3 characters'
]

async function submit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) return
}
</script>

<template>
  <v-form ref="formRef" v-model="formValid" @submit.prevent="submit">
    <v-text-field v-model="name" :rules="rules" />
    <v-btn type="submit" :disabled="!formValid">Submit</v-btn>
  </v-form>
</template>
```

## Existing Dumb Components
Check `src/components/dumb/{shared,owner,admin}/` before creating new UI — 70 existing components total.

**Shared (25)**: `ConfirmationDialog.vue`, `LoadingSpinner.vue`, `ErrorAlert.vue`, `SkeletonLoader.vue`, `EnhancedToast.vue`, `BookingForm.vue`, `MaterioDataTable.vue`, `MaterioFormWizard.vue`, `PropertyCard.vue`, `PropertyModal.vue`, `MobileBottomNav.vue`, `QuickActionsFab.vue`, `SmartNavigationPanel.vue`, `TurnPriorityBadge.vue`

**Admin (26)**: `CleanerAssignmentModal.vue`, `AdminBookingForm.vue`, `UrgentTurnsCard.vue`, `AdminUserWizard.vue`

**Owner (19)**: `OwnerBookingForm.vue`, `OwnerCalendarControls.vue`, `OwnerCleaningStatus.vue`

**Smart admin**: `PerformanceMetricsDashboard.vue` (owns its own data lifecycle via `usePerformanceMonitor`)

## Vuetify Reference

**Lookup order for any Vuetify component question:**
1. Read the local `docs/references/vuetify-components/{v-component}.md` — 68 files, has Claro4-specific context
2. If insufficient, call `vuetify-mcp` (never use Context7 for Vuetify)

Architecture guides: `docs/references/vuetify-sass-architecture.md`, `docs/references/vuetify-composition-patterns.md`
Component index: `docs/references/vuetify-component-index.md`

## MCP Workflow for UI/UX Changes

**Explore Phase** (before writing code)
- Take a Chrome DevTools screenshot of the current page state

**Research Phase** (before writing code)
- Vuetify components: use `vuetify-mcp` to look up props/slots/events — never guess Vuetify 4 API
- FullCalendar: Context7 `/fullcalendar/fullcalendar-docs`
- Vue 3 patterns: Context7 `/vuejs/core`

**Code Phase**
- Write changes, then take a Chrome DevTools screenshot to verify

**Debug Phase**
- Check console via Chrome DevTools for runtime errors
- Check network requests if data isn't rendering
- Use `vuetify-mcp` to verify prop usage if a component isn't behaving as expected
