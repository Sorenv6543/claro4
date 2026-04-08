# Collapsible Filters & Mobile Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign MaterioDataTable to support collapsible filters, mobile-optimized 2-column layout, and segmented status tabs across all 6 data table pages.

**Architecture:** Upgrade the shared MaterioDataTable component with new props for collapsible filters, mobile column hiding, and a segments slot. Then update each of the 6 consumer pages to use the new features. OwnerBookings also gets a gradient header replacement.

**Tech Stack:** Vue 3 + Vuetify 4, `useDisplay()` for breakpoint detection, `v-expand-transition` for filter animation

**Design Reference:** `pencil-new.pen` V4a, spec at `docs/superpowers/specs/2026-04-06-collapsible-filters-mobile-table-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/dumb/shared/MaterioDataTable.vue` | Modify | Add collapsible filter props, mobile column hiding, segments slot, filter badge |
| `src/components/smart/owner/OwnerBookings.vue` | Modify | Gradient header, segment tabs, use new MaterioDataTable features |
| `src/components/smart/admin/AdminBookings.vue` | Modify | Standardize to new MaterioDataTable filter pattern |
| `src/components/smart/admin/AdminProperties.vue` | Modify | Move inline filters into MaterioDataTable collapsible pattern |
| `src/components/smart/admin/AdminUsers.vue` | Modify | Move inline filters into MaterioDataTable collapsible pattern |
| `src/components/smart/admin/AdminCleaners.vue` | Modify | Move inline filters into MaterioDataTable collapsible pattern |
| `src/components/smart/admin/AdminPropertyOwners.vue` | Modify | Move inline filters into MaterioDataTable collapsible pattern |

---

### Task 1: Upgrade MaterioDataTable — Collapsible Filters & Search Row

**Files:**
- Modify: `src/components/dumb/shared/MaterioDataTable.vue`

This task replaces the current search+filters layout with: a search field + filter icon button row, a `v-expand-transition` wrapping the filters slot, and an active filter count badge.

- [ ] **Step 1: Add new props and imports**

In the `<script setup>` section, update props and add `useDisplay`:

```typescript
import { useDisplay } from 'vuetify'
import { computed, ref, watch } from 'vue'

export interface DataTableHeader {
  title: string
  key: string
  sortable?: boolean
  align?: 'start' | 'center' | 'end'
  width?: string | number
  mobileHidden?: boolean
}

const props = withDefaults(defineProps<{
  title?: string
  subtitle?: string
  headers: DataTableHeader[]
  items: Record<string, unknown>[]
  loading?: boolean
  searchable?: boolean
  expandable?: boolean
  searchKeys?: string[]
  itemsPerPage?: number
  elevation?: number | string
  rowProps?: Record<string, unknown> | ((data: { item: Record<string, unknown>, index: number }) => Record<string, unknown>)
  filtersCollapsible?: boolean
  activeFilterCount?: number
}>(), {
  title: '',
  subtitle: '',
  loading: false,
  searchable: true,
  expandable: false,
  searchKeys: () => [],
  itemsPerPage: 10,
  elevation: 0,
  rowProps: undefined,
  filtersCollapsible: true,
  activeFilterCount: 0,
})

const { mobile } = useDisplay()

const searchQuery = ref('')
const expandedRows = ref<string[]>([])
const itemsPerPageLocal = ref(props.itemsPerPage)
const showFilters = ref(false)
```

- [ ] **Step 2: Add mobile-aware headers computed**

Below the existing `filteredItems` computed, add:

```typescript
const visibleHeaders = computed(() => {
  if (!mobile.value) return props.headers
  return props.headers.filter(h => !h.mobileHidden)
})
```

- [ ] **Step 3: Replace the template Search & Filters section**

Replace the entire `<!-- Search & Filters -->` block (lines 14-34 of current template) with:

```vue
<!-- Search & Filters -->
<div v-if="searchable || $slots.filters" class="px-4 pb-3">
  <!-- Search row with filter toggle -->
  <div class="d-flex align-center ga-2">
    <v-text-field
      v-if="searchable"
      v-model="searchQuery"
      clearable
      density="compact"
      hide-details
      placeholder="Search..."
      prepend-inner-icon="mdi-magnify"
      rounded="lg"
      single-line
      variant="outlined"
    />
    <v-btn
      v-if="$slots.filters && filtersCollapsible"
      :color="activeFilterCount > 0 ? 'primary' : undefined"
      density="comfortable"
      :icon="showFilters ? 'mdi-tune-variant' : 'mdi-tune'"
      rounded="lg"
      size="small"
      :variant="activeFilterCount > 0 ? 'tonal' : 'outlined'"
      @click="showFilters = !showFilters"
    >
      <v-icon>mdi-tune</v-icon>
      <v-badge
        v-if="activeFilterCount > 0"
        color="primary"
        :content="activeFilterCount"
        floating
        offset-x="-2"
        offset-y="-2"
      />
    </v-btn>
  </div>

  <!-- Segment tabs slot -->
  <div v-if="$slots.segments" class="mt-2">
    <slot name="segments" />
  </div>

  <!-- Collapsible filters -->
  <v-expand-transition>
    <div v-if="$slots.filters && (!filtersCollapsible || showFilters)" class="mt-3">
      <slot name="filters" />
    </div>
  </v-expand-transition>
</div>
```

- [ ] **Step 4: Update the v-data-table to use visibleHeaders**

In the `<v-data-table>` element, change `:headers="headers"` to `:headers="visibleHeaders"`:

```vue
<v-data-table
  v-model:expanded="expandedRows"
  class="materio-table"
  :expand-on-click="expandable"
  :headers="visibleHeaders"
  item-value="id"
  :items="filteredItems"
  :items-per-page="itemsPerPage"
  :loading="loading"
  :row-props="rowProps"
>
```

- [ ] **Step 5: Verify build passes**

Run: `pnpm build:fast`
Expected: No TypeScript errors

- [ ] **Step 6: Commit**

```bash
git add src/components/dumb/shared/MaterioDataTable.vue
git commit -m "feat(MaterioDataTable): add collapsible filters, mobile column hiding, segments slot"
```

---

### Task 2: OwnerBookings — Gradient Header & New Table Features

**Files:**
- Modify: `src/components/smart/owner/OwnerBookings.vue`

Replace the duo-tone header + C3 stats bar with V4a gradient header. Wire up collapsible filters, segment tabs, and mobile-optimized columns.

- [ ] **Step 1: Replace the header + stats bar in the template**

Replace everything from `<!-- Header — Sorens-header -->` through `</div>` of the C3 bar (lines 5-51) with:

```vue
<!-- V4a Gradient Header -->
<div class="bookings-header-gradient">
  <div class="d-flex align-center justify-space-between">
    <div class="d-flex align-center ga-2">
      <h1 class="text-h5 font-weight-bold text-white">My Bookings</h1>
      <v-chip color="rgba(255,255,255,0.25)" size="small" variant="flat">
        <span class="text-white font-weight-bold">{{ ownerBookingsArray.length }}</span>
      </v-chip>
    </div>
    <v-btn
      class="header-add-btn-gradient"
      icon="mdi-plus"
      size="small"
      variant="flat"
      @click="handleCreateBooking"
    />
  </div>
</div>
```

- [ ] **Step 2: Add segment tabs and update MaterioDataTable usage**

Replace the `<MaterioDataTable>` opening tag and its `#filters` slot (lines 54-105) with:

```vue
<MaterioDataTable
  :active-filter-count="activeFilterCount"
  expandable
  :headers="tableHeaders"
  :items="bookingItems"
  :loading="loading"
  :search-keys="['property_name', 'status', 'booking_type']"
  searchable
>
  <!-- Segment tabs -->
  <template #segments>
    <div class="d-flex ga-2 flex-wrap">
      <v-btn
        v-for="seg in segments"
        :key="seg.value"
        :color="selectedSegment === seg.value ? '#4338CA' : undefined"
        density="compact"
        rounded="lg"
        size="small"
        :variant="selectedSegment === seg.value ? 'flat' : 'outlined'"
        @click="selectedSegment = seg.value"
      >
        {{ seg.title }}
      </v-btn>
    </div>
  </template>

  <!-- Filters -->
  <template #filters>
    <v-row align="center" density="comfortable">
      <v-col cols="12" sm="4">
        <v-select
          v-model="selectedProperty"
          clearable
          density="compact"
          hide-details
          :items="propertyOptions"
          label="Property"
          prepend-inner-icon="mdi-home-outline"
          variant="outlined"
        />
      </v-col>
      <v-col cols="6" sm="4">
        <v-select
          v-model="selectedStatus"
          clearable
          density="compact"
          hide-details
          :items="statusOptions"
          label="Status"
          prepend-inner-icon="mdi-filter-outline"
          variant="outlined"
        />
      </v-col>
      <v-col cols="6" sm="4">
        <v-select
          v-model="selectedType"
          clearable
          density="compact"
          hide-details
          :items="typeOptions"
          label="Type"
          prepend-inner-icon="mdi-tag-outline"
          variant="outlined"
        />
      </v-col>
    </v-row>
  </template>
```

- [ ] **Step 3: Update the Property column template for color bars**

Replace the `#[item.property_name]` slot (lines 108-116):

```vue
<!-- Property column with color bar -->
<template #[`item.property_name`]="{ item }">
  <div class="d-flex align-center ga-2">
    <div
      class="property-color-bar"
      :style="{ backgroundColor: getPropertyColor(item.property_id) }"
    />
    <span class="font-weight-medium text-body-2">{{ item.property_name }}</span>
  </div>
</template>
```

- [ ] **Step 4: Update the Dates column for condensed format**

Replace the `#[item.dates]` slot (lines 119-125):

```vue
<!-- Dates column — condensed on mobile -->
<template #[`item.dates`]="{ item }">
  <span class="text-body-2 dates-mono">{{ formatDateCondensed(item.checkin_date, item.checkout_date) }}</span>
</template>
```

- [ ] **Step 5: Add script state for segments and active filter count**

In the `<script setup>`, add after the existing reactive state (around line 270):

```typescript
const selectedSegment = ref('all')

const segments = [
  { title: 'All', value: 'all' },
  { title: 'Pending', value: 'pending' },
  { title: 'Scheduled', value: 'scheduled' },
  { title: 'Done', value: 'completed' },
]

const activeFilterCount = computed(() => {
  let count = 0
  if (selectedProperty.value) count++
  if (selectedStatus.value) count++
  if (selectedType.value) count++
  return count
})
```

- [ ] **Step 6: Update bookingItems computed to include segment filtering**

Replace the `bookingItems` computed (lines 301-322):

```typescript
const bookingItems = computed(() => {
  let filtered = ownerBookingsArray.value

  // Segment filter
  if (selectedSegment.value !== 'all') {
    filtered = filtered.filter(b => b.status === selectedSegment.value)
  }

  // Dropdown filters
  if (selectedProperty.value) {
    filtered = filtered.filter(b => b.property_id === selectedProperty.value)
  }
  if (selectedStatus.value) {
    filtered = filtered.filter(b => b.status === selectedStatus.value)
  }
  if (selectedType.value) {
    filtered = filtered.filter(b => b.booking_type === selectedType.value)
  }

  return filtered.map(booking => ({
    ...booking,
    property_name: getPropertyName(booking.property_id),
  })).toSorted((a, b) =>
    new Date(b.checkout_date).getTime() - new Date(a.checkout_date).getTime(),
  )
})
```

- [ ] **Step 7: Update tableHeaders with mobileHidden flags**

Replace the `tableHeaders` array (lines 324-331):

```typescript
const tableHeaders = [
  { title: 'Property', key: 'property_name', sortable: true },
  { title: 'Dates', key: 'dates', sortable: false },
  { title: 'Type', key: 'booking_type', sortable: true, mobileHidden: true },
  { title: 'Status', key: 'status', sortable: true, mobileHidden: true },
  { title: 'Guests', key: 'guest_count', sortable: true, width: '90px', mobileHidden: true },
  { title: 'Actions', key: 'actions', sortable: false, width: '100px', align: 'end' as const, mobileHidden: true },
]
```

- [ ] **Step 8: Add condensed date formatter**

Add this function after the existing `formatDate` function:

```typescript
function formatDateCondensed (checkinDate: string, checkoutDate: string): string {
  const checkin = new Date(checkinDate)
  const checkout = new Date(checkoutDate)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  const cMonth = months[checkin.getMonth()]
  const cDay = checkin.getDate()
  const oMonth = months[checkout.getMonth()]
  const oDay = checkout.getDate()

  if (cMonth === oMonth) {
    return `${cMonth} ${cDay}\u2013${oDay}`
  }
  return `${cMonth} ${cDay}\u2013${oMonth} ${oDay}`
}
```

- [ ] **Step 9: Replace styles**

Replace the entire `<style scoped>` block with:

```css
<style scoped>
.owner-bookings-page {
  min-height: calc(100vh - var(--app-bar-height, 64px));
}

/* V4a Gradient Header */
.bookings-header-gradient {
  padding: 16px 20px;
  background: linear-gradient(160deg, #3730A3 0%, #0284C7 100%);
  margin: -12px -12px 16px -12px;
}

.header-add-btn-gradient {
  background: rgba(255, 255, 255, 0.2) !important;
  color: #FFFFFF !important;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

/* Property color bar */
.property-color-bar {
  width: 3px;
  height: 28px;
  border-radius: 2px;
  flex-shrink: 0;
}

/* Condensed monospace dates */
.dates-mono {
  font-family: 'Geist Mono', 'Roboto Mono', monospace;
  font-size: 12px;
  color: #555;
}
</style>
```

- [ ] **Step 10: Verify build passes**

Run: `pnpm build:fast`
Expected: No TypeScript errors

- [ ] **Step 11: Verify visually on mobile**

1. Run `pnpm dev`
2. Open Chrome DevTools, resize to 390x844 (iPhone 14 Pro)
3. Navigate to `/owner/bookings`
4. Verify: gradient header, collapsed filters, segment tabs, 2-column table with color bars and condensed dates

- [ ] **Step 12: Commit**

```bash
git add src/components/smart/owner/OwnerBookings.vue
git commit -m "feat(OwnerBookings): V4a gradient header, collapsible filters, segment tabs, mobile 2-col table"
```

---

### Task 3: AdminBookings — Standardize to New Pattern

**Files:**
- Modify: `src/components/smart/admin/AdminBookings.vue`

AdminBookings already has a custom `v-expand-transition` filter implementation. Replace it with MaterioDataTable's new built-in collapsible filter support.

- [ ] **Step 1: Remove the custom filter toggle button from the card header**

Find the filter toggle button in the card header area (around line 12-16) and remove it. The MaterioDataTable filter icon will replace it.

- [ ] **Step 2: Move filters into MaterioDataTable's #filters slot**

Remove the custom `<v-expand-transition>` block (lines 29-98) and the `showFilters` ref (line 325). Move the filter fields into the `#filters` slot of MaterioDataTable.

On the MaterioDataTable component, add `:active-filter-count="activeFilterCount"`.

Add a computed for active filter count:

```typescript
const activeFilterCount = computed(() => {
  let count = 0
  if (statusFilter.value) count++
  if (typeFilter.value) count++
  if (propertyFilter.value) count++
  if (dateFrom.value) count++
  if (dateTo.value) count++
  return count
})
```

- [ ] **Step 3: Add segment tabs**

Add a `#segments` slot to MaterioDataTable:

```vue
<template #segments>
  <div class="d-flex ga-2 flex-wrap">
    <v-btn
      v-for="seg in segments"
      :key="seg.value"
      color="primary"
      density="compact"
      rounded="lg"
      size="small"
      :variant="selectedSegment === seg.value ? 'flat' : 'outlined'"
      @click="selectedSegment = seg.value"
    >
      {{ seg.title }}
    </v-btn>
  </div>
</template>
```

Add to script:

```typescript
const selectedSegment = ref('all')

const segments = [
  { title: 'All', value: 'all' },
  { title: 'Pending', value: 'pending' },
  { title: 'Scheduled', value: 'scheduled' },
  { title: 'In Progress', value: 'in_progress' },
  { title: 'Done', value: 'completed' },
]
```

Integrate `selectedSegment` into the existing filter computed.

- [ ] **Step 4: Mark non-essential headers as mobileHidden**

Update the headers array — keep only the primary identifier column and key date/info column visible on mobile. Mark `booking_type`, `status`, `guest_count`, `cleaner`, and `actions` with `mobileHidden: true`.

- [ ] **Step 5: Verify build and commit**

Run: `pnpm build:fast`
Expected: No TypeScript errors

```bash
git add src/components/smart/admin/AdminBookings.vue
git commit -m "feat(AdminBookings): standardize to MaterioDataTable collapsible filters, add segments"
```

---

### Task 4: AdminProperties — Collapsible Filters

**Files:**
- Modify: `src/components/smart/admin/AdminProperties.vue`

This page has 6 inline filter fields (lines 28-109) that are always visible. Move them into MaterioDataTable.

- [ ] **Step 1: Replace the filters-section div with MaterioDataTable slots**

Remove the `<div class="filters-section">` block (lines 28-109). If AdminProperties uses its own `<v-data-table>` instead of MaterioDataTable, first wrap it with MaterioDataTable or add the filter fields into MaterioDataTable's `#filters` slot.

Add `:active-filter-count="activeFilterCount"` to MaterioDataTable.

Compute active filter count:

```typescript
const activeFilterCount = computed(() => {
  let count = 0
  if (statusFilter.value) count++
  if (tierFilter.value) count++
  if (ownerFilter.value) count++
  if (minDuration.value) count++
  if (maxDuration.value) count++
  return count
})
```

- [ ] **Step 2: Add segment tabs**

```typescript
const selectedSegment = ref('all')
const segments = [
  { title: 'All', value: 'all' },
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
]
```

Wire `selectedSegment` into the filter computed.

- [ ] **Step 3: Mark non-essential headers as mobileHidden**

Keep property name and owner visible on mobile. Mark tier, status, duration, and actions as `mobileHidden: true`.

- [ ] **Step 4: Verify build and commit**

Run: `pnpm build:fast`

```bash
git add src/components/smart/admin/AdminProperties.vue
git commit -m "feat(AdminProperties): collapsible filters, segment tabs, mobile column hiding"
```

---

### Task 5: AdminUsers — Collapsible Filters

**Files:**
- Modify: `src/components/smart/admin/AdminUsers.vue`

Inline filters at lines 67-123 with refs at lines 291-293.

- [ ] **Step 1: Move filters into MaterioDataTable #filters slot**

Remove the `<div class="filters-section">` block. Move the role and status `v-select` fields into MaterioDataTable's `#filters` slot. Remove the search `v-text-field` (MaterioDataTable provides its own).

Add `:active-filter-count="activeFilterCount"`:

```typescript
const activeFilterCount = computed(() => {
  let count = 0
  if (roleFilter.value) count++
  if (statusFilter.value) count++
  return count
})
```

- [ ] **Step 2: Add segment tabs**

```typescript
const selectedSegment = ref('all')
const segments = [
  { title: 'All', value: 'all' },
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
]
```

- [ ] **Step 3: Mark non-essential headers as mobileHidden**

Keep user name and role visible on mobile. Mark email, status, created date, and actions as `mobileHidden: true`.

- [ ] **Step 4: Verify build and commit**

Run: `pnpm build:fast`

```bash
git add src/components/smart/admin/AdminUsers.vue
git commit -m "feat(AdminUsers): collapsible filters, segment tabs, mobile column hiding"
```

---

### Task 6: AdminCleaners — Collapsible Filters

**Files:**
- Modify: `src/components/smart/admin/AdminCleaners.vue`

Inline filters at lines 67-101 with refs at lines 313-314.

- [ ] **Step 1: Move filters into MaterioDataTable #filters slot**

Remove the `<div class="filters-section">` block. Move the status `v-select` into MaterioDataTable's `#filters` slot. Remove the search field (MaterioDataTable provides its own).

Add `:active-filter-count="activeFilterCount"`:

```typescript
const activeFilterCount = computed(() => {
  return statusFilter.value ? 1 : 0
})
```

- [ ] **Step 2: Add segment tabs**

```typescript
const selectedSegment = ref('all')
const segments = [
  { title: 'All', value: 'all' },
  { title: 'Active', value: 'active' },
  { title: 'Inactive', value: 'inactive' },
]
```

- [ ] **Step 3: Mark non-essential headers as mobileHidden**

Keep cleaner name and status visible on mobile. Mark email, phone, properties assigned, and actions as `mobileHidden: true`.

- [ ] **Step 4: Verify build and commit**

Run: `pnpm build:fast`

```bash
git add src/components/smart/admin/AdminCleaners.vue
git commit -m "feat(AdminCleaners): collapsible filters, segment tabs, mobile column hiding"
```

---

### Task 7: AdminPropertyOwners — Collapsible Filters

**Files:**
- Modify: `src/components/smart/admin/AdminPropertyOwners.vue`

Inline filters at lines 67-101 with refs at lines 260-261.

- [ ] **Step 1: Move filters into MaterioDataTable #filters slot**

Remove the `<div class="filters-section">` block. Move the status `v-select` into MaterioDataTable's `#filters` slot. Remove the search field (MaterioDataTable provides its own).

Add `:active-filter-count="activeFilterCount"`:

```typescript
const activeFilterCount = computed(() => {
  return statusFilter.value ? 1 : 0
})
```

- [ ] **Step 2: Add segment tabs**

```typescript
const selectedSegment = ref('all')
const segments = [
  { title: 'All', value: 'all' },
  { title: 'Active', value: 'active' },
  { title: 'Invited', value: 'invited' },
]
```

- [ ] **Step 3: Mark non-essential headers as mobileHidden**

Keep owner name and property count visible on mobile. Mark email, status, invite date, and actions as `mobileHidden: true`.

- [ ] **Step 4: Verify build and commit**

Run: `pnpm build:fast`

```bash
git add src/components/smart/admin/AdminPropertyOwners.vue
git commit -m "feat(AdminPropertyOwners): collapsible filters, segment tabs, mobile column hiding"
```

---

### Task 8: Final Verification

- [ ] **Step 1: Full build check**

Run: `pnpm build`
Expected: Clean build, no TypeScript errors

- [ ] **Step 2: Visual verification on mobile**

For each page, resize Chrome DevTools to 390x844 and verify:
1. `/owner/bookings` — gradient header, filter pill collapsed, segment tabs, 2-col table
2. `/admin/bookings` — filter pill collapsed, segment tabs, 2-col table
3. `/admin/properties` — filter pill collapsed, segment tabs, 2-col table
4. `/admin/users` — filter pill collapsed, segment tabs, 2-col table
5. `/admin/cleaners` — filter pill collapsed, segment tabs, 2-col table
6. `/admin/property-owners` — filter pill collapsed, segment tabs, 2-col table

- [ ] **Step 3: Desktop verification**

Resize to 1280x800. Verify all columns still show, filters still toggle, segments still work.
