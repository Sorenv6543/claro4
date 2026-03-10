# Owner Properties Page Design

Date: 2026-03-07
Branch: feature/owner-properties-page

## Overview

Build out the owner role's `/owner/properties` page and property detail page. Most smart components already exist on `main` — the work is wiring missing routes, fixing component issues, and adding a cleaning schedule section to the detail page.

## What Exists (no rebuild needed)

- `src/components/smart/owner/OwnerProperties.vue` — card grid, mostly working
- `src/components/smart/owner/OwnerPropertyView.vue` — detail page skeleton, needs fixes
- `src/components/smart/owner/OwnerPropertyEdit.vue` — stub, will be replaced with modal approach
- `src/components/smart/owner/OwnerPropertyCreate.vue` — stub, create handled via modal on list page
- `src/pages/owner/properties/index.vue` — thin wrapper, working
- `src/pages/owner/properties/view.vue` — thin wrapper, needs route wired
- `src/composables/owner/useOwnerProperties.ts` — full owner-scoped CRUD, correct entry point
- `src/composables/owner/useOwnerBookings.ts` — owner-scoped bookings

## Architecture

Pages are thin wrappers (~7 lines). All logic lives in smart components. Smart components use composables, not raw stores directly.

### Route Map

| URL | Page | Smart Component |
|-----|------|----------------|
| `/owner/properties` | `pages/owner/properties/index.vue` | `OwnerProperties.vue` |
| `/owner/properties/:id` | `pages/owner/properties/view.vue` | `OwnerPropertyView.vue` |

The `/owner/properties/:id/edit` route is dropped — edit is a `PropertyModal` dialog opened on the detail page itself.

## Section 1: Router

**File:** `src/router/index.ts`

Add two routes after the existing `/owner/properties` route:

```ts
{
  path: '/owner/properties/:id',
  name: 'owner-property-view',
  component: () => import('@/pages/owner/properties/view.vue'),
  meta: { layout: 'owner', role: 'owner', requiresAuth: true }
}
```

The existing `/owner/properties` route should be updated to use the page wrapper (`pages/owner/properties/index.vue`) for consistency with all other routes.

## Section 2: OwnerPropertyView (detail page)

**File:** `src/components/smart/owner/OwnerPropertyView.vue`

Issues to fix:
1. Replace raw `propertyStore.fetchProperties()` / `bookingStore.fetchBookings()` with `useOwnerProperties` and `useOwnerBookings` composables
2. Add `PropertyModal` in edit mode, opened via Edit button on the page
3. Add `ConfirmationDialog` wired to delete button → `deleteMyProperty()`
4. Fix hardcoded "Status: Active" — derive from `property.active`
5. Add **Cleaning Schedule section**: upcoming bookings for this property displayed as a timeline list, with turn bookings visually distinguished

Data for cleaning schedule: filter `useOwnerBookings().myBookings` by `property_id`, sort by `checkin_date` ascending, show next 10.

## Section 3: OwnerProperties card grid (minor fix)

**File:** `src/components/smart/owner/OwnerProperties.vue`

The "Edit" menu item currently calls `router.push('/owner/properties/${property.id}/edit')`. Change to open `PropertyModal` in edit mode via `uiStore.openModal()` (consistent with the Create flow already on this component).

## Section 4: Sidebar property list enhancement

**File:** `src/components/smart/owner/OwnerSidebar.vue`

Add a small `v-chip` (Active/Inactive, size="x-small") to each property list item. Keep click-to-filter-calendar behavior unchanged.

## Data Flow

```
OwnerPropertyView
  └── useOwnerProperties()    → myProperties, deleteMyProperty, updateMyProperty
  └── useOwnerBookings()      → myBookings (filtered by property_id for schedule)
  └── PropertyModal (dialog)  → edit mode, wired to updateMyProperty on save
  └── ConfirmationDialog      → delete confirmation, wired to deleteMyProperty
```

## What We Are NOT Doing

- No new composables (reuse existing)
- No dedicated `/owner/properties/:id/edit` page (modal on detail page instead)
- No rebuild of `OwnerProperties.vue` card grid (only minor fix)
- No changes to `useOwnerProperties.ts` logic
- No changes to `PropertyModal.vue` dumb component

## Files Changed

| File | Change |
|------|--------|
| `src/router/index.ts` | Add `/owner/properties/:id` route; fix `/owner/properties` to use page wrapper |
| `src/components/smart/owner/OwnerPropertyView.vue` | Use composables, add edit modal, delete dialog, cleaning schedule, fix status |
| `src/components/smart/owner/OwnerProperties.vue` | Fix Edit menu item to open modal instead of navigate to edit route |
| `src/components/smart/owner/OwnerSidebar.vue` | Add status chip to property list items |
