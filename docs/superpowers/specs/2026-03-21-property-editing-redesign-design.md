# Property Editing Redesign — Design Spec

**Date:** 2026-03-21
**Status:** Draft

## Problem

Property creation currently shows all fields at once in a modal, which is overwhelming. Property editing also uses the same modal, even from the detail page where inline editing would be more natural. Additionally, the property model is missing operational fields that cleaning companies need (access codes, parking, floor types, etc.).

## Goals

1. Simplify property creation with a two-step modal (required fields first, optional fields skippable)
2. Redesign the property detail page with grouped, inline-editable sections
3. Add operationally relevant fields to the property model
4. Add user-selectable property colors (5-color palette)

## Design

### 1. Property Creation Modal (Two-Step)

The two-step flow applies **only to the owner-side creation**. The `PropertyModal` gets a `stepper` boolean prop (default `false`). When `true`, the modal renders a `v-stepper` with 2 steps. When `false` (admin usage, edit mode), behavior is unchanged — single-step full form.

**Note:** `v-stepper` is new to this codebase. Verify Vuetify 4 stepper API during implementation (it changed from v3). Use Context7 MCP to look up the current API.

**Step 1 — Required:**
- `address_street`, `address_unit`, `address_city`, `address_state`, `address_zip`
- `bedrooms`, `bathrooms` (front-end required for creation, remain optional in DB schema and TypeScript type)
- Color picker: 5 swatches, auto-selected based on `existingProperties.length % 5`
- "Next" button advances to Step 2

**Step 2 — Optional (skippable):**
- `property_type`, `cleaning_duration`, `pricing_tier`
- "Save" creates the property with these values
- "Skip for now" creates the property with defaults and takes user to the detail page

**Defaults for skipped fields:**
- `cleaning_duration`: 120 (matches DB schema default)
- `pricing_tier`: 'standard' (matches DB schema default)
- All other optional fields: null

### 2. Property Detail Page — Inline Editable Sections

The detail page is reorganized into `v-card` sections. Each section has two states:

**View state:**
- Section title with pencil icon button in card header
- Fields displayed as label/value pairs
- Empty optional fields show "Not set" in muted text

**Edit state:**
- Same card expands — fields become form inputs
- Save + Cancel buttons appear at bottom of card
- Save calls `updateMyProperty()` with only that section's fields
- Cancel reverts to view state, discards local changes
- Loading state on Save button while persisting

Multiple sections can be in edit mode simultaneously. Each section saves independently.

#### Section Groups

1. **Property Info** — address, property type, bedrooms, bathrooms, square footage, floor types, color picker
2. **Cleaning Details** — cleaning duration, pricing tier, linens/supplies location
3. **Access & Arrival** — access info (lockbox, smart lock, key location, gate/garage codes — free text), alarm info, parking instructions
4. **Contact & Notes** — contact name + phone (for issues), special instructions, trash/recycling day
5. **Photos** — reference photos of guest-ready state (placeholder section, future implementation)
6. **Statistics & Bookings** — total bookings, upcoming bookings, active status, upcoming arrivals list, recent bookings list (read-only, no edit mode)

**Note on special_instructions:** This is a deliberate reorganization — `special_instructions` moves from being alongside cleaning details to "Contact & Notes." It remains a single text field. The new `linens_location` field is separate and lives in "Cleaning Details."

#### Layout

- Desktop: two-column grid (`v-col md="8"` / `v-col md="4"`, matching existing proportions). Sections 1-4 in the left column. Sections 5-6 in the right column (Photos placeholder + Statistics & Bookings including the existing Upcoming Arrivals and Recent Bookings cards).
- Mobile: single-column stack, all sections.

### 3. New Property Fields

New columns added to the `properties` table via Supabase migration:

| Field | Type | Nullable | Default |
|-------|------|----------|---------|
| `color` | text | NOT NULL | first palette color (static hex value) |
| `floor_type` | text | YES | NULL |
| `access_info` | text | YES | NULL |
| `parking_instructions` | text | YES | NULL |
| `alarm_info` | text | YES | NULL |
| `contact_name` | text | YES | NULL |
| `contact_phone` | text | YES | NULL |
| `trash_day` | text | YES | NULL |
| `linens_location` | text | YES | NULL |

**`color` default:** The DB default is a static hex value (the first palette color). The index-based auto-selection (`existingProperties.length % 5`) happens in application code before insert, overriding the DB default. The DB default is a fallback only.

`floor_type` accepts: `'hardwood'`, `'carpet'`, `'tile'`, `'mixed'`, or null.

**`access_info`** is a single free-text field covering lockbox codes, smart lock details, key location, gate codes, garage codes — whatever applies to the property. Keeps the schema simple vs. separate columns for each.

**Type updates required:**
- Update `Property` interface in `src/types/property.ts` with all new fields
- `PropertyFormData` inherits changes automatically (it's `Omit<Property, 'id' | 'created_at' | 'updated_at'>`)
- Update `isProperty()` type guard to check for `color` (new required field)

### 4. Color Palette

5 user-selectable colors, stored in `color` field on the property. Colors are distinct, accessible, and avoid Vuetify's surface/on-surface theme variables.

**Constant location:** Create `PROPERTY_COLORS` in `src/utils/constants.ts` (centralized, per codebase convention). The existing `COLORS` arrays in `OwnerNavigationDrawer.vue` and anywhere else used for property coloring are replaced with imports from this constant. The admin-side `COLORS` arrays (used for avatar coloring in `AdminPropertyOwners.vue` / `AdminOwnerDetail.vue`) are **not changed** — those serve a different purpose.

- New properties get a default color via application code: `PROPERTY_COLORS[existingProperties.length % 5]`
- User can change via the color picker in the Property Info section or during creation
- Color is used everywhere the property appears: cards, sidebar entries, calendar events

Exact hex values to be determined during implementation — will be 5 saturated, distinct hues.

### 5. Component Architecture

**New dumb components** (`src/components/dumb/owner/`):

- `PropertySectionCard.vue` — reusable wrapper handling view/edit toggle, save/cancel buttons, loading state. Props: `title`, `icon`, `editing`, `loading`, `readonly`. Emits: `edit`, `save`, `cancel`.
- `PropertyInfoSection.vue` — address, type, beds, baths, sqft, floor type, color
- `PropertyCleaningSection.vue` — duration, pricing tier, linens location
- `PropertyAccessSection.vue` — access info, alarm info, parking instructions
- `PropertyContactSection.vue` — contact name/phone, special instructions, trash day
- `PropertyPhotosSection.vue` — placeholder for future photo upload/management
- `PropertyColorPicker.vue` — 5 circular swatches with selection ring, used in creation modal and Property Info section

**Modified components:**

- `OwnerPropertyView.vue` (smart) — replace current flat layout with section card grid, manage edit states per section, handle saves
- `PropertyModal.vue` (dumb/shared) — add `stepper` prop for two-step owner creation flow; when `false` (default), behavior unchanged

**Existing components to clean up:**

- `OwnerPropertyCreate.vue` and `OwnerPropertyEdit.vue` smart components exist but are unused (CLAUDE.md notes the corresponding page files have no router entries). Leave as-is for now — they are not part of any active flow.

**No new composables needed.** `useOwnerProperties` already provides `updateMyProperty(id, partialData)` which accepts partial updates — each section save calls this with only its fields.

### 6. Unsaved Changes Guard

If any section is in edit mode with modifications and the user navigates away, a confirmation dialog appears: "You have unsaved changes. Discard?"

Implemented via Vue Router's `onBeforeRouteLeave` in `OwnerPropertyView.vue`. Tracks dirty state per section using a `Set<string>` of section names with pending changes.

**Note:** `onBeforeRouteLeave` is new to this codebase. Since `OwnerPropertyView.vue` is a smart component mounted by the page thin wrapper (which is a direct child of `<router-view>`), the guard will work correctly — Vue Router propagates navigation guards to child components.

### 7. Validation

- Step 1 creation fields use the same validation rules as today (required address, valid zip, etc.). Bedrooms/bathrooms are required in the creation form via validation rules but remain optional in the TypeScript type.
- Inline section editing validates on save — same rules from the existing form, scoped to each section's fields
- Each section's Save button is disabled until the form within it is valid (`v-form` with `v-model` for validity)

### 8. Error Handling

- Section save errors display as a `v-alert` within the section card (below the form, above save/cancel)
- Creation modal errors display inline per field (existing pattern)
- Network errors surface via the composable's `error` ref

### 9. Implementation Order

1. **Migration** — add new columns to `properties` table
2. **Types** — update `Property` interface, `PropertyFormData`, `isProperty()` type guard
3. **Constants** — add `PROPERTY_COLORS` to `src/utils/constants.ts`
4. **Dumb components** — build `PropertySectionCard`, `PropertyColorPicker`, then the 5 section components
5. **Smart component** — rework `OwnerPropertyView.vue` to use new section components
6. **Creation modal** — add stepper flow to `PropertyModal.vue`
7. **Color integration** — update sidebar, cards, calendar to use property `color` field
8. **Navigation guard** — add unsaved changes warning

## Out of Scope

- Photo upload implementation (placeholder section only)
- Bulk property editing
- Property templates / cloning
- Reordering sections
- Admin-side creation flow changes (admin keeps current single-step modal)
