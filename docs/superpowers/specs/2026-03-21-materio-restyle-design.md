# Materio Design System Restyle — Design Spec

**Date:** 2026-03-21
**Status:** Draft

## Problem

The Claro app has a functional but utilitarian look — blue primary, basic card styling, plain text labels. The user wants the app to match the Materio Vuetify admin template's modern SaaS dashboard aesthetic: purple primary, refined typography, softer shadows, colored icon containers on every list item, and overall visual polish.

## Goals

1. Extract and apply the Materio theme configuration (colors, typography, shadows, component defaults)
2. Add 40x40 colored icon containers to every field/list item in cards
3. Achieve the Materio "feel" across the entire app without changing functionality

## Source

Materio source extracted from: `C:/Users/Soren/materio-vuetify-vuejs-admin-template-free/typescript-version/`

## Design

### 1. Color Palette (from Materio source)

**Light Theme:**

| Token | Current | Materio |
|-------|---------|---------|
| primary | `#1976D2` | `#8C57FF` |
| primary-darken-1 | — | `#7E4EE6` |
| secondary | `#5C6BC0` | `#8A8D93` |
| success | `#4CAF50` | `#56CA00` |
| info | `#2196F3` | `#16B1FF` |
| warning | `#FFC107` | `#FFB400` |
| error | `#FF5252` | `#FF4C51` |
| background | `#F5F7FA` | `#F4F5FA` |
| surface | `#FFFFFF` | `#FFFFFF` |
| on-background | default | `#2E263D` |
| on-surface | default | `#2E263D` |

Domain colors stay unchanged: `turn-urgent`, `turn-standard`, `booking-standard`.

### 2. Typography (from Materio source)

**Font change:** Roboto → **Inter**

```
Font stack: "Inter", sans-serif, -apple-system, blinkmacsystemfont, "Segoe UI", roboto, "Helvetica Neue", arial
Base body size: 15px
```

**Heading weights:** All headings use weight `500` (not 600/700).

**Text styles:**
```
H1: 2.875rem / 500 / lh 4.25rem
H2: 2.375rem / 500 / lh 3.5rem
H3: 1.75rem / 500 / lh 2.625rem
H4: 1.5rem / 500 / lh 2.375rem
H5: 1.125rem / 500 / lh 1.75rem
H6: 0.9375rem / 500 / lh 1.375rem
Body-1: 0.9375rem / lh 1.375rem
Body-2: 0.8125rem / lh 1.25rem
Button: 0.9375rem / 500 / text-transform: capitalize
```

### 3. Border Radius (from Materio source)

```
Root: 6px (currently 8px)
SM: 4px
LG: 8px
Shaped: 25px 0
Chips/Badges: pill
```

### 4. Shadows (from Materio source)

Shadow key umbra color: `#2E263D` (warm purple-grey, not black).

```
Shadow opacities (light):
  XS: 0.16
  SM: 0.18
  MD: 0.20
  LG: 0.22
  XL: 0.24
```

Component elevations:
- Cards: `6`
- Dialogs: `10`
- Buttons: `2/2/0` (default/hover/active)
- Navigation drawer: `8`
- Snackbar: `2`

### 5. Component Defaults (from Materio source)

**VBtn:**
- No pill rounding — uses theme border-radius (6px)
- `text-transform: capitalize`
- Height: 38px default
- Color: `primary`

**VCard:**
- Elevation: `6`
- Padding (card-text): `1.25rem`

**VTextField / VSelect / VTextarea / VAutocomplete / VCombobox:**
- Variant: `outlined`
- Density: `comfortable`
- Color: `primary`
- Hide-details: `auto`
- Heights: default 56px, comfortable 48px, compact 40px

**VSwitch:**
- Inset: `true`
- Color: `primary`

**VChip:**
- Elevation: `0`
- Rounded: `pill`

**VPagination:**
- Density: `comfortable`
- Variant: `tonal`
- Show-first-last-page: `true`

**VTooltip:**
- Location: `top`
- Background: `rgba(59, 55, 68, 0.9)`
- Font-size: `0.75rem`
- Padding: `4px 12px`

### 6. Opacity System (from Materio source)

```
Hover: 0.04
Focus: 0.1
Selected: 0.08
Activated: 0.16
Pressed: 0.14
Disabled: 0.4
High emphasis: 0.9
Medium emphasis: 0.7
Border: 0.12
Field outline: 0.22
```

### 7. Icon Containers — Per-Field Icons

Every field/list item in a card gets a 40x40 rounded icon container with a tinted background. The icon color matches the background tint (e.g., purple icon on `rgba(140, 87, 255, 0.12)` background).

**Icon container CSS pattern:**
```css
.field-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
```

Background colors rotate through semantic colors to give visual variety:
- Primary tint: `rgba(140, 87, 255, 0.12)` with icon color `#8C57FF`
- Success tint: `rgba(86, 202, 0, 0.12)` with icon color `#56CA00`
- Info tint: `rgba(22, 177, 255, 0.12)` with icon color `#16B1FF`
- Warning tint: `rgba(255, 180, 0, 0.12)` with icon color `#FFB400`
- Error tint: `rgba(255, 76, 81, 0.12)` with icon color `#FF4C51`
- Secondary tint: `rgba(138, 141, 147, 0.12)` with icon color `#8A8D93`

**Field assignment per section:**

**Property Info section:**
- Address: `mdi-map-marker` (primary)
- Type: `mdi-office-building` (warning)
- Beds: `mdi-bed` (info)
- Baths: `mdi-shower` (success)
- SqFt: `mdi-ruler-square` (secondary)
- Floor Type: `mdi-layers` (warning)
- Color: `mdi-palette` (primary)

**Cleaning section:**
- Duration: `mdi-clock-outline` (info)
- Pricing Tier: `mdi-currency-usd` (success)
- Linens Location: `mdi-hanger` (warning)

**Access & Parking section:**
- Access Info: `mdi-key-variant` (primary)
- Alarm Info: `mdi-shield-lock` (error)
- Parking: `mdi-car` (info)

**Contact & Notes section:**
- Contact Name: `mdi-account` (primary)
- Contact Phone: `mdi-phone` (success)
- Special Instructions: `mdi-note-text` (warning)
- Trash Day: `mdi-delete` (secondary)

**Statistics & Bookings (right column):**
- Total Bookings: `mdi-calendar-check` (primary)
- Upcoming Bookings: `mdi-calendar-arrow-right` (info)
- Status: `mdi-check-circle` (success)

### 8. Section Card Header Styling

Section card headers get the same icon container treatment — the section icon (e.g., `mdi-home` for Property Info) gets a 40x40 colored background container instead of a plain icon.

Section label styling changes:
- Field labels: `rgba(47, 43, 61, 0.5)` (muted grey, not primary color)
- Field values: `rgba(47, 43, 61, 0.78)` (body text color)
- "Not set" text: `rgba(47, 43, 61, 0.3)` (very muted)

### 9. Files to Change

**Sub-project 1: Theme config (gets 80% of visual change):**
- `src/plugins/vuetify.ts` — all colors, component defaults, typography, shadows, opacities
- `src/styles/variables.scss` — font family, border-radius root
- `src/layouts/ownerThemes.ts` — light theme palette update
- `src/App.vue` — base font-size to 15px, font-family to Inter
- `package.json` — add `@fontsource/inter` dependency (or use Google Fonts CDN in `index.html`)

**Sub-project 2: Component polish (per-field icons, label colors):**
- `src/components/dumb/owner/PropertySectionCard.vue` — icon container in header
- `src/components/dumb/owner/PropertyInfoSection.vue` — per-field icons, label color
- `src/components/dumb/owner/PropertyCleaningSection.vue` — per-field icons, label color
- `src/components/dumb/owner/PropertyAccessSection.vue` — per-field icons, label color
- `src/components/dumb/owner/PropertyContactSection.vue` — per-field icons, label color
- `src/components/smart/owner/OwnerPropertyView.vue` — stats icons in right column
- `src/components/smart/owner/OwnerProperties.vue` — property card list item icons
- `src/components/smart/owner/OwnerBookings.vue` — booking list item icons

### 10. What Does NOT Change

- Layout structure, routing, business logic
- Component architecture (smart/dumb split)
- Calendar event colors (functional, not aesthetic)
- Domain colors: `turn-urgent`, `turn-standard`, `booking-standard`
- Dark teal theme (leave as-is — only update light theme)
- Composables, stores, types

## Out of Scope

- Dark theme Materio colors (only light theme for now)
- Materio's layout system (vertical nav pattern — Claro has its own)
- Materio's icon set (RemixIcon) — keep MDI
- Custom scrollbar styling from Materio
- RTL support
