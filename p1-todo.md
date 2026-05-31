# Claro Owner Audit — P1 Todo List

**Date:** 2026-05-28  
**Repo:** claro4 @ `7867cdd` on `main`  
**Scope:** Owner area only

**Total P1 items:** 39 across 9 screens, plus systemic patterns at the end.

> Each item is a Markdown checkbox so you can tick them off in VS Code or paste blocks into Linear / GitHub / Notion.

---

## 🌐 Router / global

- [x] **[P1] `/owner/dashboard` is commented out** in `src/router/index.ts:46-55` — deleted orphaned route block, `pages/owner/dashboard.vue`, and `HomeOwner.vue`.
- [x] **[P1] No catch-all 404 route in the router** — added `{ path: '/:pathMatch(.*)*', name: 'not-found', ... }` with `layout: 'bare'`.
- [x] **[P1] Stale post-login redirect in `src/router/enhanced-route-guards.ts.bak:49`** — deleted the `.bak` file.
- [x] **[P1] Silent blank-page failure UX on broken route** — improved `404.vue` with Vuetify layout, role-aware "Go to dashboard" CTA.
- [x] **[P1] Orphaned `HomeOwner.vue` (752 lines) is dead code** — deleted.

## 📋 Owner Properties — `/owner/properties`

- [x] **[P1] Wrong primary CTA** — layout FAB is now route-aware: shows "Add property" on `/owner/properties`, hidden on `/owner/overview`, "Add booking" elsewhere.
- [ ] **[P1] `handleAssignCleaner` is a dead stub** — emits an info toast telling user to contact admin; child never fires the emit anyway. (`OwnerProperties.vue:321-323`)
- [x] **[P1] No delete path from the UI** — added delete icon button to both card and list-item in `OwnerMapAnchoredList`; wired `@delete="handleDeleteProperty"` in `OwnerProperties`.
- [ ] **[P1] "Active" segment appears pre-selected visually** but `selectedSegment` defaults to `'all'`. Visual vs. state mismatch. (`OwnerProperties.vue:139`)

## 📋 Owner Overview — `/owner/overview`

- [x] **[P1] Template structure bug** — `.tl-rows-wrap` moved inside `.tl-timeline-wrap`; added missing closing tag.
- [x] **[P1] "Add booking" FAB is wrong primary action** for read-only overview — FAB now hidden on `/owner/overview`.
- [x] **[P1] Urgent banner "View details" opens an empty modal** — now navigates to `/owner/bookings?id=<id>`; `urgentTurns` preserves booking `id`.
- [ ] **[P1] `handleDayBarAssignCleaner` is the same dead stub** as Properties. (`OwnerOverview.vue:792-794`)
- [ ] **[P1] Time format inconsistency** — same booking shows as `15:00:00` in Your Properties section and `3:00 PM` in Upcoming. Fix at `OwnerOverview.vue:892-893` — use `fmt12()`.

## 📋 Owner Bookings — `/owner/bookings`

- [x] **[P1] `handleEditBooking` wraps booking incorrectly** as `{ booking }` — downstream BookingForm probably opens empty. Same bug exists on Overview at L843. Pick one shape and align. (`OwnerBookings.vue:207`)
- [x] **[P1] Time format inconsistency** — `OwnerBookingInlay` now calls `fmt12()` for checkin/checkout times.
- [x] **[P1] `unassignedCount` only checks `assigned_cleaner_id`** — now also checks `assigned_team_id`. (`OwnerBookings.vue:140-143`)
- [x] **[P1] `weekCheckinCount` excludes turns** — removed `booking_type !== 'turn'` filter. (`OwnerBookings.vue:136`)

## 📋 Owner Calendar — `/owner/calendar`

- [x] **[P1] FAB reads "Add property" instead of "Add booking"** — Calendar FAB now opens booking form. (`pages/owner/calendar/index.vue:63-72`)
- [ ] **[P1] "Switch to range view" / "Switch to event view" toggle does nothing visible** — deferred (needs FullCalendar range-mode implementation).
- [x] **[P1] No week / day / list view switcher** — added `v-btn-toggle` (Month/Week/Day/List) to calendar page; bound to `currentView` prop which OwnerCalendar already watches.
- [ ] **[P1] Two `OwnerBookingForm` instances mounted simultaneously** (create + edit) — race condition on double-click. Consolidate into a single dialog with a `mode` prop. (`pages/owner/calendar/index.vue:17-38`)
- [x] **[P1] `createMyBooking` for turn passes `owner_id: ''`** — now passes `authStore.user?.id || ''`. (`pages/owner/calendar/index.vue:154-170`)
- [ ] **[P1] `handleBookingFormSubmit` turn-creation has broken error handling** — empty `catch {}` swallows errors, and null-return path doesn't fire the warning toast. Check for `!id` after the call too. (`pages/owner/calendar/index.vue:172-174`)

## 📋 Owner Property Detail — `/owner/properties/:id`

- [x] **[P1] `onBeforeRouteLeave` dirty-check** — section components confirmed to expose `editing`/`isDirty`; guard was already correct.
- [x] **[P1] Browser back / tab close not protected** — added `window.addEventListener('beforeunload', handleBeforeUnload)` with `onUnmounted` cleanup.
- [x] **[P1] Page doesn't scroll** — added `overflow-y: auto; max-height: calc(100vh - var(--app-bar-height, 64px))` to `.property-view-page`.
- [x] **[P1] Silent redirect when `:id` doesn't match** — now calls `uiStore.addNotification('error', 'Not Found', ...)` before pushing.
- [x] **[P1] Delete doesn't check active bookings** — `confirmDelete` now checks `activeBookingCount` and shows an inline error instead of deleting.

## 📋 Owner Reports — `/owner/reports`

- [x] **[P1] Nav drawer points to a dead-end placeholder** — `Reports.vue` already has a proper "Reporting coming soon" state with a CTA to Bookings.

## 📋 Owner Profile — `/owner/profile`

- [x] **[P1] Two profile entry points** — `/owner/profile` now redirects to `/owner/settings`.
- [x] **[P1] `OwnerDetailCard.vue` name collides** — renamed `defineOptions` name to `'OwnerProfilePlaceholder'`.

## 📋 Owner Settings — `/owner/settings`

- [x] **[P1] "Deactivate Account" button shows a scary "irreversible" warning then does nothing** — now closes dialog and shows informative toast directing user to support. (`OwnerSettings.vue:477-480`)
- [x] **[P1] `form.theme` defaults to `''` (empty string)** — now initializes as `'system'`. (`OwnerSettings.vue:383`)
- [x] **[P1] Saving theme doesn't update Vuetify reactively** — added `applyTheme()` using `useTheme()` called on save; added dark theme definition to `vuetify.ts`; 'system' resolves via `matchMedia`.
- [ ] **[P1] Password fields are interactable in DOM but `savePassword()` is empty** — typing + Enter swallows silently with no feedback. Either truly disable, or add a "Password change is not yet available" toast on submit. (`OwnerSettings.vue:435-442`)
- [x] **[P1] Avatar "Upload New Photo" / "Reset" buttons have no `@click` handlers** — now show "not yet available" info toast on click.

---

## 🔁 Systemic patterns (these fixes touch multiple screens)

- [x] **"Add booking" FAB hardcoded in owner layout** affects Properties, Overview, Calendar, Property Detail, Settings (5+ screens). Replace the hard-coded button at `src/layouts/owner.vue:210-218` with route-aware actions via `QuickActionsFab` in `src/components/dumb/shared/`.
- [x] **"Toggle devtools panel" widget leaking into production** — `vite-plugin-vue-devtools` is already gated to `isDevelopment` in `vite.config.ts` (lines 83-97). No change needed.
- [ ] **Strip test/seed data from the demo account** — "Test Adress 3" (typo), "Lorum Ipsum" (typo), "1600 Pennsylvania Ave NW" appear on every screen. Either clean the DB seed or restrict the demo account.
- [ ] **Time format inconsistency** — same booking shown as `15:00:00` and `3:00 PM` on different screens. Standardize on `fmt12()` from `@utils/timelineMath`.
- [ ] **Magic-string statuses scattered everywhere** — `'cancelled'`, `'turn'`, `'completed'`, `'scheduled'`, `'in_progress'`, `'pending'` inline in every owner component. Define a `BookingStatus` / `BookingType` enum and import.
- [ ] **`console.log/warn/error` statements left in production paths** — flagged on every screen. Wrap in a logger that no-ops in production.
- [x] **No `<title>` updates per route** — added `title` meta to all routes; `afterNavigationGuard` sets `document.title` as `"<title> — Claro"`.
- [ ] **Coming-soon stubs without feature flags** — Reports, Profile, Photos section, Email Notifications, Avatar upload, Change Password, Deactivate Account, Recent Sessions all advertise unbuilt functionality. Either hide via flags or build a reusable `<ComingSoonState>` component and reduce the surface area.
