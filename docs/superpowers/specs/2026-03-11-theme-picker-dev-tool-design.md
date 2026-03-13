# Theme Picker Dev Tool — Design Spec

**Goal:** Add a temporary dev tool to the owner app bar that lets the developer cycle through all configured Vuetify themes in real time to evaluate the visual direction of the app.

**Architecture:** A palette icon button in `src/layouts/owner.vue` opens a `v-menu` containing swatches for every named theme in `vuetify.ts`. Clicking a swatch calls `theme.name.value = themeName` (Vuetify 4 API — not `theme.global.name.value` which is Vuetify 3), which Vuetify applies immediately to the entire app. No persistence, no store changes, no Supabase.

**Tech Stack:** Vue 3 `<script setup>`, Vuetify 4 `useTheme()` composable, `v-menu`, `v-btn`. All components auto-imported.

---

## Component Changes

### `src/layouts/owner.vue` (only file touched)

**App bar addition:** A `mdi-palette` icon button placed between the notification bell and the avatar menu. Added inside the existing `<template #append>` slot in `owner.vue`, matching the bell button's `size="small"` and `variant="text"` attributes so it visually fits. Labelled with a small "DEV" `v-chip` beside it so it's obviously a dev tool.

**Theme menu:** `v-menu` anchored to the palette button. Opens below it. Contains a two-column grid of theme swatches (14 themes: light, dark, green, darkGreen, purple, darkPurple, orange, darkOrange, teal, darkTeal, red, darkRed, brown, darkBrown).

**Each swatch:**
- Rounded rectangle (~120×56px)
- Three horizontal color bands: `primary` / `background` / `surface` from that theme's color definition
- Theme name label below the bands (e.g. "Dark Purple")
- Clicking applies: `theme.name.value = 'darkPurple'` (Vuetify 4 API)
- Active theme swatch has a checkmark overlay

**Theme color data:** The swatch colors are read directly from the static theme definitions (not from `useTheme()` computed values) so all 14 swatches render their correct colors simultaneously regardless of which theme is active. This means inlining the primary/background/surface hex values into a `THEMES` array in the component's `<script setup>`.

Note: The built-in `light` and `dark` themes in `vuetify.ts` do not define explicit `background` or `surface` values — they rely on Vuetify's internal defaults (`#FFFFFF` / `#FFFFFF` for light, `#121212` / `#1E1E1E` for dark). Use these fallback values in the `THEMES` array for those two entries.

---

## Behaviour

- Opening the menu does not change the theme
- Clicking a swatch immediately changes the whole app's theme
- Closing the menu leaves the current theme applied
- No persistence — refreshing the page resets to the `defaultTheme: 'light'` from `vuetify.ts`
- The picker is visible on all owner routes (it's in the layout shell)

---

## Removal

To remove this dev tool later: delete the palette icon button, the `v-menu`, and the `THEMES` array from `owner.vue`. The `useTheme()` import can be removed if nothing else uses it in that file.

---

## Out of Scope

- Persisting the chosen theme to localStorage or Supabase
- Making the picker available to end users (not in Settings)
- Fixing the `light` theme's missing domain colors (separate task)
- The calendar responsive bug at 959px (separate task)
