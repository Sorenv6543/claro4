# Collapsible Filters & Mobile Table Redesign

**Date:** 2026-04-06
**Status:** Approved
**Design Reference:** `pencil-new.pen` — V4a (Purple-Blue Gradient)

## Summary

Redesign the MaterioDataTable filter UX and mobile table layout across the entire codebase. Filters collapse behind a button by default. Tables show only essential columns on mobile. Owner Bookings gets an additional gradient header treatment.

## Design Decisions

### 1. Collapsible Filter Pattern (all 6 pages)

**Collapsed state (default on all viewports):**
- Search field (always visible) + filter icon button (`mdi-tune`) beside it
- Tapping the filter icon expands filter fields below with `v-expand-transition`
- Badge on filter icon shows count of active filters (e.g. "2")

**Expanded state:**
- Filter dropdowns appear below the search row
- Same filter fields as today, just hidden by default

**Pages receiving this pattern:**

| Page | Filters | Notes |
|------|---------|-------|
| OwnerBookings | Property, Status, Type | Currently uses `#filters` slot, always visible |
| AdminBookings | Status, Type, Property, Date From, Date To | Already has custom collapsible — standardize |
| AdminProperties | Status, Tier, Owner, Min/Max Duration | Currently always visible |
| AdminUsers | Role, Status | Currently always visible |
| AdminCleaners | Status | Currently always visible |
| AdminPropertyOwners | Status | Currently always visible |

### 2. Segmented Status Tabs (where applicable)

Below the search/filter row, add a horizontal row of chip-style segment buttons for quick status filtering:
- **OwnerBookings:** All / Pending / Scheduled / Done
- **AdminBookings:** All / Pending / Scheduled / In Progress / Done
- **AdminProperties:** All / Active / Inactive
- **AdminUsers:** All / Active / Inactive
- **AdminCleaners:** All / Active / Inactive
- **AdminPropertyOwners:** All / Active / Invited

Active tab uses the page's accent color fill with white text. Inactive tabs use `#F7F8FA` fill with `#666` text and a `#E2E8F0` border.

### 3. Mobile Table Columns (2-column layout)

On mobile (`< sm` breakpoint), data tables show only 2 columns:
- **Column 1:** Primary identifier (property name, user name, etc.) with color indicator (bar or dot)
- **Column 2:** Key date/info, right-aligned

Additional details accessible via expand-on-click row detail (chevron hint on each row).

**Per-page mobile columns:**

| Page | Col 1 | Col 2 |
|------|-------|-------|
| OwnerBookings | Property (color bar) | Dates (condensed, monospace) |
| AdminBookings | Property (color bar) | Dates (condensed) |
| AdminProperties | Property name (color bar) | Owner name |
| AdminUsers | User name | Role |
| AdminCleaners | Cleaner name | Status chip |
| AdminPropertyOwners | Owner name | Property count |

On desktop (`>= sm`), all existing columns remain visible.

### 4. Owner Bookings Gradient Header

Only `OwnerBookings.vue` gets the V4a gradient header:
- Status bar area: gradient `#4338CA` → `#0EA5E9` (160deg)
- Top bar: slightly darker gradient `#3730A3` → `#0284C7`
- Title "My Bookings" in white, count badge in translucent white
- Icon-only "+" add button in translucent white
- This replaces the current split duo-tone "bookings-header" and the C3 stats bar

### 5. Remove Wrapping Card on MaterioDataTable

The current `MaterioDataTable` wraps everything in a `v-card` with `elevation="24"`. On mobile this adds unnecessary padding and shadow. Change:
- Default elevation from `24` to `0`
- Remove the outer card border-radius on mobile (or make it optional)
- The table itself provides visual structure via its header row and row borders

## Implementation Scope

### MaterioDataTable.vue (shared component changes)

1. **Add collapsible filter support:**
   - New prop `filtersCollapsible` (boolean, default `true`)
   - Internal `showFilters` ref (default `false`)
   - Search field + filter icon button row (replaces current search/filters layout)
   - `v-expand-transition` wrapping the `#filters` slot
   - Badge showing active filter count (new prop `activeFilterCount`)

2. **Add segment tabs slot:**
   - New slot `#segments` rendered between search row and table
   - Provides a standard location for status segment chips

3. **Mobile column hiding:**
   - New header property `mobileHidden: true` to hide columns on mobile
   - Use `useDisplay()` from Vuetify to detect mobile breakpoint
   - Conditionally filter headers based on breakpoint

4. **Row chevron on mobile:**
   - When `expandable` is true and on mobile, show a chevron icon on each row

5. **Reduced default elevation:**
   - Change default `elevation` prop from `24` to `0`

### OwnerBookings.vue (page-specific changes)

1. Replace duo-tone header + C3 stats bar with gradient header
2. Pass `filtersCollapsible` and `activeFilterCount` to MaterioDataTable
3. Add segment tabs (All/Pending/Scheduled/Done)
4. Update `tableHeaders` with `mobileHidden` flags
5. Format dates in condensed style on mobile

### Other 5 pages (filter pattern only)

Each admin page:
1. Wrap existing filter fields in the MaterioDataTable `#filters` slot (if not already)
2. Set `filtersCollapsible` (uses new default)
3. Compute and pass `activeFilterCount`
4. Add appropriate `#segments` content
5. Mark non-essential headers with `mobileHidden: true`

## Technical Notes

- Use `useDisplay()` from Vuetify for breakpoint detection — already used elsewhere in codebase
- `v-expand-transition` for filter expand/collapse animation
- Segment tabs are just styled `v-btn` group or custom chips — no new component needed, just slot content
- Monospace dates via `font-family: 'Geist Mono', monospace` or Vuetify's existing monospace class
- Property color bars: 3px wide, 28px tall rounded rectangles replacing the current 10px dot

## Out of Scope

- Desktop layout changes (all columns remain on desktop)
- New filter types or filter logic changes
- Pagination redesign
- Dark mode adjustments (follows existing theme)
