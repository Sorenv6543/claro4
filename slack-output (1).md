*🌐 Router / global*
_Owner area · P1 todo blocks_

*🐞 P1*
• [P1] `/owner/dashboard` is commented out — direct nav renders blank gray page; re-enable or delete `pages/owner/dashboard.vue` + `HomeOwner.vue` orphans (`src/router/index.ts:46-55`)
• [P1] No catch-all 404 route — `pages/404.vue` exists but isn't registered; `developmentGuard` redirects to `/404` which is itself unregistered (`src/router/guards.ts:75`)
• [P1] Stale post-login redirect targets `/owner/dashboard` — delete the `.bak` or update to `/owner/overview` (`src/router/enhanced-route-guards.ts.bak:49`)
• [P1] Silent blank-page failure UX on broken route — no error state, no breadcrumb back; add a real 404 page with "Go to dashboard" CTA
• [P1] Orphaned `HomeOwner.vue` (752 lines) is dead code — no route mounts it; two competing "owner home" components (`HomeOwner.vue` + `OwnerOverview.vue`) makes decisions ambiguous

---

*📋 Owner Properties* — `/owner/properties`

*🐞 P1*
• [P1] Wrong primary CTA — layout FAB reads "Add booking" on Properties; no working "Add property" affordance (`src/layouts/owner.vue:210-218`)
• [P1] `handleAssignCleaner` is a dead stub — emits info toast telling user to contact admin; child never fires the emit anyway (`OwnerProperties.vue:321-323`)
• [P1] No delete path from the UI — `handleDeleteProperty` exists but no card/row exposes a delete button (`OwnerProperties.vue:343`)
• [P1] "Active" segment appears pre-selected visually but `selectedSegment` defaults to `'all'` — visual vs. state mismatch (`OwnerProperties.vue:139`)

---

*📋 Owner Overview* — `/owner/overview`

*🐞 P1*
• [P1] Template structure bug — `.tl-rows-wrap` rendered OUTSIDE `.tl-timeline-wrap`; move closing `</div>` from L150 to after L199 (`OwnerOverview.vue:139-200`)
• [P1] "Add booking" FAB is wrong primary action for a read-only summary screen
• [P1] Urgent banner "View details" opens an empty modal — `uiStore.openModal('eventModal', 'view')` with no booking id and unsupported mode (`OwnerOverview.vue:93`)
• [P1] `handleDayBarAssignCleaner` is the same dead stub as Properties (`OwnerOverview.vue:792-794`)
• [P1] Time format inconsistency — same booking shows `15:00:00` in Your Properties and `3:00 PM` in Upcoming; use `fmt12()` (`OwnerOverview.vue:892-893`)

---

*📋 Owner Bookings* — `/owner/bookings`

*🐞 P1*
• [P1] `handleEditBooking` wraps booking incorrectly as `{ booking }` — downstream BookingForm probably opens empty; same bug on Overview L843 (`OwnerBookings.vue:207`)
• [P1] Time format inconsistency — expanded row shows `Mon, May 25, 2026 · 15:00:00`; use `fmt12()` in `OwnerBookingList`/`OwnerBookingInlay`
• [P1] `unassignedCount` only checks `assigned_cleaner_id` — bookings with `assigned_team_id` show as unassigned forever; also fixes wrong urgent flag in Overview (`OwnerBookings.vue:140-143`)
• [P1] `weekCheckinCount` excludes turns via `b.booking_type !== 'turn'` but label says "THIS WEEK" — turns ARE check-ins; drop the filter or rename to "GUEST CHECK-INS" (`OwnerBookings.vue:136`)

---

*📋 Owner Calendar* — `/owner/calendar`

*🐞 P1*
• [P1] FAB reads "Add property" instead of "Add booking" — Calendar is where users primarily add bookings (`pages/owner/calendar/index.vue:63-72`)
• [P1] "Switch to range view" / "Switch to event view" toggle does nothing visible — changes `?viewMode=ranges` ↔ `?viewMode=events` but renders identically (`src/layouts/owner.vue:73-95`)
• [P1] No week / day / list view switcher exposed — `OwnerCalendar.changeView()` exists at L303 but no UI calls it; add Month/Week/Day toggle
• [P1] Two `OwnerBookingForm` instances mounted simultaneously (create + edit) — race condition on double-click; consolidate into one dialog with a `mode` prop (`pages/owner/calendar/index.vue:17-38`)
• [P1] `createMyBooking` for turn passes `owner_id: ''` — rows fail RLS or bypass constraint; pass `currentOwnerId` (`pages/owner/calendar/index.vue:154-170`)
• [P1] `handleBookingFormSubmit` turn-creation has broken error handling — empty `catch {}` swallows errors; check for `!id` after the call too (`pages/owner/calendar/index.vue:172-174`)

---

*📋 Owner Property Detail* — `/owner/properties/:id`

*🐞 P1*
• [P1] `onBeforeRouteLeave` dirty-check is failing — both in-app back arrow AND browser back discard dirty form with no confirmation; section components likely don't `defineExpose` `editing`/`isDirty` (`OwnerPropertyView.vue:453-460`)
• [P1] Browser back / tab close not protected — `onBeforeRouteLeave` only catches router nav; add `window.addEventListener('beforeunload')`
• [P1] Page doesn't scroll — Access, Contact, Upcoming, Recent sections render in DOM but are unreachable; add `overflow-y: auto; max-height: calc(100vh - var(--app-bar-height));` (`OwnerPropertyView.vue:511-513`)
• [P1] Silent redirect when `:id` doesn't match a property — `router.push('/owner/properties')` with no toast; add `uiStore.addNotification('error', 'Not found', ...)` (`OwnerPropertyView.vue:416`)
• [P1] Delete doesn't check active bookings — list screen guards against it; detail view doesn't; add the same `bookingCountByProperty` guard (`OwnerPropertyView.vue:468-476`)

---

*📋 Owner Reports* — `/owner/reports`

*🐞 P1*
• [P1] Nav drawer points to a dead-end placeholder — clicking "Reports" feels broken every time; hide behind a feature flag or move to "Coming soon" sub-section

---

*📋 Owner Profile* — `/owner/profile`

*🐞 P1*
• [P1] Two profile entry points — `/owner/profile` is an empty stub, actual profile lives at `/owner/settings` (Account tab); delete the route or redirect to `/owner/settings?tab=account`
• [P1] `OwnerDetailCard.vue` name collides with `src/components/dumb/admin/OwnerDetailCard.vue` — same `defineOptions({ name })`, completely different purposes; rename to `OwnerProfilePlaceholder.vue` or delete

---

*📋 Owner Settings* — `/owner/settings`

*🐞 P1*
• [P1] "Deactivate Account" shows scary "irreversible" warning then does nothing — `handleDeactivate()` is a TODO stub; implement or disable + show "coming soon" empty state (`OwnerSettings.vue:477-480`)
• [P1] `form.theme` defaults to `''` but typed as `'light' | 'dark' | 'system'` — invalid until populated; initialize with `'system'` (`OwnerSettings.vue:383`)
• [P1] Saving theme doesn't update Vuetify reactively — user picks "Dark" → success toast → nothing changes; verify `authStore.updateUserProfile` reaches Vuetify's `useTheme()` (`OwnerSettings.vue:403-427`)
• [P1] Password fields are interactable but `savePassword()` is empty — typing + Enter swallows silently; truly disable or add a "not yet available" toast (`OwnerSettings.vue:435-442`)
• [P1] Avatar "Upload New Photo" / "Reset" buttons have no `@click` handlers — pure dead UI; wire to Supabase storage or remove (`OwnerSettings.vue:42-48`)

---

*🔁 Systemic patterns* — _touch multiple screens_

*🐞 P1*
• [P1] "Add booking" FAB hardcoded in owner layout — affects Properties, Overview, Calendar, Property Detail, Settings (5+ screens); replace with route-aware `QuickActionsFab` (`src/layouts/owner.vue:210-218`)

• [P1] Strip test/seed data from demo account — "Test Adress 3" (typo), "Lorum Ipsum" (typo), "1600 Pennsylvania Ave NW" on every screen; clean DB seed or restrict demo account
• [P1] Time format inconsistency — same booking shown as `15:00:00` and `3:00 PM` across screens; standardize on `fmt12()` from `@utils/timelineMath`
• [P1] Magic-string statuses scattered — `'cancelled'`, `'turn'`, `'completed'`, `'scheduled'`, `'in_progress'`, `'pending'` inline in every owner component; define `BookingStatus` / `BookingType` enums
• [P1] `console.log/warn/error` left in production paths — flagged on every screen; wrap in a logger that no-ops in production
• [P1] No `<title>` updates per route — tab always reads "Property Cleaning Scheduler"; add route-meta `title` + `useTitle` composable
• [P1] Coming-soon stubs without feature flags — Reports, Profile, Photos, Email Notifications, Avatar upload, Change Password, Deactivate Account, Recent Sessions; hide via flags or build reusable `<ComingSoonState>`

---

*🧾 Claro P1 Rollup — 2026-05-28*
_Commit: `7867cdd` · Branch: `main` · Owner area only_

*Totals*
• Screens covered: 9 + systemic
• P1 (bugs/blockers): 39 + 8 systemic = *47 total*

*🔥 Top priorities this pass*
1. [P1] Re-enable or delete `/owner/dashboard` + register 404 catch-all — Router / global (silent blank pages = worst UX)
2. [P1] Replace hardcoded "Add booking" FAB with route-aware `QuickActionsFab` — Systemic (wrong CTA on 5+ screens)
3. [P1] Fix `onBeforeRouteLeave` dirty-check + add `beforeunload` — Owner Property Detail (silent data loss)
4. [P1] Property Detail page doesn't scroll — Owner Property Detail (entire sections unreachable)
5. [P1] Standardize time format on `fmt12()` + define `BookingStatus`/`BookingType` enums — Systemic (consistency + future bugs)

*Screens covered (P1 counts)*
• Router / global — 5
• Owner Properties — 4
• Owner Overview — 5
• Owner Bookings — 4
• Owner Calendar — 6
• Owner Property Detail — 5
• Owner Reports — 1
• Owner Profile — 2
• Owner Settings — 5
• Systemic patterns — 8
