# Owner Layout & Navigation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `src/layouts/owner.vue` into a real layout shell so every owner page has a persistent app bar and sidebar — no more navigation disappearing when you leave the dashboard.

**Architecture:** Move `<v-app-bar>` and `<v-navigation-drawer>` from `HomeOwner.vue` into `owner.vue`. A new `OwnerNavigationDrawer` component handles the sidebar with dynamic active state and a Google Calendar–style property list at the bottom. `HomeOwner.vue` becomes a pure calendar page component.

**Tech Stack:** Vue 3 `<script setup lang="ts">`, Vuetify 4 (`v-app-bar`, `v-navigation-drawer`, `v-main`, `v-bottom-navigation`), Pinia (`useAuthStore`, `usePropertyStore`), Vue Router (`useRoute`, `useRouter`), Vitest

---

## File Map

| Action | File | Responsibility |
|--------|------|---------------|
| **Create** | `src/components/smart/owner/OwnerNavigationDrawer.vue` | Nav drawer: items, active state, property list, user row |
| **Create** | `src/components/smart/owner/OwnerSettings.vue` | Stub settings page (prevents dead link) |
| **Create** | `src/pages/owner/settings.vue` | 7-line thin wrapper mounting OwnerSettings |
| **Create** | `src/components/smart/owner/OwnerBottomNav.vue` | Mobile bottom navigation bar (4 items) |
| **Create** | `src/__tests__/components/owner/OwnerNavigationDrawer.spec.ts` | Unit tests for nav logic |
| **Modify** | `src/layouts/owner.vue` | Full layout shell: app bar + drawer + v-main |
| **Modify** | `src/components/smart/owner/HomeOwner.vue` | Strip layout chrome; keep calendar + modals |
| **Modify** | `src/router/index.ts` | Add settings route; redirect /owner/calendar |
| **Delete** | `src/components/smart/owner/OwnerSidebar.vue` | Replaced by OwnerNavigationDrawer |
| **Delete** | `src/components/smart/owner/OwnerCalendarPage.vue` | Dead code (duplicate calendar) |
| **Delete** | `src/pages/owner/calendar.vue` | Dead code (router redirects away) |

---

## Chunk 1: OwnerNavigationDrawer + Tests

### Task 1: Write tests for nav drawer logic

**Files:**
- Create: `src/__tests__/components/owner/OwnerNavigationDrawer.spec.ts`

- [ ] **Step 1.1: Create the test file**

```typescript
// src/__tests__/components/owner/OwnerNavigationDrawer.spec.ts
import { describe, it, expect } from 'vitest'

// Pure helpers extracted from the component — test them in isolation
// before the component exists to drive the design.

// isNavItemActive: returns true when the current path matches the item's route.
// It should also match child routes (e.g. /owner/properties/123 → Properties active).
function isNavItemActive(itemPath: string, currentPath: string): boolean {
  if (itemPath === currentPath) return true
  // Match child routes, but don't let /owner/dashboard match /owner/dashboard-other
  return currentPath.startsWith(itemPath + '/')
}

// propertyColor: cycles through 4 brand colors by index
const PROPERTY_COLORS = ['#5c6bc0', '#43a047', '#8e24aa', '#f57c00']
function propertyColor(index: number): string {
  return PROPERTY_COLORS[index % PROPERTY_COLORS.length]
}

describe('isNavItemActive', () => {
  it('returns true for exact match', () => {
    expect(isNavItemActive('/owner/dashboard', '/owner/dashboard')).toBe(true)
  })
  it('returns true for child route', () => {
    expect(isNavItemActive('/owner/properties', '/owner/properties/abc123')).toBe(true)
  })
  it('returns false for different route', () => {
    expect(isNavItemActive('/owner/bookings', '/owner/dashboard')).toBe(false)
  })
  it('does not match partial prefix without slash', () => {
    // /owner/dashboard should NOT match /owner/dashboard-extra
    expect(isNavItemActive('/owner/dashboard', '/owner/dashboard-extra')).toBe(false)
  })
})

describe('propertyColor', () => {
  it('returns first color for index 0', () => {
    expect(propertyColor(0)).toBe('#5c6bc0')
  })
  it('returns fourth color for index 3', () => {
    expect(propertyColor(3)).toBe('#f57c00')
  })
  it('cycles back to first color at index 4', () => {
    expect(propertyColor(4)).toBe('#5c6bc0')
  })
})
```

- [ ] **Step 1.2: Run tests — expect PASS (pure logic, no deps)**

```bash
cd c:/Users/Soren/claro4
pnpm test -- src/__tests__/components/owner/OwnerNavigationDrawer.spec.ts
```

Expected: 7 tests pass.

---

### Task 2: Create OwnerNavigationDrawer component

**Files:**
- Create: `src/components/smart/owner/OwnerNavigationDrawer.vue`

- [ ] **Step 2.1: Create the component**

```vue
<!-- src/components/smart/owner/OwnerNavigationDrawer.vue -->
<template>
  <v-navigation-drawer
    :model-value="modelValue"
    :permanent="mdAndUp"
    :temporary="!mdAndUp"
    width="264"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <!-- Navigation section -->
    <v-list nav density="compact" class="pt-2">
      <v-list-subheader class="text-overline">Navigation</v-list-subheader>

      <template v-for="item in navItems" :key="item.label">
        <v-list-item
          :prepend-icon="item.icon"
          :title="item.label"
          :to="item.disabled ? undefined : item.to"
          :active="isActive(item.to)"
          :disabled="item.disabled"
          active-color="primary"
          rounded="lg"
          @click="item.disabled ? undefined : onNavItemClick()"
        >
          <template v-if="item.soon" #append>
            <v-chip size="x-small" color="success" variant="tonal" class="text-uppercase font-weight-bold">
              Soon
            </v-chip>
          </template>
        </v-list-item>
      </template>
    </v-list>

    <v-divider class="mx-4 my-1" />

    <!-- Account section -->
    <v-list nav density="compact">
      <v-list-subheader class="text-overline">Account</v-list-subheader>
      <v-list-item
        v-for="item in accountItems"
        :key="item.label"
        :prepend-icon="item.icon"
        :title="item.label"
        :to="item.to"
        :active="isActive(item.to)"
        active-color="primary"
        rounded="lg"
        @click="onNavItemClick()"
      />
    </v-list>

    <!-- Bottom: user profile + My Properties -->
    <template #append>
      <v-divider />
      <div class="pa-3 pb-1">
        <!-- User row -->
        <div class="d-flex align-center gap-3 px-1 py-2">
          <v-avatar color="primary" size="30">
            <span class="text-caption font-weight-bold">{{ userInitials }}</span>
          </v-avatar>
          <div class="overflow-hidden">
            <div class="text-body-2 font-weight-semibold text-truncate">{{ userName }}</div>
            <div class="text-caption text-medium-emphasis text-truncate">{{ userEmail }}</div>
          </div>
        </div>

        <!-- My Properties list -->
        <div v-if="properties.length" class="mt-1">
          <div class="text-overline text-medium-emphasis px-1 mb-1" style="font-size:0.67rem">My Properties</div>
          <v-list nav density="compact" class="pa-0">
            <v-list-item
              v-for="(property, index) in properties"
              :key="property.id"
              :to="`/owner/properties/${property.id}`"
              :active="route.path === `/owner/properties/${property.id}`"
              active-color="primary"
              rounded="lg"
              class="property-nav-item"
              @click="onNavItemClick()"
            >
              <template #prepend>
                <v-icon
                  icon="mdi-home"
                  :style="{ color: propertyColor(index), opacity: 0.6 }"
                  size="20"
                />
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">
                {{ property.name }}
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </div>
      </div>
      <div class="pb-2" />
    </template>
  </v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@stores/auth'
import { useOwnerProperties } from '@composables/owner/useOwnerProperties'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const route = useRoute()
const { mdAndUp } = useDisplay()
const authStore = useAuthStore()
// useOwnerProperties exports `myProperties` — alias it for clarity in this component
const { myProperties: properties } = useOwnerProperties()

// ── Nav items ──────────────────────────────────────────────────
const navItems = [
  { label: 'Schedule',          icon: 'mdi-calendar-month-outline',  to: '/owner/dashboard' },
  { label: 'Check-ins & Turns', icon: 'mdi-clipboard-check-outline', to: '/owner/checkins', disabled: true, soon: true },
  { label: 'Bookings',          icon: 'mdi-format-list-bulleted',     to: '/owner/bookings' },
  { label: 'Properties',        icon: 'mdi-home-outline',             to: '/owner/properties' },
]

const accountItems = [
  { label: 'Settings', icon: 'mdi-cog-outline', to: '/owner/settings' },
]

// ── Active state ───────────────────────────────────────────────
function isActive(itemPath: string): boolean {
  if (itemPath === route.path) return true
  return route.path.startsWith(itemPath + '/')
}

// ── Property colors ────────────────────────────────────────────
const PROPERTY_COLORS = ['#5c6bc0', '#43a047', '#8e24aa', '#f57c00']
function propertyColor(index: number): string {
  return PROPERTY_COLORS[index % PROPERTY_COLORS.length]
}

// ── User info ──────────────────────────────────────────────────
const userName = computed(() => {
  return authStore.user?.user_metadata?.full_name
    || authStore.user?.email?.split('@')[0]
    || 'Owner'
})

const userEmail = computed(() => authStore.user?.email || '')

const userInitials = computed(() => {
  return userName.value
    .split(' ')
    .map((n: string) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

// ── Close on mobile nav ────────────────────────────────────────
function onNavItemClick() {
  if (!mdAndUp.value) {
    emit('update:modelValue', false)
  }
}
</script>

<style scoped>
.property-nav-item :deep(.v-list-item__prepend) {
  width: 36px;
}
</style>
```

- [ ] **Step 2.2: Commit**

```bash
git add src/__tests__/components/owner/OwnerNavigationDrawer.spec.ts \
        src/components/smart/owner/OwnerNavigationDrawer.vue
git commit -m "feat: add OwnerNavigationDrawer with dynamic active state and property list"
```

---

## Chunk 2: Owner Layout Shell

### Task 3: Rewrite owner.vue as a full layout shell

**Files:**
- Modify: `src/layouts/owner.vue`
- Create: `src/components/smart/owner/OwnerBottomNav.vue`

- [ ] **Step 3.1: Create the mobile bottom nav component**

```vue
<!-- src/components/smart/owner/OwnerBottomNav.vue -->
<template>
  <v-bottom-navigation
    v-if="smAndDown"
    :model-value="activeTab"
    color="primary"
    grow
    elevation="8"
  >
    <v-btn value="/owner/dashboard" :to="'/owner/dashboard'">
      <v-icon>mdi-calendar-month-outline</v-icon>
      <span>Schedule</span>
    </v-btn>
    <v-btn value="/owner/bookings" :to="'/owner/bookings'">
      <v-icon>mdi-format-list-bulleted</v-icon>
      <span>Bookings</span>
    </v-btn>
    <v-btn value="/owner/properties" :to="'/owner/properties'">
      <v-icon>mdi-home-outline</v-icon>
      <span>Properties</span>
    </v-btn>
    <v-btn value="more" @click="emit('open-drawer')">
      <v-icon>mdi-menu</v-icon>
      <span>More</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'

const emit = defineEmits<{ 'open-drawer': [] }>()

const route = useRoute()
const { smAndDown } = useDisplay()

const activeTab = computed(() => {
  const path = route.path
  if (path.startsWith('/owner/bookings')) return '/owner/bookings'
  if (path.startsWith('/owner/properties')) return '/owner/properties'
  if (path === '/owner/dashboard') return '/owner/dashboard'
  return undefined
})
</script>
```

- [ ] **Step 3.2: Rewrite owner.vue**

```vue
<!-- src/layouts/owner.vue -->
<template>
  <v-app>
    <v-app-bar height="56" flat color="white" border="b">
      <v-app-bar-nav-icon
        :icon="sidebarOpen ? 'mdi-menu-open' : 'mdi-menu'"
        @click="sidebarOpen = !sidebarOpen"
      />
      <v-app-bar-title>
        <div class="d-flex align-center ga-2">
          <div class="brand-mark text-caption font-weight-black">C</div>
          <span class="text-h6 font-weight-bold text-primary">Claro</span>
        </div>
      </v-app-bar-title>

      <template #append>
        <!-- Notification bell (stub) -->
        <v-btn icon="mdi-bell-outline" variant="text" color="default" class="mr-1" />

        <v-menu location="bottom end">
          <template #activator="{ props: menuProps }">
            <v-avatar
              v-bind="menuProps"
              color="primary"
              size="32"
              class="mr-2"
              style="cursor: pointer"
            >
              <span class="text-caption font-weight-bold">{{ userInitials }}</span>
            </v-avatar>
          </template>
          <v-list density="compact" min-width="160">
            <v-list-item
              prepend-icon="mdi-account-outline"
              title="Profile"
              :to="'/owner/profile'"
            />
            <v-divider />
            <v-list-item
              prepend-icon="mdi-logout"
              title="Sign Out"
              @click="handleSignOut"
            />
          </v-list>
        </v-menu>
      </template>
    </v-app-bar>

    <OwnerNavigationDrawer v-model="sidebarOpen" />

    <v-main>
      <router-view />
    </v-main>

    <OwnerBottomNav @open-drawer="sidebarOpen = true" />
  </v-app>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@stores/auth'
import OwnerNavigationDrawer from '@/components/smart/owner/OwnerNavigationDrawer.vue'
import OwnerBottomNav from '@/components/smart/owner/OwnerBottomNav.vue'

const { mdAndUp } = useDisplay()
const router = useRouter()
const authStore = useAuthStore()

// Desktop: open by default; mobile: closed by default
const sidebarOpen = ref(mdAndUp.value)

const userInitials = computed(() => {
  const name =
    authStore.user?.user_metadata?.full_name ||
    authStore.user?.email ||
    'U'
  return name
    .split(' ')
    .map((n: string) => n[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

async function handleSignOut() {
  await authStore.logout()
  router.push('/')
}
</script>

<style scoped>
.brand-mark {
  width: 26px;
  height: 26px;
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.82rem;
}
</style>
```

- [ ] **Step 3.3: Verify dev server starts without errors**

```bash
pnpm dev:local
```

Expected: No console errors. Navigate to `/owner/dashboard` — app bar and sidebar visible.

- [ ] **Step 3.4: Commit**

```bash
git add src/layouts/owner.vue src/components/smart/owner/OwnerBottomNav.vue
git commit -m "feat: restructure owner.vue as persistent layout shell with app bar and drawer"
```

---

## Chunk 3: Strip HomeOwner.vue

### Task 4: Remove layout chrome from HomeOwner.vue

HomeOwner.vue currently renders the app bar, sidebar, and margin calculations. All of that moves to `owner.vue`. HomeOwner becomes a pure calendar page.

**Files:**
- Modify: `src/components/smart/owner/HomeOwner.vue`

- [ ] **Step 4.1: Remove the app bar block (lines 17–41 in template)**

Find and delete the entire `<v-app-bar>` block:

```
<!-- Main App Header -->
<v-app-bar
  order="0"
  app
  flat
  height="56"
  class="main-app-header"
  :class="{ 'sidebar-open': sidebarOpen && !mobile }"
  color="white"
>
  <v-app-bar-nav-icon
    color="black"
    @click="toggleSidebar"
  />
  <!--logo-->
  <v-app-bar-title class="app-title">
    <div class="brand-container">
      <div class="brand-icon">
        C
      </div>
      <span class="brand-text">Claro</span>
    </div>
  </v-app-bar-title>
  <!--logo-->
</v-app-bar>
```

- [ ] **Step 4.2: Remove the OwnerSidebar component from the template**

Find and delete:
```
<OwnerSidebar
  v-model="sidebarOpen"
  @create-booking="handleCreateBooking"
  @create-property="handleCreateProperty"
  @edit-property="handleEditProperty"
  @view-property="handleViewProperty"
/>
```

- [ ] **Step 4.3: Remove the outer layout wrapper div and its class binding**

The template currently has:
```html
<div class="calendar-main-container" :class="{ 'sidebar-open': sidebarOpen && !mobile }">
  <div class="calendar-layout">
    ...calendar content...
  </div>
</div>
```

Simplify to just:
```html
<div class="calendar-layout">
  ...calendar content...
</div>
```

- [ ] **Step 4.4: Remove the "Dashboard" speed dial action (keep Add Turn, Add House, Add Booking)**

Find and delete only this block from the `<v-speed-dial>`:
```html
<!-- Dashboard -->
<div class="speed-dial-action">
  <span class="text-body-2 font-weight-medium">Dashboard</span>
  <v-fab
    icon="mdi-view-dashboard"
    size="large"
    color="secondary"
    rounded="circle"
    @click="toggleSidebar"
  />
</div>
```

- [ ] **Step 4.5: Remove dead script imports and state**

In `<script setup>`, make the following definitive removals:

- `import OwnerSidebar from '@/components/smart/owner/OwnerSidebar.vue'`
- `const sidebarOpen = ref(false)` and the `toggleSidebar()` function
- `handleEditProperty` (lines ~529) — only called from OwnerSidebar emits, safe to delete
- `handleViewProperty` (lines ~540) — only called from OwnerSidebar emits, safe to delete
- **Keep** `handleCreateBooking` — still called by the mobile FAB
- **Keep** `handleCreateProperty`, `handlePropertyModalSave`, `handlePropertyModalClose`, `handlePropertyModalDelete` — still used by the PropertyModal and FAB
- Remove `xs` from `useDisplay()` destructure (was `const { xs, mobile } = useDisplay()` — change to `const { mobile } = useDisplay()`)
- Delete the `watch(xs, ...)` watcher that closed `sidebarOpen` on mobile resize — both `xs` and `sidebarOpen` are gone

- [ ] **Step 4.6: Clean up the CSS — remove sidebar-related rules**

In `<style>`, remove any rules referencing `.sidebar-open`, `.main-app-header`, `.brand-container`, `.brand-icon`, `.brand-text`, `.calendar-main-container`. Keep all calendar-specific styles.

- [ ] **Step 4.7: Wrap the template root element**

The component now has no `<v-app-bar>` wrapper. The root element should be a simple `<div class="home-owner-page">` that fills the available `v-main` area with `height: 100%`:

```vue
<template>
  <div class="home-owner-page">
    <!-- Calendar header card -->
    ...
    <!-- Calendar content -->
    ...
    <!-- Modals -->
    ...
    <!-- Mobile FAB (only on mobile) -->
    ...
  </div>
</template>
```

And add to `<style scoped>`:
```css
.home-owner-page {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.calendar-content {
  flex: 1;
  overflow: hidden;
}
```

- [ ] **Step 4.8: Verify calendar page still works**

```bash
pnpm dev:local
```

Navigate to `/owner/dashboard`. Expected:
- App bar from `owner.vue` visible (hamburger, Claro brand, avatar)
- Sidebar visible on desktop
- Calendar renders correctly
- Clicking a date still opens booking modal
- FAB still works on mobile (3 actions: Add Turn, Add House, Add Booking)

- [ ] **Step 4.9: Verify other pages now have persistent nav**

Navigate to `/owner/bookings`, `/owner/properties`, `/owner/profile`. Expected:
- App bar visible on all pages
- Sidebar accessible on all pages via hamburger

- [ ] **Step 4.10: Commit**

```bash
git add src/components/smart/owner/HomeOwner.vue
git commit -m "refactor: strip layout chrome from HomeOwner.vue — calendar page only"
```

---

## Chunk 4: Router + Settings Stub

### Task 5: Add /owner/settings route

**Files:**
- Create: `src/pages/owner/settings.vue`
- Create: `src/components/smart/owner/OwnerSettings.vue`
- Modify: `src/router/index.ts`

- [ ] **Step 5.1: Create the OwnerSettings stub component**

```vue
<!-- src/components/smart/owner/OwnerSettings.vue -->
<template>
  <v-container class="pa-4">
    <v-row>
      <v-col cols="12" md="8" lg="6">
        <div class="text-h5 font-weight-bold mb-1">Settings</div>
        <div class="text-body-2 text-medium-emphasis mb-4">Account and application settings</div>
        <v-alert
          type="info"
          icon="mdi-cog-outline"
          variant="tonal"
        >
          Account settings are coming soon. Check back in a future update.
        </v-alert>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
// Stub — settings implementation is out of scope for this sub-project
</script>
```

- [ ] **Step 5.2: Create the settings page wrapper**

```vue
<!-- src/pages/owner/settings.vue -->
<script setup lang="ts">
import OwnerSettings from '@/components/smart/owner/OwnerSettings.vue'
</script>

<template>
  <OwnerSettings />
</template>
```

- [ ] **Step 5.3: Add settings route and redirect calendar in router/index.ts**

In `src/router/index.ts`, inside the owner routes section, add after the existing `owner-property-view` route:

```typescript
{
  path: '/owner/settings',
  name: 'owner-settings',
  component: () => import('@/pages/owner/settings.vue'),
  meta: {
    layout: 'owner',
    role: 'owner',
    requiresAuth: true
  }
},
```

Replace the `owner-calendar` route entry:
```typescript
// BEFORE:
{
  path: '/owner/calendar',
  name: 'owner-calendar',
  component: () => import('@/pages/owner/calendar.vue'),
  meta: { layout: 'owner', role: 'owner', requiresAuth: true }
},
```

With a redirect:
```typescript
// AFTER:
{
  path: '/owner/calendar',
  redirect: '/owner/dashboard'
},
```

- [ ] **Step 5.4: Verify the settings route works**

```bash
pnpm dev:local
```

Navigate to `/owner/settings`. Expected: "Settings coming soon" page renders inside the layout shell (app bar + sidebar visible). No navigation failures.

Navigate to `/owner/calendar`. Expected: redirects to `/owner/dashboard`.

- [ ] **Step 5.5: Commit**

```bash
git add src/pages/owner/settings.vue \
        src/components/smart/owner/OwnerSettings.vue \
        src/router/index.ts
git commit -m "feat: add /owner/settings stub route; redirect /owner/calendar to dashboard"
```

---

## Chunk 5: Delete Dead Code + Final Verification

### Task 6: Delete OwnerSidebar and duplicate calendar files

**Files:**
- Delete: `src/components/smart/owner/OwnerSidebar.vue`
- Delete: `src/components/smart/owner/OwnerCalendarPage.vue`
- Delete: `src/pages/owner/calendar.vue`

- [ ] **Step 6.1: Verify nothing imports OwnerSidebar before deleting**

```bash
grep -r "OwnerSidebar" src/ --include="*.vue" --include="*.ts"
```

Expected: zero results (we already removed the import from HomeOwner.vue in Task 4.5).

- [ ] **Step 6.2: Verify nothing imports OwnerCalendarPage or calendar.vue**

```bash
grep -r "OwnerCalendarPage\|owner/calendar" src/ --include="*.vue" --include="*.ts"
```

Expected: zero results (router now redirects, no component imports).

- [ ] **Step 6.3: Delete the files**

```bash
rm src/components/smart/owner/OwnerSidebar.vue
rm src/components/smart/owner/OwnerCalendarPage.vue
rm src/pages/owner/calendar.vue
```

- [ ] **Step 6.4: Run the full test suite**

```bash
cd c:/Users/Soren/claro4
pnpm test:run
```

Expected: all tests pass. Fix any failures before proceeding.

- [ ] **Step 6.5: Run the full build (type-checks too)**

```bash
pnpm build
```

Expected: zero TypeScript errors, build succeeds. Fix any type errors before proceeding.

- [ ] **Step 6.6: Manual verification checklist**

Start dev server with `pnpm dev:local` and verify all success criteria:

- [ ] App bar (hamburger + Claro brand + avatar) visible on `/owner/dashboard`
- [ ] App bar visible on `/owner/bookings` (was white-screening before)
- [ ] App bar visible on `/owner/properties`
- [ ] App bar visible on `/owner/profile`
- [ ] App bar visible on `/owner/settings`
- [ ] Sidebar opens/closes via hamburger on every page
- [ ] Active nav item highlights correctly on each page
- [ ] Desktop: sidebar defaults to open on page load
- [ ] Properties nav item highlights when on `/owner/properties/:id`
- [ ] "Check-ins & Turns" shows "Soon" badge and is not clickable
- [ ] Settings nav item navigates to the stub settings page
- [ ] User avatar dropdown shows Profile and Sign Out
- [ ] Sign Out redirects to `/`
- [ ] My Properties list shows in sidebar bottom with colored house icons
- [ ] Clicking a property in the list navigates to `/owner/properties/:id`
- [ ] Mobile: bottom nav shows Schedule, Bookings, Properties, More
- [ ] Mobile: "More" button opens the overlay drawer
- [ ] Calendar page booking creation still works
- [ ] Calendar page FAB still shows on mobile (3 actions)

- [ ] **Step 6.7: Final commit**

```bash
git add src/layouts/owner.vue \
        src/components/smart/owner/OwnerNavigationDrawer.vue \
        src/components/smart/owner/OwnerBottomNav.vue \
        src/components/smart/owner/HomeOwner.vue \
        src/components/smart/owner/OwnerSettings.vue \
        src/pages/owner/settings.vue \
        src/router/index.ts
git commit -m "feat: complete owner layout & navigation restructure (sub-project #1)

- Persistent app bar + sidebar on all owner pages
- OwnerNavigationDrawer with dynamic active state
- Property list (Google Calendar style) in sidebar bottom
- Mobile bottom nav + overlay drawer
- Settings stub route prevents broken link
- /owner/calendar redirects to /owner/dashboard
- Deleted OwnerSidebar.vue and duplicate OwnerCalendarPage.vue"
```

---

## Quick Reference: Key Paths

| What | Where |
|------|-------|
| Layout shell | `src/layouts/owner.vue` |
| Navigation drawer | `src/components/smart/owner/OwnerNavigationDrawer.vue` |
| Calendar page | `src/components/smart/owner/HomeOwner.vue` |
| Mobile bottom nav | `src/components/smart/owner/OwnerBottomNav.vue` |
| Settings stub | `src/components/smart/owner/OwnerSettings.vue` |
| Router | `src/router/index.ts` |
| Tests | `src/__tests__/components/owner/OwnerNavigationDrawer.spec.ts` |
| Run tests | `pnpm test:run` |
| Run build | `pnpm build` |
