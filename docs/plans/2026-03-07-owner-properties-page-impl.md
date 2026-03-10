# Owner Properties Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Wire the `/owner/properties` and `/owner/properties/:id` routes to working components, fix the detail page to use composables and add edit/delete/cleaning-schedule, and add status chips to the sidebar.

**Architecture:** Pages are thin wrappers — all logic lives in smart components which call composables (`useOwnerProperties`, `useOwnerBookings`), never raw stores directly. Modals use the existing `PropertyModal` dialog component and `ConfirmationDialog` for destructive confirmations.

**Tech Stack:** Vue 3, Vuetify 3.8.8, Pinia, `useOwnerProperties` + `useOwnerBookings` composables, `useUIStore` for modal state, `vue-router` for navigation.

---

## Key File Paths

- Router: `src/router/index.ts`
- Properties list page (smart): `src/components/smart/owner/OwnerProperties.vue`
- Property detail page (smart): `src/components/smart/owner/OwnerPropertyView.vue`
- Sidebar (smart): `src/components/smart/owner/OwnerSidebar.vue`
- Property form modal (dumb): `src/components/dumb/shared/PropertyModal.vue`
- Confirm dialog (dumb): `src/components/dumb/shared/ConfirmationDialog.vue`
- Owner properties composable: `src/composables/owner/useOwnerProperties.ts`
- Owner bookings composable: `src/composables/owner/useOwnerBookings.ts`

## Commands

```bash
pnpm dev                  # Run dev server to test manually
pnpm test:run             # Run all tests once
pnpm build                # Type-check + build (catch TypeScript errors)
pnpm test -- src/__tests__/stores/property.spec.ts  # Run property tests
```

---

### Task 1: Wire missing routes in the router

**Files:**
- Modify: `src/router/index.ts`

The `/owner/properties` route currently imports `OwnerProperties.vue` directly instead of the page wrapper. Add the missing `/owner/properties/:id` route.

**Step 1: Open the router file and find the `/owner/properties` route**

Locate this block (around line 55):
```ts
{
  path: '/owner/properties',
  name: 'owner-properties',
  component: () => import('@/components/smart/owner/OwnerProperties.vue'),
  meta: {
    layout: 'owner',
    role: 'owner',
    requiresAuth: true
  }
},
```

**Step 2: Replace that route and add the detail route**

Replace the block above with:
```ts
{
  path: '/owner/properties',
  name: 'owner-properties',
  component: () => import('@/pages/owner/properties/index.vue'),
  meta: {
    layout: 'owner',
    role: 'owner',
    requiresAuth: true
  }
},
{
  path: '/owner/properties/:id',
  name: 'owner-property-view',
  component: () => import('@/pages/owner/properties/view.vue'),
  meta: {
    layout: 'owner',
    role: 'owner',
    requiresAuth: true
  }
},
```

**Step 3: Build to confirm no TypeScript errors**

```bash
pnpm build
```
Expected: build succeeds (no new errors introduced).

**Step 4: Commit**

```bash
git add src/router/index.ts
git commit -m "feat: add /owner/properties/:id route and use page wrapper for list"
```

---

### Task 2: Fix OwnerProperties.vue — Edit menu item

**Files:**
- Modify: `src/components/smart/owner/OwnerProperties.vue`

The `editProperty` function currently pushes to `/owner/properties/:id/edit` (a route that does not exist). It should open the `PropertyModal` in edit mode via `uiStore`, consistent with how the Create flow already works on this component.

**Step 1: Find the `editProperty` function in the script**

Locate:
```ts
const editProperty = (property: Property): void => {
  router.push(`/owner/properties/${property.id}/edit`)
}
```

**Step 2: Replace it**

```ts
const editProperty = (property: Property): void => {
  uiStore.openModal('propertyModal', 'edit', property)
}
```

**Step 3: Verify `router` import is no longer needed from this function**

Check the script — `router` is also used by `viewProperty`:
```ts
const viewProperty = (property: Property): void => {
  router.push(`/owner/properties/${property.id}`)
}
```
`router` is still needed. Leave the import.

**Step 4: Build to confirm no TypeScript errors**

```bash
pnpm build
```

**Step 5: Commit**

```bash
git add src/components/smart/owner/OwnerProperties.vue
git commit -m "fix: open edit modal instead of navigating to missing edit route"
```

---

### Task 3: Rewrite OwnerPropertyView.vue

**Files:**
- Modify: `src/components/smart/owner/OwnerPropertyView.vue`

Current issues:
- Uses raw `propertyStore` / `bookingStore` instead of composables
- No edit modal
- No delete confirmation
- Hardcoded "Status: Active"
- Missing cleaning schedule section

**Step 1: Replace the entire `<script setup>` block**

Remove all existing script content and replace with:

```ts
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import PropertyModal from '@/components/dumb/shared/PropertyModal.vue';
import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue';
import { useOwnerProperties } from '@/composables/owner/useOwnerProperties';
import { useOwnerBookings } from '@/composables/owner/useOwnerBookings';
import type { PropertyFormData, Booking } from '@/types';

defineOptions({ name: 'OwnerPropertyViewComponent' });

const router = useRouter();
const route = useRoute();
const propertyId = route.params.id as string;

const {
  myProperties,
  loading,
  fetchMyProperties,
  updateMyProperty,
  deleteMyProperty
} = useOwnerProperties();

const { myBookings, fetchMyBookings } = useOwnerBookings();

const editModalOpen = ref(false);
const deleteDialogOpen = ref(false);

// Derive property from composable (reactive, no raw store)
const property = computed(() => myProperties.value.find(p => p.id === propertyId) ?? null);

// All bookings for this property, most recent first
const propertyBookings = computed(() =>
  myBookings.value
    .filter(b => b.property_id === propertyId)
    .sort((a, b) => new Date(b.checkin_date).getTime() - new Date(a.checkin_date).getTime())
    .slice(0, 10)
);

// Upcoming bookings sorted ascending — for the cleaning schedule
const upcomingSchedule = computed(() => {
  const today = new Date();
  return myBookings.value
    .filter(b => b.property_id === propertyId && new Date(b.checkin_date) >= today)
    .sort((a, b) => new Date(a.checkin_date).getTime() - new Date(b.checkin_date).getTime())
    .slice(0, 10);
});

const totalBookings = computed(() => propertyBookings.value.length);
const upcomingCount = computed(() => upcomingSchedule.value.length);

onMounted(async () => {
  await Promise.all([fetchMyProperties(), fetchMyBookings()]);
  if (!property.value) router.push('/owner/properties');
});

const handleEdit = () => { editModalOpen.value = true; };
const handleDelete = () => { deleteDialogOpen.value = true; };

const handleEditSave = async (data: PropertyFormData) => {
  await updateMyProperty(propertyId, data);
  editModalOpen.value = false;
};

const confirmDelete = async () => {
  await deleteMyProperty(propertyId);
  router.push('/owner/properties');
};

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

const formatDateRange = (checkin: string, checkout: string) => {
  const ci = new Date(checkin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const co = new Date(checkout).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${ci} — ${co}`;
};

const formatBookingTitle = (booking: Booking) =>
  booking.booking_type === 'turn' ? 'Turn Booking' : 'Standard Booking';

const getBookingStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed': return 'success';
    case 'pending': return 'warning';
    case 'cancelled': return 'error';
    default: return 'primary';
  }
};
```

**Step 2: Replace the entire `<template>` block**

```html
<template>
  <div class="property-view-page">
    <v-container fluid>

      <!-- Header -->
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="d-flex align-center">
              <v-btn icon="mdi-arrow-left" variant="text" @click="router.push('/owner/properties')" />
              <h1 class="text-h4 ml-4">
                {{ property?.name || 'Property Details' }}
              </h1>
              <v-chip
                v-if="property"
                :color="property.active ? 'success' : 'grey'"
                size="small"
                class="ml-3"
              >
                {{ property.active ? 'Active' : 'Inactive' }}
              </v-chip>
            </div>
            <div v-if="property" class="d-flex gap-2">
              <v-btn color="primary" prepend-icon="mdi-pencil" @click="handleEdit">Edit</v-btn>
              <v-btn color="error" variant="outlined" prepend-icon="mdi-delete" @click="handleDelete">Delete</v-btn>
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- Loading state -->
      <v-row v-if="loading && !property">
        <v-col cols="12">
          <v-card>
            <v-card-text class="text-center py-8">
              <v-progress-circular indeterminate color="primary" />
              <div class="mt-4">Loading property...</div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Main content -->
      <v-row v-else-if="property">

        <!-- Left column -->
        <v-col cols="12" md="8">

          <!-- Property Info -->
          <v-card class="mb-4">
            <v-card-title>
              <v-icon color="primary" class="mr-2">mdi-home</v-icon>
              Property Information
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12" sm="6">
                  <div class="property-detail">
                    <strong>Name:</strong>
                    <div>{{ property.name }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="property-detail">
                    <strong>Type:</strong>
                    <div>{{ property.property_type || 'Not specified' }}</div>
                  </div>
                </v-col>
                <v-col cols="12">
                  <div class="property-detail">
                    <strong>Address:</strong>
                    <div>{{ property.address }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="property-detail">
                    <strong>Bedrooms:</strong>
                    <div>{{ property.bedrooms || 'Not specified' }}</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="6">
                  <div class="property-detail">
                    <strong>Bathrooms:</strong>
                    <div>{{ property.bathrooms || 'Not specified' }}</div>
                  </div>
                </v-col>
                <v-col v-if="property.special_instructions" cols="12">
                  <div class="property-detail">
                    <strong>Special Instructions:</strong>
                    <div>{{ property.special_instructions }}</div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Cleaning Schedule -->
          <v-card class="mb-4">
            <v-card-title>
              <v-icon color="warning" class="mr-2">mdi-broom</v-icon>
              Cleaning Schedule
            </v-card-title>
            <v-card-text>
              <div v-if="upcomingSchedule.length === 0" class="text-center py-4">
                <v-icon color="grey" size="48">mdi-calendar-blank-outline</v-icon>
                <div class="text-body-1 text-medium-emphasis mt-2">No upcoming bookings</div>
              </div>
              <v-list v-else density="compact">
                <v-list-item
                  v-for="booking in upcomingSchedule"
                  :key="booking.id"
                >
                  <v-list-item-title>{{ formatDateRange(booking.checkin_date, booking.checkout_date) }}</v-list-item-title>
                  <v-list-item-subtitle>Cleaning window: {{ property.cleaning_duration }} min</v-list-item-subtitle>
                  <template #append>
                    <v-chip
                      :color="booking.booking_type === 'turn' ? 'warning' : 'primary'"
                      size="x-small"
                    >
                      {{ booking.booking_type === 'turn' ? 'Turn' : 'Standard' }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Recent Bookings -->
          <v-card>
            <v-card-title>
              <v-icon color="info" class="mr-2">mdi-calendar-multiple</v-icon>
              Recent Bookings
            </v-card-title>
            <v-card-text>
              <div v-if="propertyBookings.length === 0" class="text-center py-4">
                <v-icon color="grey" size="48">mdi-calendar-outline</v-icon>
                <div class="text-body-1 text-medium-emphasis mt-2">No bookings yet</div>
              </div>
              <v-list v-else density="compact">
                <v-list-item
                  v-for="booking in propertyBookings"
                  :key="booking.id"
                >
                  <v-list-item-title>{{ formatBookingTitle(booking) }}</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDateRange(booking.checkin_date, booking.checkout_date) }}</v-list-item-subtitle>
                  <template #append>
                    <v-chip :color="getBookingStatusColor(booking.status)" size="small">
                      {{ booking.status }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

        </v-col>

        <!-- Right column -->
        <v-col cols="12" md="4">

          <!-- Stats -->
          <v-card class="mb-4">
            <v-card-title>
              <v-icon color="success" class="mr-2">mdi-chart-line</v-icon>
              Statistics
            </v-card-title>
            <v-card-text>
              <div class="stat-item">
                <div class="stat-value">{{ totalBookings }}</div>
                <div class="stat-label">Total Bookings</div>
              </div>
              <div class="stat-item">
                <div class="stat-value">{{ upcomingCount }}</div>
                <div class="stat-label">Upcoming Bookings</div>
              </div>
              <div class="stat-item">
                <v-chip :color="property.active ? 'success' : 'grey'" size="small">
                  {{ property.active ? 'Active' : 'Inactive' }}
                </v-chip>
                <div class="stat-label mt-1">Status</div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Details -->
          <v-card>
            <v-card-title>
              <v-icon color="info" class="mr-2">mdi-information</v-icon>
              Details
            </v-card-title>
            <v-card-text class="text-body-2">
              <p><strong>Pricing Tier:</strong> {{ property.pricing_tier }}</p>
              <p><strong>Cleaning Duration:</strong> {{ property.cleaning_duration }} min</p>
              <p v-if="property.created_at"><strong>Created:</strong> {{ formatDate(property.created_at) }}</p>
              <p v-if="property.updated_at"><strong>Last Updated:</strong> {{ formatDate(property.updated_at) }}</p>
            </v-card-text>
          </v-card>

        </v-col>
      </v-row>

    </v-container>

    <!-- Edit Modal -->
    <PropertyModal
      :open="editModalOpen"
      mode="edit"
      :property="property ?? undefined"
      @close="editModalOpen = false"
      @save="handleEditSave"
    />

    <!-- Delete Confirmation -->
    <ConfirmationDialog
      :open="deleteDialogOpen"
      title="Delete Property"
      :message="`Are you sure you want to delete &quot;${property?.name}&quot;? This cannot be undone.`"
      confirm-text="Delete"
      cancel-text="Cancel"
      :dangerous="true"
      @confirm="confirmDelete"
      @cancel="deleteDialogOpen = false"
      @close="deleteDialogOpen = false"
    />
  </div>
</template>
```

**Step 3: Replace the `<style scoped>` block**

```css
<style scoped>
.property-view-page {
  min-height: 100vh;
  background: #f8f9fa;
}

.property-detail {
  margin-bottom: 16px;
}

.property-detail strong {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.property-detail div {
  margin-top: 4px;
  font-size: 0.95rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px 0;
  border-bottom: 1px solid #e0e0e0;
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

.stat-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 4px;
}

.gap-2 {
  gap: 8px;
}
</style>
```

**Step 4: Build to confirm no TypeScript errors**

```bash
pnpm build
```
Expected: clean build (pay attention to any type errors on `property ?? undefined` or the composable returns).

**Step 5: Run tests**

```bash
pnpm test:run
```
Expected: all existing tests pass.

**Step 6: Commit**

```bash
git add src/components/smart/owner/OwnerPropertyView.vue
git commit -m "feat: rewrite OwnerPropertyView with composables, edit modal, delete, and cleaning schedule"
```

---

### Task 4: Add status chips to the sidebar property list

**Files:**
- Modify: `src/components/smart/owner/OwnerSidebar.vue`

The sidebar lists properties as compact items. Add a small `v-chip` showing Active/Inactive status after the property title. Keep the click-to-filter behavior unchanged.

**Step 1: Find the property list item template**

Locate the `<v-list-item>` loop inside the Properties section (the one with `v-for="property in properties"`):

```html
<div class="property-content">
  <div
    class="property-title"
    style="cursor: pointer;"
    @click.stop="editProperty(property)"
  >
    {{ property.name }}
  </div>
  <div class="property-subtitle">
    {{ property.address }}
  </div>
</div>
```

**Step 2: Add the status chip after the property title div**

```html
<div class="property-content">
  <div class="d-flex align-center gap-1">
    <div
      class="property-title"
      style="cursor: pointer;"
      @click.stop="editProperty(property)"
    >
      {{ property.name }}
    </div>
    <v-chip
      :color="property.active ? 'success' : 'grey'"
      size="x-small"
      variant="tonal"
    >
      {{ property.active ? 'Active' : 'Off' }}
    </v-chip>
  </div>
  <div class="property-subtitle">
    {{ property.address }}
  </div>
</div>
```

**Step 3: Build and test**

```bash
pnpm build && pnpm test:run
```
Expected: clean.

**Step 4: Commit**

```bash
git add src/components/smart/owner/OwnerSidebar.vue
git commit -m "feat: add active/inactive status chip to sidebar property list"
```

---

### Task 5: Final verification

**Step 1: Run full build and tests**

```bash
pnpm build && pnpm test:run
```
Expected: no errors, all tests pass.

**Step 2: Manual smoke test in dev server**

```bash
pnpm dev
```

Test these flows:
1. Navigate to `/owner/properties` — card grid loads, shows properties
2. Click a property card — navigates to `/owner/properties/:id`, detail page shows
3. On detail page — Edit button opens `PropertyModal` dialog in edit mode, save works
4. On detail page — Delete button shows `ConfirmationDialog`, confirm navigates back to list
5. On detail page — Cleaning Schedule section shows upcoming bookings with Turn/Standard chips
6. In sidebar — each property shows Active/Off chip, clicking still filters calendar

**Step 3: Push branch and open PR**

```bash
git push -u origin feature/owner-properties-page
gh pr create --title "feat: owner properties page — routes, detail view, sidebar chips" \
  --body "Wires /owner/properties/:id route, rewrites OwnerPropertyView with composables + edit/delete + cleaning schedule, fixes Edit menu item on card grid, adds status chips to sidebar."
```
