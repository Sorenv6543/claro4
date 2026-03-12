# Theme Picker Dev Tool Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a temporary palette icon to the owner app bar that opens a menu of theme swatches; clicking any swatch applies that Vuetify theme to the entire app instantly.

**Architecture:** All changes live in `src/layouts/owner.vue` only. A static `THEMES` array in `<script setup>` holds the colour data for all 14 themes. `useTheme()` from Vuetify 4 switches the active theme. No persistence, no store, no new files.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vuetify 4 `useTheme()`, `v-menu`, `v-btn`, `v-chip`. Vuetify components are auto-imported — do **not** import them manually.

---

## File Structure

| Action | Path | Purpose |
|--------|------|---------|
| Modify | `src/layouts/owner.vue` | Add palette button, theme menu, THEMES array |
| Create | `src/__tests__/layouts/ownerThemes.spec.ts` | Verify THEMES array integrity |

---

## Chunk 1: Theme Picker

### Task 1: Write and pass a THEMES integrity test

**Files:**
- Create: `src/__tests__/layouts/ownerThemes.spec.ts`

The `THEMES` array will be defined in `owner.vue` but to keep it testable, extract it into a module-level constant. Because `owner.vue` is a Vue SFC with `useTheme()` (a Vuetify composable), importing it directly in a test would require full Vuetify setup. Instead, the test imports only the **exported** `THEMES` constant from a tiny companion file.

- [ ] **Step 1: Write the failing test first (TDD red phase)**

Create `src/__tests__/layouts/ownerThemes.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { THEMES, REGISTERED_THEME_KEYS } from '@/layouts/ownerThemes'

describe('THEMES swatch array', () => {
  it('has an entry for every registered theme', () => {
    const ids = THEMES.map(t => t.id)
    for (const key of REGISTERED_THEME_KEYS) {
      expect(ids).toContain(key)
    }
  })

  it('has exactly 14 entries', () => {
    expect(THEMES).toHaveLength(14)
  })

  it('every entry has non-empty id, label, primary, background, surface', () => {
    for (const t of THEMES) {
      expect(t.id.length).toBeGreaterThan(0)
      expect(t.label.length).toBeGreaterThan(0)
      expect(t.primary).toMatch(/^#[0-9a-fA-F]{6}$/)
      expect(t.background).toMatch(/^#[0-9a-fA-F]{6}$/i)
      expect(t.surface).toMatch(/^#[0-9a-fA-F]{6}$/i)
    }
  })

  it('no duplicate ids', () => {
    const ids = THEMES.map(t => t.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})
```

- [ ] **Step 2: Run test — expect FAIL (module doesn't exist yet)**

```bash
pnpm test -- src/__tests__/layouts/ownerThemes.spec.ts
```

Expected: `Cannot find module '@/layouts/ownerThemes'`

- [ ] **Step 3: Create the companion constant file**

Create `src/layouts/ownerThemes.ts`:

```typescript
// src/layouts/ownerThemes.ts
// Extracted so it can be tested without mounting a Vuetify component.

export interface ThemeSwatch {
  id: string
  label: string
  primary: string
  background: string
  surface: string
}

export const THEMES: ThemeSwatch[] = [
  { id: 'light',      label: 'Light',      primary: '#1976D2', background: '#F5F7FA', surface: '#FFFFFF' },
  { id: 'dark',       label: 'Dark',       primary: '#2196F3', background: '#121212', surface: '#1E1E1E' },
  { id: 'green',      label: 'Green',      primary: '#4CAF50', background: '#F5F7FA', surface: '#FFFFFF' },
  { id: 'darkGreen',  label: 'Dark Green', primary: '#66BB6A', background: '#121212', surface: '#1E1E1E' },
  { id: 'purple',     label: 'Purple',     primary: '#9C27B0', background: '#F5F7FA', surface: '#FFFFFF' },
  { id: 'darkPurple', label: 'Dark Purple',primary: '#AB47BC', background: '#121212', surface: '#1E1E1E' },
  { id: 'orange',     label: 'Orange',     primary: '#FF5722', background: '#F5F7FA', surface: '#FFFFFF' },
  { id: 'darkOrange', label: 'Dark Orange',primary: '#FF7043', background: '#121212', surface: '#1E1E1E' },
  { id: 'teal',       label: 'Teal',       primary: '#009688', background: '#F5F7FA', surface: '#FFFFFF' },
  { id: 'darkTeal',   label: 'Dark Teal',  primary: '#26A69A', background: '#121212', surface: '#1E1E1E' },
  { id: 'red',        label: 'Red',        primary: '#F44336', background: '#F5F7FA', surface: '#FFFFFF' },
  { id: 'darkRed',    label: 'Dark Red',   primary: '#EF5350', background: '#121212', surface: '#1E1E1E' },
  { id: 'brown',      label: 'Brown',      primary: '#795548', background: '#F5F7FA', surface: '#FFFFFF' },
  { id: 'darkBrown',  label: 'Dark Brown', primary: '#8D6E63', background: '#121212', surface: '#1E1E1E' },
]

// Theme keys registered in vuetify.ts — used to verify THEMES stays in sync.
export const REGISTERED_THEME_KEYS = [
  'light', 'dark', 'green', 'darkGreen', 'purple', 'darkPurple',
  'orange', 'darkOrange', 'teal', 'darkTeal', 'red', 'darkRed',
  'brown', 'darkBrown',
] as const
```

- [ ] **Step 4: Run test again — expect PASS**

```bash
pnpm test -- src/__tests__/layouts/ownerThemes.spec.ts
```

Expected: `4 tests passed`

- [ ] **Step 5: Commit**

```bash
git add src/layouts/ownerThemes.ts src/__tests__/layouts/ownerThemes.spec.ts
git commit -m "feat: add THEMES swatch constant with integrity tests"
```

---

### Task 2: Add the theme picker to owner.vue

**Files:**
- Modify: `src/layouts/owner.vue`

- [ ] **Step 1: Add imports to `<script setup>`**

In `src/layouts/owner.vue`, the current imports block (lines 75-80) is:

```typescript
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@stores/auth'
import OwnerNavigationDrawer from '@/components/smart/owner/OwnerNavigationDrawer.vue'
import OwnerBottomNav from '@/components/smart/owner/OwnerBottomNav.vue'
```

Replace with (adds `useTheme` and the THEMES import):

```typescript
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay, useTheme } from 'vuetify'
import { useAuthStore } from '@stores/auth'
import { THEMES } from '@/layouts/ownerThemes'
import OwnerNavigationDrawer from '@/components/smart/owner/OwnerNavigationDrawer.vue'
import OwnerBottomNav from '@/components/smart/owner/OwnerBottomNav.vue'
```

- [ ] **Step 2: Add theme instance below the existing composable calls**

After line `const { mdAndUp } = useDisplay()`, add:

```typescript
const theme = useTheme()
```

- [ ] **Step 3: Add applyTheme helper after the sidebarOpen ref**

After `const sidebarOpen = ref(mdAndUp.value)`, add:

```typescript
function applyTheme(id: string) {
  theme.name.value = id
}
```

- [ ] **Step 4: Add the DEV chip + palette button + theme menu to the `#append` slot**

In the template, the `<template #append>` block currently looks like:

```vue
<template #append>
  <!-- Notification bell (stub) -->
  <v-btn
    icon="mdi-bell-outline"
    variant="text"
    color="default"
    size="small"
    class="mr-1"
  />

  <v-menu location="bottom end">
```

Replace it with (inserts DEV chip, palette button, and theme menu between the bell and the avatar menu):

```vue
<template #append>
  <!-- Notification bell (stub) -->
  <v-btn
    icon="mdi-bell-outline"
    variant="text"
    color="default"
    size="small"
    class="mr-1"
  />

  <!-- DEV: theme picker -->
  <!-- Note: global VChip default is rounded="pill"; rounded="0" overrides it for the label look -->
  <v-chip
    size="x-small"
    color="warning"
    rounded="0"
    class="mr-1"
    style="font-size:9px;height:16px;padding:0 4px"
  >DEV</v-chip>
  <!-- Use slot-based activator (idiomatic Vuetify 4 — ID-string activator is unreliable) -->
  <v-menu location="bottom end" :close-on-content-click="false">
    <template #activator="{ props: menuProps }">
      <v-btn
        v-bind="menuProps"
        icon="mdi-palette"
        variant="text"
        size="small"
        class="mr-1"
      />
    </template>
    <v-card elevation="4" rounded="lg" style="padding:12px;width:296px">
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
        <div
          v-for="t in THEMES"
          :key="t.id"
          style="position:relative;border-radius:8px;overflow:hidden;cursor:pointer;border:2px solid transparent"
          :style="theme.name.value === t.id ? { borderColor: t.primary } : {}"
          @click="applyTheme(t.id)"
        >
          <!-- Three colour bands -->
          <div style="display:flex;height:36px">
            <div :style="{ flex:1, background: t.primary }" />
            <div :style="{ flex:1, background: t.background }" />
            <div :style="{ flex:1, background: t.surface }" />
          </div>
          <!-- Label -->
          <div style="padding:3px 6px;font-size:11px;background:#fff;color:#333">{{ t.label }}</div>
          <!-- Active checkmark -->
          <v-icon
            v-if="theme.name.value === t.id"
            size="14"
            color="white"
            style="position:absolute;top:4px;right:4px;background:rgba(0,0,0,0.45);border-radius:50%;padding:2px"
          >mdi-check</v-icon>
        </div>
      </div>
    </v-card>
  </v-menu>

  <!-- Avatar / user menu -->
  <v-menu location="bottom end">
```

- [ ] **Step 5: Run all tests to verify nothing is broken**

```bash
pnpm test:run
```

Expected: all tests pass (including the 4 new THEMES tests)

- [ ] **Step 6: Start dev server and manually verify**

```bash
pnpm dev
```

Open the app in a browser. Verify:
1. A small "DEV" chip and palette icon appear in the app bar between the bell and the avatar
2. Clicking the palette icon opens a grid of 14 theme swatches
3. Each swatch shows three colour bands
4. Clicking a swatch immediately changes the whole app's colours (app bar, sidebar, buttons)
5. The active theme swatch has a highlighted border and checkmark
6. Clicking the same swatch again does nothing (already active)
7. Closing the menu keeps the applied theme

- [ ] **Step 7: Commit**

```bash
git add src/layouts/owner.vue
git commit -m "feat: add theme picker dev tool to owner app bar"
```
