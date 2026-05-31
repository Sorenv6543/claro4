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

- [ ] **[P1] Wrong primary CTA** — layout FAB reads "Add booking" on Properties page; no working "Add property" affordance. (`src/layouts/owner.vue:210-218`) *(FAB is route-aware systemic item already checked — still needs per-page audit)*
- [ ] **[P1] `handleAssignCleaner` is a dead stub** — emits an info toast telling user to contact admin; child never fires the emit anyway. (`OwnerProperties.vue:321-323`)
- [ ] **[P1] No delete path from the UI** — `handleDeleteProperty` exists but no card/row exposes a delete button. (`OwnerProperties.vue:343`)
- [ ] **[P1] "Active" segment appears pre-selected visually** but `selectedSegment` defaults to `'all'`. Visual vs. state mismatch. (`OwnerProperties.vue:139`)

## 📋 Owner Overview — `/owner/overview`

- [x] **[P1] Template structure bug** — `.tl-rows-wrap` moved inside `.tl-timeline-wrap`; added missing closing tag.
- [ ] **[P1] "Add booking" FAB is wrong primary action** for a read-only summary screen.
- [x] **[P1] Urgent banner "View details" opens an empty modal** — now navigates to `/owner/bookings?id=<id>`; `urgentTurns` preserves booking `id`.
- [ ] **[P1] `handleDayBarAssignCleaner` is the same dead stub** as Properties. (`OwnerOverview.vue:792-794`)
- [ ] **[P1] Time format inconsistency** — same booking shows as `15:00:00` in Your Properties section and `3:00 PM` in Upcoming. Fix at `OwnerOverview.vue:892-893` — use `fmt12()`.

## 📋 Owner Bookings — `/owner/bookings`

- [x] **[P1] `handleEditBooking` wraps booking incorrectly** as `{ booking }` — downstream BookingForm probably opens empty. Same bug exists on Overview at L843. Pick one shape and align. (`OwnerBookings.vue:207`)
- [ ] **[P1] Time format inconsistency** — expanded row shows `Mon, May 25, 2026 · 15:00:00` (24h with seconds). Fix in `OwnerBookingList`/`OwnerBookingInlay`. Use `fmt12()`.
- [x] **[P1] `unassignedCount` only checks `assigned_cleaner_id`** — now also checks `assigned_team_id`. (`OwnerBookings.vue:140-143`)
- [x] **[P1] `weekCheckinCount` excludes turns** — removed `booking_type !== 'turn'` filter. (`OwnerBookings.vue:136`)

## 📋 Owner Calendar — `/owner/calendar`

- [x] **[P1] FAB reads "Add property" instead of "Add booking"** — Calendar FAB now opens booking form. (`pages/owner/calendar/index.vue:63-72`)
- [ ] **[P1] "Switch to range view" / "Switch to event view" toggle does nothing visible** — changes URL `?viewMode=ranges` ↔ `?viewMode=events` but renders identically. Either implement range mode or gate the button behind a feature flag. (`src/layouts/owner.vue:73-95`)
- [ ] **[P1] No week / day / list view switcher exposed to users** — `OwnerCalendar.changeView()` exists at L303 but no UI calls it. Add a Month/Week/Day toggle.
- [ ] **[P1] Two `OwnerBookingForm` instances mounted simultaneously** (create + edit) — race condition on double-click. Consolidate into a single dialog with a `mode` prop. (`pages/owner/calendar/index.vue:17-38`)
- [x] **[P1] `createMyBooking` for turn passes `owner_id: ''`** — now passes `authStore.user?.id || ''`. (`pages/owner/calendar/index.vue:154-170`)
- [ ] **[P1] `handleBookingFormSubmit` turn-creation has broken error handling** — empty `catch {}` swallows errors, and null-return path doesn't fire the warning toast. Check for `!id` after the call too. (`pages/owner/calendar/index.vue:172-174`)

## 📋 Owner Property Detail — `/owner/properties/:id`

- [ ] **[P1] `onBeforeRouteLeave` dirty-check is failing** — both in-app back arrow AND browser back button discard dirtied form with no confirmation. Likely cause: section components don't `defineExpose` `editing`/`isDirty` refs. Either fix the expose, or centralize dirty tracking in the parent. (`OwnerPropertyView.vue:453-460`)
- [ ] **[P1] Browser back / tab close not protected at all** — `onBeforeRouteLeave` only catches router navigations. Add a `window.addEventListener('beforeunload')` for tab close + browser back.
- [ ] **[P1] Page doesn't scroll** — Access, Contact, Upcoming, Recent sections render in DOM but are unreachable. Add `overflow-y: auto; max-height: calc(100vh - var(--app-bar-height));` to `.property-view-page` OR remove fixed-height from the parent layout slot for this route. (`OwnerPropertyView.vue:511-513`)
- [ ] **[P1] Silent redirect when `:id` doesn't match a property** — `property.value` checked at L416, then `router.push('/owner/properties')` with no toast. Add `uiStore.addNotification('error', 'Not found', ...)` before pushing.
- [ ] **[P1] Delete doesn't check active bookings** — list screen guards against deleting properties with active bookings; detail view doesn't. Add the same `bookingCountByProperty` guard here. (`OwnerPropertyView.vue:468-476`)

## 📋 Owner Reports — `/owner/reports`

- [ ] **[P1] Nav drawer points to a dead-end placeholder** — clicking "Reports" feels broken every time. Either hide the nav item behind a feature flag, or move it to a "Coming soon" sub-section so users know it's intentional.

## 📋 Owner Profile — `/owner/profile`

- [x] **[P1] Two profile entry points** — `/owner/profile` now redirects to `/owner/settings`.
- [ ] **[P1] `OwnerDetailCard.vue` name collides** with `src/components/dumb/admin/OwnerDetailCard.vue` — two completely different purposes, same `defineOptions({ name })`. Rename the owner-folder one to `OwnerProfilePlaceholder.vue` or delete it.

## 📋 Owner Settings — `/owner/settings`

- [x] **[P1] "Deactivate Account" button shows a scary "irreversible" warning then does nothing** — now closes dialog and shows informative toast directing user to support. (`OwnerSettings.vue:477-480`)
- [x] **[P1] `form.theme` defaults to `''` (empty string)** — now initializes as `'system'`. (`OwnerSettings.vue:383`)
- [ ] **[P1] Saving theme doesn't update Vuetify reactively** — user picks "Dark" → success toast → nothing visually changes. Verify `authStore.updateUserProfile` reaches Vuetify's `useTheme()`. (`OwnerSettings.vue:403-427`)
- [ ] **[P1] Password fields are interactable in DOM but `savePassword()` is empty** — typing + Enter swallows silently with no feedback. Either truly disable, or add a "Password change is not yet available" toast on submit. (`OwnerSettings.vue:435-442`)
- [ ] **[P1] Avatar "Upload New Photo" / "Reset" buttons have no `@click` handlers** — pure dead UI. Wire to Supabase storage or remove until ready. (`OwnerSettings.vue:42-48`)

---

## 🔁 Systemic patterns (these fixes touch multiple screens)

- [x] **"Add booking" FAB hardcoded in owner layout** affects Properties, Overview, Calendar, Property Detail, Settings (5+ screens). Replace the hard-coded button at `src/layouts/owner.vue:210-218` with route-aware actions via `QuickActionsFab` in `src/components/dumb/shared/`.
- [ ] **"Toggle devtools panel" widget leaking into production** on every screen. Locate the source (likely `vite-plugin-vue-devtools` or similar in `vite.config.*` / `src/main.ts`) and gate to `import.meta.env.DEV`.
- [ ] **Strip test/seed data from the demo account** — "Test Adress 3" (typo), "Lorum Ipsum" (typo), "1600 Pennsylvania Ave NW" appear on every screen. Either clean the DB seed or restrict the demo account.
- [ ] **Time format inconsistency** — same booking shown as `15:00:00` and `3:00 PM` on different screens. Standardize on `fmt12()` from `@utils/timelineMath`.
- [ ] **Magic-string statuses scattered everywhere** — `'cancelled'`, `'turn'`, `'completed'`, `'scheduled'`, `'in_progress'`, `'pending'` inline in every owner component. Define a `BookingStatus` / `BookingType` enum and import.
- [ ] **`console.log/warn/error` statements left in production paths** — flagged on every screen. Wrap in a logger that no-ops in production.
- [x] **No `<title>` updates per route** — added `title` meta to all routes; `afterNavigationGuard` sets `document.title` as `"<title> — Claro"`.
- [ ] **Coming-soon stubs without feature flags** — Reports, Profile, Photos section, Email Notifications, Avatar upload, Change Password, Deactivate Account, Recent Sessions all advertise unbuilt functionality. Either hide via flags or build a reusable `<ComingSoonState>` component and reduce the surface area.
