# Owner Layout & Navigation — Sub-project #1 Design Spec

**Date:** 2026-03-11
**Status:** Approved
**Branch:** `feature/owner-layout-navigation`

---

## Problem

The owner navigation shell (app bar + sidebar) lives entirely inside `HomeOwner.vue`, which is only mounted on `/owner/dashboard`. Navigating to any other owner page (`/owner/bookings`, `/owner/properties`, `/owner/profile`, etc.) causes the navigation to disappear — the user is stranded with no way to navigate except the browser back button.

Additional issues:
- `/owner/recent` in the sidebar links to a route that does not exist (navigation failure)
- The "Calendar" nav item is hardcoded as active regardless of which page the user is on
- On desktop, `sidebarOpen` initialises to `false`, causing the sidebar to overlap content until the user manually clicks the hamburger
- `/owner/calendar` is a duplicate of the dashboard calendar (same FullCalendar, no sidebar) — confusing and redundant
- Sidebar link names do not match page content ("Upcoming" → shows all bookings, not just upcoming)

---

## Solution

Move the layout shell out of `HomeOwner.vue` and into `src/layouts/owner.vue` so that every owner page receives persistent navigation automatically. `HomeOwner.vue` becomes a pure calendar component with no layout responsibilities.

---

## Architecture

### Layout Mechanism (unchanged)

`App.vue` reads `route.meta.layout` and renders `<component :is="layout">`. All owner routes already carry `meta: { layout: 'owner' }`. No router changes needed.

### `src/layouts/owner.vue` — becomes the real shell

**Before:** A pass-through `<v-app>` wrapper that renders `<router-view />` and delegates all chrome to `HomeOwner.vue`.

**After:** A full layout shell containing:
- `<v-app>` root
- `<v-app-bar>` (height 56px, sticky, white) with:
  - Hamburger toggle (`mdi-menu`) bound to `sidebarOpen`
  - Claro brand mark + wordmark
  - Spacer
  - Notification bell icon (stub for now)
  - User avatar (initials, opens dropdown with Profile / Sign Out)
- `<OwnerNavigationDrawer v-model="sidebarOpen">` — the sidebar component
- `<v-main>` containing `<router-view />`

`sidebarOpen` initialises to `true` on `mdAndUp` (desktop), `false` on mobile. Uses `useDisplay()` from Vuetify.

### `src/components/smart/owner/OwnerNavigationDrawer.vue` — new component

Replaces `OwnerSidebar.vue`. A `<v-navigation-drawer>` (width 264px) with:

**Navigation section:**

| Label | Icon | Route | Notes |
|---|---|---|---|
| Schedule | `mdi-calendar-month-outline` | `/owner/dashboard` | |
| Check-ins & Turns | `mdi-clipboard-check-outline` | `/owner/checkins` (future) | "Soon" badge until Sub-project #2 is built; link disabled |
| Bookings | `mdi-format-list-bulleted` | `/owner/bookings` | |
| Properties | `mdi-home-outline` | `/owner/properties` | |

**Account section:**

| Label | Icon | Route |
|---|---|---|
| Settings | `mdi-cog-outline` | `/owner/settings` |

**Bottom section (fixed to drawer bottom):**
- User avatar + name + email
- "My Properties" sub-list — one row per property owned by the current user
  - Muted house icon (`mdi-home`, 55% opacity) in that property's assigned color
  - Property name truncated to one line
  - Aligned to the same horizontal grid as the nav icons above
  - Clicking a property navigates to `/owner/properties/:id`

**Active state:** Computed from `useRoute().path` — compares each item's route to the current path. No hardcoded active classes.

**Drawer behaviour:**
- Desktop (`mdAndUp`): `permanent` mode — always visible, no overlay
- Mobile (`smAndDown`): `temporary` mode — overlay drawer, closes on item tap

### `src/components/smart/owner/HomeOwner.vue` — stripped to calendar only

Remove: `<v-app-bar>`, `<OwnerSidebar>`, all `sidebarOpen` logic, `margin-left` calculations, mobile speed-dial FAB, brand overlay.

Keep: `<OwnerCalendar>`, booking modal orchestration, property modal orchestration, all emit handlers.

The component becomes a focused calendar page that receives no layout props — it simply fills the `<v-main>` content area.

### Property color assignment

The existing codebase cycles property card colors by array index: blue → green → purple → orange. The drawer's "My Properties" list follows the same scheme so colors are consistent across the UI.

Colors:
- Index 0: `#5c6bc0` (indigo/primary)
- Index 1: `#43a047` (green)
- Index 2: `#8e24aa` (purple)
- Index 3: `#f57c00` (orange)
- Cycles back for index 4+

### Mobile bottom navigation

On mobile (`smAndDown`), a `<v-bottom-navigation>` renders below the content area with 4 items:

| Label | Icon | Route |
|---|---|---|
| Schedule | `mdi-calendar-month-outline` | `/owner/dashboard` |
| Bookings | `mdi-format-list-bulleted` | `/owner/bookings` |
| Properties | `mdi-home-outline` | `/owner/properties` |
| More | `mdi-menu` | opens the overlay drawer |

Active item determined by `useRoute().path`. The full sidebar drawer is still accessible via "More" or the hamburger in the app bar.

---

## Navigation Rename Map

| Old label | New label | Route | Reason |
|---|---|---|---|
| Home | Schedule | `/owner/dashboard` | The page IS a calendar/schedule, not a generic "home" |
| Calendar | *(removed)* | `/owner/calendar` | Duplicate of Schedule; page to be removed or redirected |
| Upcoming | Bookings | `/owner/bookings` | Shows ALL bookings with filters, not just upcoming |
| Properties | Properties | `/owner/properties` | Correct — no change |
| Recent | Check-ins & Turns | `/owner/checkins` (future) | Replaces dead link; becomes Sub-project #2 |
| Settings (Quick Actions) | Settings | `/owner/settings` | Moved to Account section; route exists |
| Profile (Quick Actions) | *(removed from sidebar nav)* | `/owner/profile` | Profile accessible from user avatar dropdown only |

---

## Files Changed

### New files
- `src/components/smart/owner/OwnerNavigationDrawer.vue`
- `src/components/smart/owner/OwnerSettings.vue` — placeholder stub
- `src/pages/owner/settings.vue` — thin page wrapper

### Modified files
- `src/layouts/owner.vue` — becomes full layout shell
- `src/components/smart/owner/HomeOwner.vue` — stripped of layout chrome

### Deleted files
- `src/components/smart/owner/OwnerSidebar.vue` — replaced by `OwnerNavigationDrawer`
- `src/pages/owner/calendar.vue` — duplicate page, redirect to `/owner/dashboard`
- `src/components/smart/owner/OwnerCalendarPage.vue` — component for the duplicate page

### Router changes — one stub route added

All owner routes already use `meta: { layout: 'owner' }`. The layout component handles all navigation chrome.

One addition: `/owner/settings` has no route or page file today. To satisfy Success Criterion 4 (no broken links), a minimal stub route + page is added as part of this sub-project:

- `src/pages/owner/settings.vue` — thin wrapper (7 lines), mounts `OwnerSettings`
- `src/components/smart/owner/OwnerSettings.vue` — placeholder card: "Settings coming soon"
- Router entry: `{ path: '/owner/settings', name: 'owner-settings', component: ..., meta: { requiresAuth: true, role: 'owner', layout: 'owner' } }`

The Settings content is out of scope — only the stub that prevents a silent navigation failure is in scope.

---

## Out of Scope

- Sub-project #2: Check-ins & Turns list view (the "Soon" placeholder is added but not built)
- Sub-project #3: Owner page data density improvements
- Admin layout (separate component tree, untouched)
- Settings page content (route exists; content is not a dead link — implementation is a separate task)

---

## Success Criteria

- [ ] App bar (hamburger + Claro brand + avatar) is visible on every owner page
- [ ] Sidebar can be opened/closed from every owner page via the hamburger
- [ ] Active nav item highlights correctly based on the current route
- [ ] No broken navigation links (no silent navigation failures)
- [ ] Desktop: sidebar defaults to open, content area shifts correctly
- [ ] Mobile: overlay drawer + bottom nav both functional
- [ ] `pnpm test:run` passes
- [ ] `pnpm build` passes (no TypeScript errors)
