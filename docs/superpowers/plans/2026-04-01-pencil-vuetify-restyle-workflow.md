# Pencil-to-Vuetify Restyle Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the full Claro4 app using the Materio `.pen` component library as visual source of truth, with a token bridge architecture, selective wrapper components, and two-way Pencil sync.

**Architecture:** Shared CSS custom properties file (`src/styles/tokens.css`) bridges Pencil design variables and Vuetify theme config. Three wrapper components (`DashboardCard`, `StatCard`, `DashboardShell`) handle patterns stock Vuetify can't express via tokens alone. Per-page restyle follows a 5-phase MCP workflow (Capture → Read → Research → Implement → Verify).

**Tech Stack:** Vue 3, Vuetify 4, Pencil MCP, Chrome DevTools MCP, Vuetify MCP, CSS Custom Properties

**Spec:** `docs/superpowers/specs/2026-04-01-pencil-vuetify-restyle-workflow-design.md`

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/styles/tokens.css` | CSS custom properties — single source of truth for all design values |
| `src/components/dumb/shared/DashboardCard.vue` | Materio card wrapper: header with icon badge, accent bar, content, actions |
| `src/components/dumb/shared/StatCard.vue` | Materio KPI widget: large number, trend indicator, icon with colored circle |
| `src/components/dumb/shared/DashboardShell.vue` | Materio layout shell: app bar + sidebar + content with gradient/surface treatments |

### Modified Files
| File | What Changes |
|------|-------------|
| `src/styles/main.scss` (line 2) | Add `tokens.css` import |
| `src/plugins/vuetify.ts` (lines 52-69, 16-36) | Replace hardcoded hex colors with CSS variable references |
| `src/layouts/ownerThemes.ts` | Update theme swatches to reference token-derived values |
| `src/styles/calendar-tokens.css` | Migrate to consume from `tokens.css` (deferred to calendar phase) |
| `src/components/dumb/owner/OwnerWelcomeBanner.vue` | Consume `StatCard` wrapper, token gradients |
| `src/components/dumb/owner/OwnerPropertySummaryCards.vue` | Wrap with `DashboardCard`, token colors |
| `src/components/dumb/owner/OwnerUpcomingBookings.vue` | Wrap with `DashboardCard` |
| `src/components/dumb/owner/OwnerRecentActivity.vue` | Wrap with `DashboardCard`, token timeline colors |
| `src/components/dumb/owner/OwnerCleaningStatus.vue` | Wrap with `DashboardCard`, token chip colors |
| `src/layouts/owner.vue` | Apply `DashboardShell` wrapper, token-driven styling |
| All owner page components | Replace hardcoded colors with token references |
| All admin page components | Replace hardcoded colors with token references |
| Auth page components | Replace hardcoded colors with token references |

---

## Prerequisites

Before starting, ensure:
1. **Pencil MCP** is connected (the `.pen` file must be focused in VS Code)
2. **Chrome DevTools MCP** is connected (Chrome debug session on port 9222)
3. **Vuetify MCP** is available
4. **Dev server** running: `pnpm dev` on `localhost:3000`
5. Chrome navigated to `http://localhost:3000/owner/overview`

---

## Task 1: Create Feature Branch

**Files:** None (git only)

- [ ] **Step 1: Create and switch to the restyle branch**

```bash
cd c:/Users/Soren/claro4
git checkout main
git pull origin main
git checkout -b feature/materio-restyle
```

- [ ] **Step 2: Verify branch**

Run: `git branch --show-current`
Expected: `feature/materio-restyle`

---

## Task 2: Extract Design Tokens from .pen File

**Files:**
- Create: `src/styles/tokens.css`
- Modify: `src/styles/main.scss`

- [ ] **Step 1: Open the .pen file via Pencil MCP**

```
Pencil MCP: open_document("design/materio-vuetify.lib.pen")
```

Wait for confirmation that the document is loaded.

- [ ] **Step 2: Get editor state with schema**

```
Pencil MCP: get_editor_state({ include_schema: true })
```

Note the document structure and available nodes. Save the schema for reference — you only need it once per conversation.

- [ ] **Step 3: Extract all design variables**

```
Pencil MCP: get_variables()
```

This returns all Pencil variables: colors, spacing, radii, shadows, typography. Record every variable name and value — these become the CSS custom properties in `tokens.css`.

- [ ] **Step 4: Discover reusable components**

```
Pencil MCP: batch_get(filePath, patterns: [{ reusable: true }], readDepth: 2)
```

This returns all reusable component nodes. Note which ones correspond to cards, stat widgets, buttons, navigation — these inform which wrappers are needed.

- [ ] **Step 5: Screenshot key components for visual reference**

For each reusable component that maps to a dashboard element (cards, stat widgets, shell layout):
```
Pencil MCP: get_screenshot(nodeId)
```

Save screenshots as visual reference for implementation.

- [ ] **Step 6: Create `src/styles/tokens.css` with extracted values**

Create the file with all extracted Pencil variables mapped to CSS custom properties. Use the `--claro-` prefix for all tokens.

```css
/* src/styles/tokens.css
 * Design tokens extracted from design/materio-vuetify.lib.pen
 * Two-way sync: Pencil get_variables() <-> this file <-> set_variables()
 * DO NOT hardcode values elsewhere — reference these tokens.
 */

:root {
  /* Colors — primary palette
   * Values below come from Pencil MCP get_variables()
   * Replace placeholders with actual extracted values */
  --claro-primary: /* from Pencil: primary color */;
  --claro-primary-light: /* from Pencil: primary-light */;
  --claro-primary-dark: /* from Pencil: primary-dark */;
  --claro-secondary: /* from Pencil: secondary color */;
  --claro-accent: /* from Pencil: accent color */;

  /* Colors — surfaces */
  --claro-background: /* from Pencil: background */;
  --claro-surface: /* from Pencil: surface */;
  --claro-surface-variant: /* from Pencil: surface-variant */;
  --claro-card-bg: /* from Pencil: card background */;

  /* Colors — semantic */
  --claro-success: /* from Pencil: success */;
  --claro-warning: /* from Pencil: warning */;
  --claro-error: /* from Pencil: error */;
  --claro-info: /* from Pencil: info */;

  /* Colors — domain-specific */
  --claro-turn-urgent: /* from Pencil or keep existing #F44336 */;
  --claro-turn-standard: /* from Pencil or keep existing #FF9800 */;
  --claro-booking-standard: /* from Pencil or keep existing #4CAF50 */;

  /* Colors — text */
  --claro-on-background: /* from Pencil: on-background */;
  --claro-on-surface: /* from Pencil: on-surface */;

  /* Typography */
  --claro-font-family: /* from Pencil: font family, likely 'Inter', sans-serif */;
  --claro-font-weight-regular: 400;
  --claro-font-weight-medium: 500;
  --claro-font-weight-semibold: 600;

  /* Spacing scale */
  --claro-space-xs: /* from Pencil: xs spacing, e.g. 4px */;
  --claro-space-sm: /* from Pencil: sm spacing, e.g. 8px */;
  --claro-space-md: /* from Pencil: md spacing, e.g. 16px */;
  --claro-space-lg: /* from Pencil: lg spacing, e.g. 24px */;
  --claro-space-xl: /* from Pencil: xl spacing, e.g. 32px */;

  /* Shape */
  --claro-radius-sm: /* from Pencil: small radius, e.g. 4px */;
  --claro-radius-md: /* from Pencil: medium radius, e.g. 8px */;
  --claro-radius-lg: /* from Pencil: large radius, e.g. 12px */;
  --claro-radius-pill: 9999px;

  /* Elevation / shadows */
  --claro-shadow-sm: /* from Pencil: small shadow */;
  --claro-shadow-md: /* from Pencil: medium shadow */;
  --claro-shadow-lg: /* from Pencil: large shadow */;

  /* Gradients */
  --claro-gradient-primary: /* from Pencil: primary gradient */;
  --claro-gradient-surface: /* from Pencil: surface gradient */;

  /* Layout dimensions */
  --claro-app-bar-height: 64px;
  --claro-app-bar-height-mobile: 56px;
  --claro-drawer-width: 380px;
  --claro-drawer-width-collapsed: 72px;
  --claro-content-padding: 24px;
  --claro-content-padding-mobile: 12px;

  /* Responsive spacing */
  --claro-card-gap: var(--claro-space-md);
  --claro-card-padding: var(--claro-space-md);
  --claro-section-gap: var(--claro-space-lg);

  /* Touch targets */
  --claro-touch-target-min: 44px;

  /* Density */
  --claro-input-density: comfortable;
}

/* Mobile overrides */
@media (max-width: 599px) {
  :root {
    --claro-card-gap: var(--claro-space-sm);
    --claro-card-padding: var(--claro-space-sm);
    --claro-section-gap: var(--claro-space-md);
    --claro-content-padding: var(--claro-content-padding-mobile);
    --claro-input-density: compact;
  }
}

/* Tablet */
@media (min-width: 600px) and (max-width: 959px) {
  :root {
    --claro-card-gap: var(--claro-space-sm);
    --claro-card-padding: var(--claro-space-md);
    --claro-drawer-width: 320px;
  }
}
```

**Important:** Replace every `/* from Pencil: ... */` placeholder with the actual value returned by `get_variables()` in Step 3. Do NOT leave placeholders.

- [ ] **Step 7: Import tokens.css in main.scss**

In `src/styles/main.scss`, add the import after line 2 (after the responsive.scss import):

```scss
@use '../styles/responsive.scss';
@import '../styles/tokens.css';
```

- [ ] **Step 8: Verify build**

Run: `pnpm build:fast`
Expected: Build succeeds with no errors.

- [ ] **Step 9: Commit**

```bash
git add src/styles/tokens.css src/styles/main.scss
git commit -m "tokens: extract design tokens from .pen file into tokens.css"
```

---

## Task 3: Wire Vuetify Theme to Token File

**Files:**
- Modify: `src/plugins/vuetify.ts` (lines 16-69, 150+)
- Modify: `src/layouts/ownerThemes.ts`

- [ ] **Step 1: Research Vuetify 4 theme CSS variable support**

```
Vuetify MCP: get_feature_guide("theme")
```

Confirm how Vuetify 4 resolves CSS variable values in theme color definitions. Vuetify 4 supports CSS color values directly — `primary: 'var(--claro-primary)'` should work.

- [ ] **Step 2: Update light theme colors in vuetify.ts**

In `src/plugins/vuetify.ts`, replace the light theme color block (lines 52-69) to reference tokens:

```typescript
light: {
  dark: false,
  colors: {
    primary: 'var(--claro-primary)',
    secondary: 'var(--claro-secondary)',
    accent: 'var(--claro-accent)',
    error: 'var(--claro-error)',
    info: 'var(--claro-info)',
    success: 'var(--claro-success)',
    warning: 'var(--claro-warning)',
    background: 'var(--claro-background)',
    surface: 'var(--claro-surface)',
    'surface-variant': 'var(--claro-surface-variant)',
    'turn-urgent': 'var(--claro-turn-urgent)',
    'turn-standard': 'var(--claro-turn-standard)',
    'booking-standard': 'var(--claro-booking-standard)',
    'on-background': 'var(--claro-on-background)',
    'on-surface': 'var(--claro-on-surface)',
  },
},
```

**Note:** If Vuetify 4 does not accept CSS variables directly in theme colors (verify in Step 1), use a JS import of the token values instead. Read tokens.css at build time or define a parallel JS object that mirrors the CSS file.

- [ ] **Step 3: Update darkTeal theme colors**

The darkTeal theme (lines 16-36) needs its own set of token overrides. Add dark theme tokens to `tokens.css` under a `[data-theme="darkTeal"]` or `.v-theme--darkTeal` selector, OR define separate `--claro-dark-*` variables. Choose the approach that Vuetify 4 supports best based on Step 1 research.

- [ ] **Step 4: Update ownerThemes.ts swatches**

In `src/layouts/ownerThemes.ts`, update the swatch values to match tokens:

```typescript
export const THEMES: ThemeSwatch[] = [
  {
    id: 'light',
    label: 'Light',
    primary: 'var(--claro-primary)',
    background: 'var(--claro-background)',
    surface: 'var(--claro-surface)',
  },
  {
    id: 'darkTeal',
    label: 'Dark Teal',
    primary: '#26A69A', // dark theme keeps its own values for now
    background: '#121212',
    surface: '#1E1E1E',
  },
]
```

**Note:** The ThemeSwatch `primary`/`background`/`surface` fields are used for visual swatch display in the dev theme picker. If CSS variables don't render in the swatch preview, keep hex values here but ensure they match the token values.

- [ ] **Step 5: Verify the app renders correctly**

Run: `pnpm dev`

Navigate to `http://localhost:3000/owner/overview` in the debug Chrome session.

```
Chrome DevTools MCP: take_screenshot()
```

Verify colors render as expected. If anything is broken (white text on white background, missing colors), the Vuetify theme may not support CSS variables directly — fall back to JS token import.

- [ ] **Step 6: Verify build**

Run: `pnpm build:fast`
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/plugins/vuetify.ts src/layouts/ownerThemes.ts
git commit -m "theme: wire vuetify.ts to token file CSS variables"
```

---

## Task 4: Create DashboardCard Wrapper

**Files:**
- Create: `src/components/dumb/shared/DashboardCard.vue`

- [ ] **Step 1: Research v-card API**

```
Vuetify MCP: get_component_api_by_version({ component: "VCard", version: "4" })
```

Note available props and slots so the wrapper stays idiomatic.

- [ ] **Step 2: Screenshot Materio card component from .pen**

```
Pencil MCP: get_screenshot(nodeId)
```

Use the card component nodeId discovered in Task 2 Step 4. Study the anatomy: header area, accent bar, icon badge, content area, action area.

- [ ] **Step 3: Create DashboardCard.vue**

```vue
<!-- src/components/dumb/shared/DashboardCard.vue -->
<script setup lang="ts">
defineProps<{
  title?: string
  icon?: string
  accentColor?: string
  flat?: boolean
}>()
</script>

<template>
  <v-card
    :class="['dashboard-card', { 'dashboard-card--accent': accentColor }]"
    :style="accentColor ? { '--card-accent': accentColor } : undefined"
    :flat="flat"
  >
    <v-card-title v-if="title || $slots.header" class="dashboard-card__header">
      <slot name="header">
        <v-icon v-if="icon" :icon="icon" size="20" class="mr-2" />
        <span>{{ title }}</span>
      </slot>
      <v-spacer />
      <slot name="header-actions" />
    </v-card-title>
    <v-divider v-if="title || $slots.header" />
    <v-card-text class="dashboard-card__content">
      <slot />
    </v-card-text>
    <v-card-actions v-if="$slots.actions" class="dashboard-card__actions">
      <slot name="actions" />
    </v-card-actions>
  </v-card>
</template>

<style scoped>
.dashboard-card {
  background: var(--claro-card-bg, var(--claro-surface));
  border-radius: var(--claro-radius-lg);
  box-shadow: var(--claro-shadow-sm);
  padding: var(--claro-card-padding);
}

.dashboard-card--accent {
  border-left: 4px solid var(--card-accent);
}

.dashboard-card__header {
  font-weight: var(--claro-font-weight-semibold);
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  padding: var(--claro-space-sm) var(--claro-space-md);
}

.dashboard-card__content {
  padding: var(--claro-space-md);
}

.dashboard-card__actions {
  padding: var(--claro-space-sm) var(--claro-space-md);
}
</style>
```

- [ ] **Step 4: Verify build**

Run: `pnpm build:fast`
Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add src/components/dumb/shared/DashboardCard.vue
git commit -m "wrapper: add DashboardCard component consuming design tokens"
```

---

## Task 5: Create StatCard Wrapper

**Files:**
- Create: `src/components/dumb/shared/StatCard.vue`

- [ ] **Step 1: Screenshot Materio stat/KPI widget from .pen**

```
Pencil MCP: get_screenshot(nodeId)
```

Use the stat widget nodeId from Task 2 Step 4. Study: large number placement, trend arrow, icon circle, color usage.

- [ ] **Step 2: Create StatCard.vue**

```vue
<!-- src/components/dumb/shared/StatCard.vue -->
<script setup lang="ts">
defineProps<{
  value: string | number
  label: string
  icon: string
  trend?: 'up' | 'down' | 'flat'
  trendValue?: string
  color?: string
}>()
</script>

<template>
  <v-card class="stat-card" flat>
    <div class="stat-card__body">
      <div class="stat-card__info">
        <span class="stat-card__value">{{ value }}</span>
        <span class="stat-card__label">{{ label }}</span>
        <span v-if="trend && trendValue" :class="['stat-card__trend', `stat-card__trend--${trend}`]">
          <v-icon
            :icon="trend === 'up' ? 'mdi-trending-up' : trend === 'down' ? 'mdi-trending-down' : 'mdi-minus'"
            size="14"
          />
          {{ trendValue }}
        </span>
      </div>
      <div
        class="stat-card__icon-circle"
        :style="{ background: color || 'var(--claro-primary)' }"
      >
        <v-icon :icon="icon" size="24" color="white" />
      </div>
    </div>
  </v-card>
</template>

<style scoped>
.stat-card {
  background: var(--claro-card-bg, var(--claro-surface));
  border-radius: var(--claro-radius-lg);
  box-shadow: var(--claro-shadow-sm);
  padding: var(--claro-space-md);
}

.stat-card__body {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-card__info {
  display: flex;
  flex-direction: column;
  gap: var(--claro-space-xs);
}

.stat-card__value {
  font-size: 1.75rem;
  font-weight: var(--claro-font-weight-semibold);
  line-height: 1;
}

.stat-card__label {
  font-size: 0.85rem;
  opacity: 0.7;
}

.stat-card__trend {
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 2px;
}

.stat-card__trend--up {
  color: var(--claro-success);
}

.stat-card__trend--down {
  color: var(--claro-error);
}

.stat-card__trend--flat {
  opacity: 0.5;
}

.stat-card__icon-circle {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
```

- [ ] **Step 3: Verify build**

Run: `pnpm build:fast`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/dumb/shared/StatCard.vue
git commit -m "wrapper: add StatCard component consuming design tokens"
```

---

## Task 6: Create DashboardShell Wrapper

**Files:**
- Create: `src/components/dumb/shared/DashboardShell.vue`

- [ ] **Step 1: Screenshot Materio shell/layout from .pen**

```
Pencil MCP: get_screenshot(nodeId)
```

Use the shell/layout nodeId from Task 2 Step 4. Study: content area background, sidebar treatment, spacing between sections.

- [ ] **Step 2: Create DashboardShell.vue**

```vue
<!-- src/components/dumb/shared/DashboardShell.vue -->
<script setup lang="ts">
defineProps<{
  maxWidth?: string | number
  noPadding?: boolean
}>()
</script>

<template>
  <div
    class="dashboard-shell"
    :class="{ 'dashboard-shell--no-padding': noPadding }"
    :style="maxWidth ? { maxWidth: typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth } : undefined"
  >
    <slot name="header" />
    <div class="dashboard-shell__content">
      <slot />
    </div>
    <slot name="footer" />
  </div>
</template>

<style scoped>
.dashboard-shell {
  width: 100%;
  min-height: 100%;
  background: var(--claro-background);
  padding: var(--claro-content-padding);
}

.dashboard-shell--no-padding {
  padding: 0;
}

.dashboard-shell__content {
  display: flex;
  flex-direction: column;
  gap: var(--claro-section-gap);
}

@media (max-width: 599px) {
  .dashboard-shell {
    padding: var(--claro-content-padding-mobile);
  }
}
</style>
```

- [ ] **Step 3: Verify build**

Run: `pnpm build:fast`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/dumb/shared/DashboardShell.vue
git commit -m "wrapper: add DashboardShell layout component consuming design tokens"
```

---

## Task 7: Capture Before State of Owner Overview

**Files:** None (screenshots only)

- [ ] **Step 1: Navigate to owner overview**

```
Chrome DevTools MCP: navigate_page({ url: "http://localhost:3000/owner/overview" })
```

- [ ] **Step 2: Take before screenshot**

```
Chrome DevTools MCP: take_screenshot()
```

Save this as the "before" baseline for visual comparison.

- [ ] **Step 3: Take DOM snapshot**

```
Chrome DevTools MCP: take_snapshot()
```

Note the current DOM structure for reference during implementation.

---

## Task 8: Restyle OwnerWelcomeBanner

**Files:**
- Modify: `src/components/dumb/owner/OwnerWelcomeBanner.vue`

- [ ] **Step 1: Screenshot matching Pencil component**

Identify the welcome banner / hero section in the .pen file:
```
Pencil MCP: batch_get(filePath, patterns: [{ reusable: true }], readDepth: 2)
```

Find the welcome/hero component, then:
```
Pencil MCP: get_screenshot(nodeId)
```

- [ ] **Step 2: Research Vuetify components used**

```
Vuetify MCP: get_component_api_by_version({ component: "VProgressCircular", version: "4" })
```

The banner uses `v-progress-circular` for the donut chart — confirm available props for styling.

- [ ] **Step 3: Update OwnerWelcomeBanner.vue**

Replace hardcoded color values and inline styles with token references. The key changes:

1. Replace the gradient background (currently using theme variables) with `var(--claro-gradient-primary)` or token-derived gradient
2. Replace stat-icon-wrap background colors with token references
3. Replace stat-pill styling with token spacing/radii
4. Integrate `StatCard` for the individual stat items if the .pen design uses that pattern, OR keep the existing stat pills but restyle them with tokens

The exact changes depend on the .pen file's banner design. Read the current component:

```
Current file: src/components/dumb/owner/OwnerWelcomeBanner.vue (117 lines)
```

Update the `<style>` section to replace all hardcoded values:
- `background: linear-gradient(...)` → use `var(--claro-gradient-primary)` or token colors
- Any hardcoded px values for padding/margin → use `var(--claro-space-*)` tokens
- Any hardcoded border-radius → use `var(--claro-radius-*)` tokens
- Any hardcoded box-shadow → use `var(--claro-shadow-*)` tokens
- Any hardcoded colors → use `var(--claro-*)` color tokens

- [ ] **Step 4: Verify visually**

```
Chrome DevTools MCP: take_screenshot()
```

Compare to the .pen screenshot from Step 1. If significant differences remain, iterate.

- [ ] **Step 5: Verify build**

Run: `pnpm build:fast`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/dumb/owner/OwnerWelcomeBanner.vue
git commit -m "restyle: owner overview welcome banner with design tokens"
```

---

## Task 9: Restyle OwnerPropertySummaryCards

**Files:**
- Modify: `src/components/dumb/owner/OwnerPropertySummaryCards.vue`

- [ ] **Step 1: Screenshot matching Pencil component**

Find the property summary / list card in the .pen file:
```
Pencil MCP: get_screenshot(nodeId)
```

- [ ] **Step 2: Wrap with DashboardCard**

Update the component template to use `DashboardCard` as the outer wrapper instead of a bare `v-card`:

```vue
<template>
  <DashboardCard title="Property Summary" icon="mdi-home-group">
    <!-- existing v-list content moves inside the default slot -->
    <v-list v-if="properties.length" dense>
      <!-- existing list items... -->
    </v-list>
    <div v-else class="text-center py-4">
      <!-- existing empty state... -->
    </div>
  </DashboardCard>
</template>
```

- [ ] **Step 3: Replace hardcoded styles with tokens**

In the `<style>` section:
- `color-dot` → keep structure, replace any hardcoded sizing with tokens
- `property-row` → replace background hover colors with token references: `background: rgba(var(--v-theme-on-surface), 0.04)` → `background: color-mix(in srgb, var(--claro-on-surface) 4%, transparent)`
- Occupancy bar colors → continue using the `occupancyColor()` computed (returns semantic names), but the underlying semantic colors now come from tokens

- [ ] **Step 4: Verify visually**

```
Chrome DevTools MCP: take_screenshot()
```

- [ ] **Step 5: Verify build**

Run: `pnpm build:fast`
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/components/dumb/owner/OwnerPropertySummaryCards.vue
git commit -m "restyle: owner overview property summary cards with DashboardCard wrapper"
```

---

## Task 10: Restyle OwnerUpcomingBookings

**Files:**
- Modify: `src/components/dumb/owner/OwnerUpcomingBookings.vue`

- [ ] **Step 1: Screenshot matching Pencil component**

```
Pencil MCP: get_screenshot(nodeId)
```

- [ ] **Step 2: Wrap with DashboardCard**

```vue
<template>
  <DashboardCard title="Upcoming Bookings" icon="mdi-calendar-clock">
    <template #header-actions>
      <v-btn variant="text" size="small" to="/owner/dashboard">
        View Calendar
      </v-btn>
    </template>
    <!-- existing v-list content -->
    <v-list v-if="bookings.length" dense>
      <!-- existing list items with date badges... -->
    </v-list>
    <div v-else class="text-center py-4">
      <!-- existing empty state... -->
    </div>
  </DashboardCard>
</template>
```

- [ ] **Step 3: Replace hardcoded styles with tokens**

- `date-badge` background → use token-derived color with property color tinting
- Padding/margin → `var(--claro-space-*)` tokens
- Border-radius → `var(--claro-radius-*)` tokens
- Chip colors (type, status) → semantic colors from tokens

- [ ] **Step 4: Verify visually**

```
Chrome DevTools MCP: take_screenshot()
```

- [ ] **Step 5: Verify build**

Run: `pnpm build:fast`

- [ ] **Step 6: Commit**

```bash
git add src/components/dumb/owner/OwnerUpcomingBookings.vue
git commit -m "restyle: owner overview upcoming bookings with DashboardCard wrapper"
```

---

## Task 11: Restyle OwnerRecentActivity

**Files:**
- Modify: `src/components/dumb/owner/OwnerRecentActivity.vue`

- [ ] **Step 1: Screenshot matching Pencil component**

```
Pencil MCP: get_screenshot(nodeId)
```

- [ ] **Step 2: Wrap with DashboardCard**

```vue
<template>
  <DashboardCard title="Recent Activity" icon="mdi-history">
    <v-timeline v-if="activities.length" density="compact" side="end">
      <!-- existing timeline items... -->
    </v-timeline>
    <div v-else class="text-center py-4">
      <!-- existing empty state... -->
    </div>
  </DashboardCard>
</template>
```

- [ ] **Step 3: Replace hardcoded styles with tokens**

- Timeline dot colors → `activityColor()` returns semantic names, now resolved via tokens
- Text colors → `var(--claro-on-surface)` with opacity
- Spacing → `var(--claro-space-*)` tokens

- [ ] **Step 4: Verify visually**

```
Chrome DevTools MCP: take_screenshot()
```

- [ ] **Step 5: Verify build**

Run: `pnpm build:fast`

- [ ] **Step 6: Commit**

```bash
git add src/components/dumb/owner/OwnerRecentActivity.vue
git commit -m "restyle: owner overview recent activity with DashboardCard wrapper"
```

---

## Task 12: Restyle OwnerCleaningStatus

**Files:**
- Modify: `src/components/dumb/owner/OwnerCleaningStatus.vue`

- [ ] **Step 1: Screenshot matching Pencil component**

```
Pencil MCP: get_screenshot(nodeId)
```

- [ ] **Step 2: Wrap with DashboardCard**

```vue
<template>
  <DashboardCard title="Cleaning Status" icon="mdi-broom">
    <v-table v-if="cleanings.length" hover>
      <!-- existing table... -->
    </v-table>
    <div v-else class="text-center py-4">
      <!-- existing empty state... -->
    </div>
  </DashboardCard>
</template>
```

- [ ] **Step 3: Replace hardcoded styles with tokens**

- `color-dot` → token border-radius, keep dynamic property color
- Status chip colors → semantic colors from tokens
- Table row hover → token surface-variant color

- [ ] **Step 4: Verify visually**

```
Chrome DevTools MCP: take_screenshot()
```

- [ ] **Step 5: Verify build**

Run: `pnpm build:fast`

- [ ] **Step 6: Commit**

```bash
git add src/components/dumb/owner/OwnerCleaningStatus.vue
git commit -m "restyle: owner overview cleaning status with DashboardCard wrapper"
```

---

## Task 13: Restyle OwnerMiniCalendar and UrgentTurnsBanner

**Files:**
- Modify: `src/components/dumb/owner/OwnerMiniCalendar.vue`
- Modify: `src/components/dumb/owner/OwnerUrgentTurnsBanner.vue`

- [ ] **Step 1: Update OwnerMiniCalendar**

Wrap with `DashboardCard` if it uses a card pattern. Replace hardcoded colors with token references. The mini calendar is a lighter touch — mainly surface colors and spacing.

- [ ] **Step 2: Update OwnerUrgentTurnsBanner**

This is an alert banner, not a card. Replace hardcoded colors with token references:
- Urgent color → `var(--claro-turn-urgent)` or `var(--claro-error)`
- Background → token surface with error tint

- [ ] **Step 3: Verify visually**

```
Chrome DevTools MCP: take_screenshot()
```

- [ ] **Step 4: Verify build**

Run: `pnpm build:fast`

- [ ] **Step 5: Commit**

```bash
git add src/components/dumb/owner/OwnerMiniCalendar.vue src/components/dumb/owner/OwnerUrgentTurnsBanner.vue
git commit -m "restyle: owner overview mini calendar and urgent turns banner with tokens"
```

---

## Task 14: Restyle Owner Layout Shell

**Files:**
- Modify: `src/layouts/owner.vue`

- [ ] **Step 1: Screenshot Materio shell/navigation from .pen**

```
Pencil MCP: get_screenshot(nodeId)
```

Study: app bar treatment, sidebar styling, content area background.

- [ ] **Step 2: Apply token-driven styling to owner.vue**

The owner layout is 305 lines. Key changes:

1. **App bar** (lines 4-181): Replace any hardcoded colors with token references. Apply token shadows.
2. **Content area** (lines 185-186): Wrap `<router-view>` in `DashboardShell` for pages that use the dashboard pattern.
3. **CSS** (lines 297-303): Reference `var(--claro-app-bar-height)` instead of hardcoded 64px.

The layout uses `var(--app-bar-height, 64px)` already per CLAUDE.md — update the CSS custom property definition to use the token: `--app-bar-height: var(--claro-app-bar-height)`.

- [ ] **Step 3: Verify visually**

```
Chrome DevTools MCP: take_screenshot()
```

- [ ] **Step 4: Verify build**

Run: `pnpm build:fast`

- [ ] **Step 5: Commit**

```bash
git add src/layouts/owner.vue
git commit -m "restyle: owner layout shell with token-driven app bar and content area"
```

---

## Task 15: Full Owner Overview Verification and Sync

**Files:** None (verification only)

- [ ] **Step 1: Take final after screenshot**

```
Chrome DevTools MCP: take_screenshot()
```

Compare to the before screenshot from Task 7. The overview should now match the .pen file's visual intent.

- [ ] **Step 2: Sync tokens back to .pen if any were adjusted**

If any token values were tweaked during implementation (adjusted spacing, shifted colors):

```
Pencil MCP: set_variables({ variables: { /* changed tokens */ } })
```

- [ ] **Step 3: Verify .pen reflects current code**

```
Pencil MCP: get_screenshot(nodeId)
```

Compare the .pen's component to the live page. They should match.

- [ ] **Step 4: Run full build**

Run: `pnpm build`
Expected: Build succeeds including type checking.

- [ ] **Step 5: Run tests**

Run: `pnpm test:run`
Expected: All tests pass.

- [ ] **Step 6: Commit sync if needed**

```bash
git add design/materio-vuetify.lib.pen src/styles/tokens.css
git commit -m "sync: align .pen variables with final token values after owner overview restyle"
```

---

## Task 16: Restyle Remaining Owner Pages

Follow the per-page restyle loop from the spec for each remaining owner page. Each page follows the same pattern:

### Per-Page Checklist

For each page below, execute these steps:

1. `Chrome DevTools MCP: navigate_page({ url: "<page-url>" })`
2. `Chrome DevTools MCP: take_screenshot()` — before
3. `Pencil MCP: batch_get()` + `get_screenshot()` — find matching mockup
4. `Vuetify MCP: get_component_api_by_version()` — for any new Vuetify components
5. Update page component: replace hardcoded values with tokens, use wrappers where applicable
6. `Chrome DevTools MCP: take_screenshot()` — after
7. `pnpm build:fast` — verify
8. `git commit` with `restyle:` prefix — one commit per visual unit

### Owner Pages to Restyle

| Page | URL | Key Components |
|------|-----|----------------|
| Properties list | `/owner/properties` | `src/pages/owner/properties/index.vue`, property cards |
| Property view | `/owner/properties/view` | `src/pages/owner/properties/view.vue`, `PropertySectionCard.vue` and property section components |
| Bookings | `/owner/bookings` | `src/pages/owner/bookings/index.vue`, `OwnerBookingForm.vue` |
| Dashboard (calendar) | `/owner/dashboard` | `src/pages/owner/dashboard.vue` — SKIP calendar-specific CSS for now, only restyle surrounding chrome |
| Profile | `/owner/profile` | `src/pages/owner/profile.vue` |
| Settings | `/owner/settings` | `src/pages/owner/settings.vue` |

**Commit per page component.** If a page has multiple visual units (e.g., properties page has cards + modal), commit each unit separately.

---

## Task 17: Restyle Admin Pages

Same per-page restyle loop. Admin has its own layout (`src/layouts/admin.vue`) and component set.

### Admin Pages to Restyle

| Page | URL | Key Components |
|------|-----|----------------|
| Admin dashboard | `/admin` | `src/pages/admin/index.vue`, `AdminWelcomeBanner.vue`, `AdminMetricsStrip.vue`, `AdminQuickActions.vue`, `AdminTimelineCard.vue`, `AdminOverviewUrgentTurns.vue`, `AdminOverviewCleanerAvailability.vue`, `AdminTomorrowPreview.vue`, `AdminUnassignedCard.vue`, `AdminAllClearCard.vue` |
| Bookings | `/admin/bookings` | `AdminBookingForm.vue`, `BookingDetailsModal.vue` |
| Properties | `/admin/properties` | Property management components |
| Cleaners | `/admin/cleaners` | `CleanerAssignmentModal.vue`, `CleanerAvailabilityCard.vue` |
| Schedule | `/admin/schedule` | Schedule view — SKIP calendar-specific CSS |
| Users | `/admin/users` | `AdminUserWizard.vue`, `UserFormDialog.vue` |
| Property Owners | `/admin/property-owners` | `OwnerDetailCard.vue`, `OwnerPropertyList.vue` |
| Owner Detail | `/admin/owners/[id]` | Owner detail view |
| Reports | `/admin/reports` | `PerformanceMetricsDashboard.vue`, `WeeklyBookingsChart.vue`, `TopPropertiesCard.vue` |

**Admin also needs:**
- `src/layouts/admin.vue` — apply DashboardShell wrapper, token-driven styling (same approach as owner layout in Task 14)
- Admin-specific wrappers if the .pen file has admin patterns that differ from owner

---

## Task 18: Restyle Auth Pages

Lightest touch — auth pages mostly inherit from the theme.

### Auth Pages to Restyle

| Page | Key Changes |
|------|-------------|
| Login | Background color → `var(--claro-background)`, card → token surface/shadow/radius |
| Register | Same as login |
| Password reset / other auth | Same pattern |

Auth pages live in `src/pages/auth/` and use `meta: { layout: 'auth' }`. Update `src/layouts/auth.vue` with token-driven styling.

**One commit for auth layout, one per page if pages have custom styling.**

---

## Task 19: Calendar Restyle (Last)

**This is the most complex phase.** The calendar has 750+ lines of responsive SCSS in `responsive.scss` plus `calendar-tokens.css`.

### Approach

1. **Migrate `calendar-tokens.css`** to consume from `tokens.css` instead of directly from Vuetify theme variables:

```css
/* Before */
--cal-turn-urgent: rgb(var(--v-theme-error));

/* After */
--cal-turn-urgent: var(--claro-error);
```

2. **Do NOT touch `responsive.scss` calendar sections** unless a specific visual issue arises. The 750+ lines of device-specific handling are battle-tested.

3. **Restyle calendar chrome** — the surrounding UI (controls, headers, view switchers) that isn't part of FullCalendar itself.

4. **FullCalendar event styling** — update event card colors, borders, typography to match tokens.

### Pages

| Page | URL |
|------|-----|
| Owner calendar | `/owner/dashboard` |
| Admin schedule | `/admin/schedule` |

**Commit: `restyle: migrate calendar tokens to design token system`** for the token migration, then per-component commits for visual changes.

---

## Task 20: Final Verification

- [ ] **Step 1: Full build**

Run: `pnpm build`
Expected: Build succeeds with type checking.

- [ ] **Step 2: Full test suite**

Run: `pnpm test:run`
Expected: All tests pass.

- [ ] **Step 3: Performance tests**

Run: `pnpm test:performance`
Expected: No regressions.

- [ ] **Step 4: Visual sweep**

Navigate through every page in both Chrome and mobile viewport:

```
Chrome DevTools MCP: emulate({ device: "iPhone 14" })
```

Screenshot each page and compare to .pen file.

- [ ] **Step 5: Final two-way sync**

```
Pencil MCP: get_variables()
```

Compare to `tokens.css`. If any drift, reconcile and commit:

```bash
git commit -m "sync: final token alignment between .pen and tokens.css"
```

- [ ] **Step 6: Merge decision**

When satisfied with the full restyle, merge to main:

```bash
git checkout main
git merge feature/materio-restyle
```

Or create a PR for review.
