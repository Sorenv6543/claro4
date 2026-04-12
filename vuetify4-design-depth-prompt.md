# Vuetify 4 Design Depth — Claude Code Prompt

## Objective

When building or modifying UI components in this Vue 3 + Vuetify 4 codebase, apply Material Design 3 design depth principles automatically. Every component you create or edit MUST follow the elevation, variant, transition, responsive, and state patterns defined below. Do NOT use Vuetify defaults blindly — select the correct pattern for the component's role in the visual hierarchy.

## Starting State

- Vuetify 4 (`^4.0.1`) with `vite-plugin-vuetify` auto-imports
- MD3 theme configured in `src/plugins/vuetify.ts`
- Component defaults already set globally (see CLAUDE.md)
- `useDisplay` available from `vuetify` for all responsive logic
- Existing dumb components in `src/components/dumb/{shared,owner,admin}/`

## Design Rules

### 1. Elevation Is Hierarchy, Not Decoration

In MD3 dark themes, elevation applies a progressively lighter surface tint — not just shadow. In light themes, elevation is box-shadow. Use the `elevation` prop (0–24) on Vuetify components, NEVER raw CSS `box-shadow` classes unless adding hover effects.

Select elevation by component role:

| Role | Elevation | Example |
|------|-----------|---------|
| Page background | 0 | `v-main`, `v-container` |
| Grouped content | 1–2 | Secondary cards inside a layout |
| Primary content card | 2–4 | Booking cards, property cards |
| Floating action / popover | 6–8 | FABs, menus, popovers |
| Modal / dialog | 12–16 | `v-dialog`, `v-bottom-sheet` |

Add hover lift ONLY to interactive `elevated` cards:

```css
.v-card.v-card--elevated:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  transform: translateY(-2px);
  transition: box-shadow 0.2s ease, transform 0.2s ease;
}
```

### 2. v-card Variant Selection

NEVER default every card to `elevated`. Select variant by purpose:

| Variant | When to use |
|---------|-------------|
| `elevated` | Primary content cards — bookings, properties, dashboard widgets |
| `tonal` | Secondary info — stats, role badges, status indicators |
| `outlined` | Form sections, non-interactive containers, settings groups |
| `flat` | Nested inside another card, subtle visual grouping |
| `text` | Inline links, minimal action areas |

### 3. Transitions

Wrap conditional content in Vuetify transition components. NEVER use raw CSS transitions for show/hide logic when a Vuetify transition exists:

| Transition | Use for |
|------------|---------|
| `v-fade-transition` | Dialogs, overlays, content swaps, loading states |
| `v-expand-transition` | Collapsible panels, accordion cards, detail reveals |
| `v-slide-x-transition` | List insertions, drawer reveals, horizontal navigation |
| `v-slide-y-transition` | Dropdown menus, vertical reveals |
| `v-scale-transition` | FABs appearing, chips being added, badge pops |

```vue
<v-expand-transition>
  <div v-if="expanded" class="booking-details">...</div>
</v-expand-transition>
```

### 4. Loading, Empty, and Error States

Every data-dependent component MUST handle all three states:

**Loading** — use `v-skeleton-loader` with composable type strings:

```vue
<v-skeleton-loader
  :loading="isFetching"
  type="card, list-item-three-line@3"
>
  <template #default>
    <your-actual-content />
  </template>
</v-skeleton-loader>
```

**Empty** — use `v-empty-state` (native Vuetify 4):

```vue
<v-empty-state
  v-if="!items.length && !loading"
  icon="mdi-calendar-blank"
  title="No bookings yet"
  text="Schedule your first cleaning job to get started."
>
  <template #actions>
    <v-btn color="primary" @click="openNew">Add Booking</v-btn>
  </template>
</v-empty-state>
```

**Error** — use the existing `ErrorAlert.vue` dumb component from `src/components/dumb/shared/`.

### 5. Notification Pattern Selection

| Component | When to use |
|-----------|-------------|
| `v-snackbar` | Transient feedback (saved, deleted, synced) — auto-dismiss 4–6s |
| `v-banner` | Persistent info (offline notice, trial expiry) — user must dismiss |
| `v-bottom-sheet` | Contextual action menus on mobile (swipe up to confirm) |

Use the existing `EnhancedToast.vue` for snackbar patterns before creating new ones.

### 6. Responsive Patterns with `useDisplay`

ALWAYS import `useDisplay` for breakpoint-aware layouts. NEVER use CSS media queries for layout decisions that Vuetify can handle reactively.

```ts
import { useDisplay } from 'vuetify'
const { mobile, mdAndUp, lgAndUp, smAndDown } = useDisplay()
```

**Navigation drawer — permanent on desktop, temporary on mobile:**

```vue
<v-navigation-drawer
  v-model="drawer"
  :permanent="mdAndUp"
  :temporary="!mdAndUp"
>
```

**Bottom sheet on mobile, dialog on desktop:**

```vue
<v-bottom-sheet v-if="mobile" v-model="open">
  <booking-form @close="open = false" />
</v-bottom-sheet>

<v-dialog v-else v-model="open" width="640">
  <booking-form @close="open = false" />
</v-dialog>
```

**Responsive grid — mobile full-width, tablet 2-col, desktop 3-col:**

```vue
<v-row>
  <v-col
    v-for="item in items"
    :key="item.id"
    cols="12" sm="6" lg="4"
  >
    <item-card :item="item" />
  </v-col>
</v-row>
```

NEVER nest `v-row` more than two levels deep.

**Data table — card list on mobile, full table on desktop:**

```vue
<div v-if="mobile">
  <v-card v-for="item in items" :key="item.id" class="mb-2">
    <v-card-title>{{ item.name }}</v-card-title>
    <v-card-subtitle>{{ item.detail }}</v-card-subtitle>
  </v-card>
</div>

<v-data-table v-else :headers="headers" :items="items" />
```

### 7. Theme Depth

Use semantic colors from the theme (`primary`, `secondary`, `error`, `success`, `info`, `warning`) and domain colors (`turn-urgent`, `turn-standard`, `booking-standard`). NEVER hardcode hex values in components.

Typography scale and component density (`default`, `comfortable`, `compact`) are configured globally — do NOT override per-component unless the design explicitly requires it.

## Forbidden Actions

- Do NOT use raw CSS `box-shadow` instead of the `elevation` prop
- Do NOT use CSS media queries for layout logic that `useDisplay` handles
- Do NOT create components without loading, empty, and error states
- Do NOT default all `v-card` to `elevated` — select the correct variant
- Do NOT skip transitions on conditional content (show/hide, expand/collapse)
- Do NOT hardcode hex colors — use theme tokens
- Do NOT nest `v-row` more than two levels deep
- Do NOT create new notification components without checking `EnhancedToast.vue` and existing patterns first

## Checkpoints

When creating or modifying a UI component:
1. Confirm the correct `v-card` variant for its hierarchy role
2. Confirm elevation value matches the component's layer in the visual stack
3. Confirm all conditional content uses a Vuetify transition
4. Confirm loading/empty/error states are handled
5. Confirm responsive behavior uses `useDisplay`, not CSS media queries
6. Confirm mobile gets bottom-sheet or card-list pattern where appropriate
7. Take a Chrome DevTools screenshot to verify the result visually
