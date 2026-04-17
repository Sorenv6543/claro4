# Mobile Calendar Toolbar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the owner dashboard app bar's responsibilities on mobile — layout items stay in the bar, calendar navigation moves to a floating frosted-glass pill at the bottom, and the Range/Event view toggle relocates above the calendar grid (both breakpoints).

**Architecture:** Three files touched, one new dumb component. `src/layouts/owner.vue` conditionally hides calendar controls when `useDisplay().mobile` is true, and loses the view toggle entirely. `src/components/smart/owner/HomeOwner.vue` gains the relocated view toggle above the calendar and mounts a mobile-only `CalendarNavPill`. `src/components/dumb/owner/CalendarNavPill.vue` is a new pure presentational pill (props + emits only).

**Tech Stack:** Vue 3 + Vuetify 4, `useDisplay()` composable from Vuetify for breakpoint detection, existing `useOwnerCalendarState` for month/view state, CSS `position: fixed` + `backdrop-filter: blur` + `env(safe-area-inset-bottom)` for the pill.

**Spec:** `docs/superpowers/specs/2026-04-16-mobile-calendar-toolbar-design.md`

---

## File Structure

| File | Responsibility | Status |
|------|----------------|--------|
| `src/components/dumb/owner/CalendarNavPill.vue` | Presentational pill: two icon buttons + a label, no store/composable imports. Props: `label: string`. Emits: `prev`, `next`. | **New** |
| `src/layouts/owner.vue` | App bar: hide prev/next/month-label behind `!mobile` guard; remove view toggle entirely (moves to page). | **Modify** |
| `src/components/smart/owner/HomeOwner.vue` | Smart calendar host: render view toggle above calendar grid; mount `CalendarNavPill` when `mobile`; add calendar bottom padding on mobile. | **Modify** |

No new composables, stores, or tests — all state already lives in `useOwnerCalendarState`. Visual verification is via Chrome DevTools at three breakpoints.

---

## Task 1: Scaffold CalendarNavPill dumb component

**Files:**
- Create: `src/components/dumb/owner/CalendarNavPill.vue`

- [ ] **Step 1: Create the file with full implementation**

```vue
<template>
  <div class="calendar-nav-pill" role="toolbar" aria-label="Calendar navigation">
    <v-btn
      aria-label="Previous period"
      class="calendar-nav-pill__btn"
      density="comfortable"
      icon="mdi-chevron-left"
      size="small"
      variant="text"
      @click="emit('prev')"
    />
    <span class="calendar-nav-pill__label">{{ label }}</span>
    <v-btn
      aria-label="Next period"
      class="calendar-nav-pill__btn"
      density="comfortable"
      icon="mdi-chevron-right"
      size="small"
      variant="text"
      @click="emit('next')"
    />
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'CalendarNavPill' })

  defineProps<{
    label: string
  }>()

  const emit = defineEmits<{
    prev: []
    next: []
  }>()
</script>

<style scoped>
.calendar-nav-pill {
  position: fixed;
  left: 50%;
  bottom: calc(var(--claro-space-md) + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 4;

  display: inline-flex;
  align-items: center;
  gap: var(--claro-space-sm);
  padding: 4px var(--claro-space-sm);
  border-radius: 9999px;

  background: rgba(var(--v-theme-background), 0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--claro-shadow-md);
}

.calendar-nav-pill__btn {
  box-shadow: none !important;
}

.calendar-nav-pill__label {
  font-size: 14px;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  min-width: 110px;
  text-align: center;
  user-select: none;
}
</style>
```

Notes for the engineer:
- **Dumb component** — no store/composable imports, only props and emits. The smart parent (`HomeOwner.vue`) wires it to `useOwnerCalendarState`.
- `--claro-space-*` and `--claro-shadow-md` tokens already exist in `src/styles/tokens.css`.
- `env(safe-area-inset-bottom)` handles iOS home-indicator overlap.
- `backdrop-filter: blur(12px)` matches the app bar's frosted treatment set in `src/layouts/owner.vue`.
- `z-index: 4` sits above page content but below Vuetify modal overlays (which use much higher z-indices).

- [ ] **Step 2: Confirm the file compiles**

Run: `pnpm build:fast`
Expected: Build succeeds with no new type errors. The component is not yet imported anywhere, so bundle size barely changes.

- [ ] **Step 3: Commit**

```bash
git add src/components/dumb/owner/CalendarNavPill.vue
git commit -m "feat(owner): add CalendarNavPill dumb component for mobile calendar nav"
```

---

## Task 2: Remove view toggle from owner app bar (both breakpoints)

**Files:**
- Modify: `src/layouts/owner.vue` — delete the `View mode toggle` block (currently lines ~60–73)

- [ ] **Step 1: Find the exact block**

Open `src/layouts/owner.vue` and locate this block (it appears after `<v-spacer />`):

```vue
      <!-- View mode toggle (Ranges / Events) -->
      <template v-if="isCalendarPage">
        <v-btn-toggle
          v-model="viewMode"
          class="mr-2"
          color="primary"
          density="compact"
          mandatory
          rounded="pill"
        >
          <v-btn class="text-none" size="small" value="ranges">Range</v-btn>
          <v-btn class="text-none" size="small" value="events">Event</v-btn>
        </v-btn-toggle>
      </template>
```

- [ ] **Step 2: Delete the block**

Delete the entire `<template v-if="isCalendarPage">…</template>` that contains the `v-btn-toggle`. Leave the `<v-spacer />` line and the subsequent right-side icon block (`<div class="appbar-icons">…`) intact. The view toggle will reappear above the calendar in Task 4.

- [ ] **Step 3: Check the `viewMode` local ref is no longer referenced in the template**

Run: `pnpm build:fast`
Expected: Build succeeds. The script still declares `const viewMode = calendarState.viewMode` — that's fine for now; Task 4 will drop or retain it depending on where the toggle lives.

**Do not remove `viewMode` from the script yet** — Task 4 may still need it if we pass it into `HomeOwner`, but the cleanest design keeps `viewMode` scoped to `HomeOwner`. We'll remove it at the end of Task 4.

- [ ] **Step 4: Visual verification in browser**

With `pnpm dev` running (user's existing dev server), navigate to `http://localhost:3000/owner/dashboard` on desktop viewport (1440 × 900). The Range/Event toggle should be gone from the app bar. Prev/next and month label remain.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/owner.vue
git commit -m "refactor(owner): remove view toggle from app bar (moving to page)"
```

---

## Task 3: Gate prev/next/month in app bar behind `!mobile`

**Files:**
- Modify: `src/layouts/owner.vue` — scope the calendar-header block to desktop only

- [ ] **Step 1: Confirm `useDisplay` already imports `mobile`**

Open `src/layouts/owner.vue`. At the script section around line 162:

```ts
  const { mdAndUp } = useDisplay()
```

Add `mobile` to the destructure:

```ts
  const { mdAndUp, mobile } = useDisplay()
```

- [ ] **Step 2: Add `!mobile` guard to the calendar-header template**

Locate this block (currently starts around line 29):

```vue
      <!-- Calendar controls — visible only on the schedule page -->
      <template v-if="isCalendarPage">
        <v-divider class="mx-3 my-0 d-none d-sm-flex" vertical />

        <v-btn
          aria-label="Previous period"
          ...
```

Change the `v-if` to:

```vue
      <!-- Calendar controls — only on schedule page, desktop only (mobile uses bottom pill) -->
      <template v-if="isCalendarPage && !mobile">
```

Leave the contents of the template (divider, prev/next buttons, month labels) untouched.

- [ ] **Step 3: Verify desktop still shows controls**

Navigate to `http://localhost:3000/owner/dashboard` at 1440 × 900 in Chrome. The prev/next chevrons and "April 2026" label should remain in the app bar.

- [ ] **Step 4: Verify mobile no longer shows them**

Resize Chrome to 390 × 844 (or use Chrome DevTools device mode). Reload. The prev/next chevrons and month label should be gone. The app bar should now mirror what non-calendar pages show: hamburger + Claro + theme/star/bell/avatar.

- [ ] **Step 5: Commit**

```bash
git add src/layouts/owner.vue
git commit -m "feat(owner): hide calendar controls in app bar on mobile"
```

---

## Task 4: Add view toggle above calendar in HomeOwner

**Files:**
- Modify: `src/components/smart/owner/HomeOwner.vue` — render `v-btn-toggle` above `<OwnerCalendar>`
- Modify: `src/layouts/owner.vue` — remove now-unused `viewMode` local const and the calendar-controls script remnants tied to it

- [ ] **Step 1: Add the toggle above OwnerCalendar**

Locate this block in `HomeOwner.vue` (around lines 23–42):

```vue
    <!-- Calendar -->
    <div v-else class="calendar-layout">
      <!-- Calendar Content -->
      <div class="calendar-content">
        <OwnerCalendar
          :bookings="ownerFilteredBookings"
          ...
        />
      </div>
    </div>
```

Change to:

```vue
    <!-- Calendar -->
    <div v-else class="calendar-layout">
      <!-- View mode toggle (Range / Event) — moved out of app bar -->
      <div class="calendar-view-toggle">
        <v-btn-toggle
          v-model="viewMode"
          color="primary"
          density="compact"
          mandatory
          rounded="pill"
        >
          <v-btn class="text-none" size="small" value="ranges">Range</v-btn>
          <v-btn class="text-none" size="small" value="events">Event</v-btn>
        </v-btn-toggle>
      </div>

      <!-- Calendar Content -->
      <div class="calendar-content">
        <OwnerCalendar
          :bookings="ownerFilteredBookings"
          ...
        />
      </div>
    </div>
```

Keep the existing `:bookings="ownerFilteredBookings"` through `@view-change="handleCalendarViewChange"` props and event bindings identical — only a wrapper `<div class="calendar-view-toggle">` is added before `<div class="calendar-content">`.

- [ ] **Step 2: Add the scoped style**

At the end of the `<style scoped>` block in `HomeOwner.vue`, add:

```css
.calendar-view-toggle {
  display: flex;
  justify-content: flex-end;
  padding: var(--claro-space-sm) var(--claro-space-md) 0;
}
```

If the file has no `<style scoped>` block, add one before `</template>`'s closing or after `</script>`:

```vue
<style scoped>
.calendar-view-toggle {
  display: flex;
  justify-content: flex-end;
  padding: var(--claro-space-sm) var(--claro-space-md) 0;
}
</style>
```

- [ ] **Step 3: Confirm `viewMode` is already in scope inside the `<script setup>`**

The composable call already exists around line 157 (`const { viewMode, ... } = useOwnerCalendarState()`) — no script change needed in `HomeOwner.vue`. If `viewMode` is NOT in the destructure there, add it:

```ts
  const {
    viewMode,
    currentDate,
    currentView,
    // ... other existing bindings
  } = useOwnerCalendarState()
```

- [ ] **Step 4: Clean up the now-unused `viewMode` ref in owner.vue**

Open `src/layouts/owner.vue`. Locate (around line 170):

```ts
  const viewMode = calendarState.viewMode
```

Delete this line. It was only used by the toggle that moved to `HomeOwner.vue`.

- [ ] **Step 5: Type-check**

Run: `pnpm build:fast`
Expected: Build succeeds with no type errors.

- [ ] **Step 6: Visual verification**

Navigate to `http://localhost:3000/owner/dashboard` at both 1440 × 900 and 390 × 844. The Range/Event toggle should appear at the top-right of the calendar content area in both sizes. Clicking it should change the calendar view as before. The toggle is gone from the app bar.

- [ ] **Step 7: Commit**

```bash
git add src/components/smart/owner/HomeOwner.vue src/layouts/owner.vue
git commit -m "feat(owner): relocate Range/Event toggle above calendar grid"
```

---

## Task 5: Mount CalendarNavPill on mobile + calendar bottom padding

**Files:**
- Modify: `src/components/smart/owner/HomeOwner.vue` — render the pill mobile-only; add `padding-bottom` to the calendar container on mobile

- [ ] **Step 1: Import the pill and `useDisplay`**

At the top of the `<script setup>` in `HomeOwner.vue`, add:

```ts
  import { useDisplay } from 'vuetify'
  import CalendarNavPill from '@/components/dumb/owner/CalendarNavPill.vue'
```

Add among the other imports — place `useDisplay` with other composable imports and `CalendarNavPill` with other component imports to match the file's convention.

- [ ] **Step 2: Add `prev`/`next` to the composable destructure and wire `mobile` + pill label**

The existing destructure at line ~151 of `HomeOwner.vue` is:

```ts
  const {
    currentView,
    currentDate,
    filterBookings,
    setCalendarView,
    viewMode,
  } = useOwnerCalendarState()
```

Expand it to pull in `prev` and `next` (aliased to avoid any collision with DOM or Vue built-ins):

```ts
  const {
    currentView,
    currentDate,
    filterBookings,
    setCalendarView,
    viewMode,
    prev: calendarPrev,
    next: calendarNext,
  } = useOwnerCalendarState()
```

`prev` and `next` are exposed via `...baseCalendarState` spread in `useOwnerCalendarState` (see `src/composables/owner/useOwnerCalendarState.ts` line 351). The same method is used in `src/layouts/owner.vue:39,47` via `calendarState.prev()`/`calendarState.next()` — so they're definitely on the returned object.

Then add the `mobile` flag and pill label below the destructure:

```ts
  const { mobile } = useDisplay()

  // Short label for the floating pill (e.g. "Apr 2026")
  const pillMonthLabel = computed(() =>
    currentDate.value.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
  )
```

`computed` and `ref` are already imported from `vue` (line 101). `useDisplay` was imported in step 1.

- [ ] **Step 3: Render the pill in the template**

In `HomeOwner.vue`, find the closing `</div>` of `class="calendar-layout"` (after the `<OwnerCalendar>` block). Just before the `<OwnerDayViewBottomSheet>` element, add:

```vue
      <!-- Floating calendar navigation pill — mobile only -->
      <CalendarNavPill
        v-if="mobile"
        :label="pillMonthLabel"
        @next="calendarNext()"
        @prev="calendarPrev()"
      />
```

`calendarPrev` and `calendarNext` are the aliased destructure targets added in step 2.

**Important:** Render the pill OUTSIDE the `v-if="initialLoading"` branch (after the top-level calendar-or-loader block closes) so it's not reliant on the loading spinner being hidden. Place it inside `<div class="home-owner-page">` but after `<div class="calendar-layout">`.

- [ ] **Step 4: Add calendar bottom padding on mobile**

Append to `HomeOwner.vue`'s `<style scoped>` block:

```css
.calendar-view-toggle {
  display: flex;
  justify-content: flex-end;
  padding: var(--claro-space-sm) var(--claro-space-md) 0;
}

/* Leave room below the calendar grid for the floating pill on mobile */
@media (max-width: 599px) {
  .calendar-content {
    padding-bottom: 88px;
  }
}
```

(If the first block was already added in Task 4 step 2, only add the `@media` block.)

88 px = pill height ≈ 48 + 16 top gap + 16 bottom gap + safe-area buffer. No hardcoded hex, no magic colors — just dimensions, and dimensions are explicitly called out in the spec.

- [ ] **Step 5: Type-check**

Run: `pnpm build:fast`
Expected: Build succeeds.

- [ ] **Step 6: Manual verification — mobile, calendar page**

Chrome DevTools at 390 × 844. Navigate to `http://localhost:3000/owner/dashboard`.

- [ ] App bar has NO prev/next/month/view-toggle (only hamburger, Claro, theme, star, bell, avatar)
- [ ] Range/Event toggle renders at top of calendar content
- [ ] Floating pill at bottom-center shows `← Apr 2026 →` (or current month)
- [ ] Tap prev → month decrements; tap next → month increments
- [ ] Scroll the calendar; pill stays fixed at bottom
- [ ] Last calendar row is not hidden under the pill

- [ ] **Step 7: Manual verification — mobile, non-calendar page**

Navigate to `http://localhost:3000/owner/properties` at 390 × 844.

- [ ] No pill is visible (pill is conditional on route + mobile, but `HomeOwner` only mounts on `/owner/dashboard` so this is guaranteed).
- [ ] Properties page renders normally — layout unchanged.

- [ ] **Step 8: Manual verification — desktop**

Resize to 1440 × 900. Navigate to `http://localhost:3000/owner/dashboard`.

- [ ] App bar has prev/next + month label (unchanged from before)
- [ ] No pill visible
- [ ] Range/Event toggle renders above the calendar (new location)
- [ ] Calendar navigation works (prev/next in app bar, toggle above grid)

- [ ] **Step 9: Commit**

```bash
git add src/components/smart/owner/HomeOwner.vue
git commit -m "feat(owner): mount CalendarNavPill on mobile dashboard"
```

---

## Task 6: Final verification and build

**Files:** none modified — verification only

- [ ] **Step 1: Full build**

Run: `pnpm build`
Expected: `vue-tsc --noEmit` passes; Vite build succeeds.

- [ ] **Step 2: Run affected tests**

Run: `pnpm test:run`
Expected: All existing tests pass (no new tests were added — presentational layout changes are verified visually).

- [ ] **Step 3: Dark theme spot-check**

Open the ThemePicker in the app bar, switch to a dark theme. Navigate to `/owner/dashboard` at 390 × 844.
- [ ] Pill background remains legible (frosted backdrop blends with dark theme background)
- [ ] Month label text color adapts (uses `rgb(var(--v-theme-on-surface))`)
- [ ] Range/Event toggle is readable

If contrast looks off in dark mode, adjust the pill background alpha — bump `rgba(var(--v-theme-background), 0.72)` to `0.85`. Commit any fix with `fix(owner): improve CalendarNavPill dark-theme contrast`.

- [ ] **Step 4: Git status clean**

Run: `git status`
Expected: Working tree clean (all changes committed).

---

## Summary of commits

At plan completion the branch should have exactly these new commits (one per task that touches code):

1. `feat(owner): add CalendarNavPill dumb component for mobile calendar nav`
2. `refactor(owner): remove view toggle from app bar (moving to page)`
3. `feat(owner): hide calendar controls in app bar on mobile`
4. `feat(owner): relocate Range/Event toggle above calendar grid`
5. `feat(owner): mount CalendarNavPill on mobile dashboard`
6. (Optional) `fix(owner): improve CalendarNavPill dark-theme contrast`

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| App bar on mobile calendar page shows no calendar controls | Task 3 |
| View toggle relocates to above calendar grid on both breakpoints | Task 2 + Task 4 |
| Floating pill at bottom with frosted backdrop | Task 1 + Task 5 |
| Pill is mobile-only, calendar-route-only | Task 5 step 3 (render guard `v-if="mobile"` inside `HomeOwner.vue`, which only mounts on `/owner/dashboard`) |
| Safe-area inset handling | Task 1 (`env(safe-area-inset-bottom)`) |
| Last calendar row not obscured | Task 5 step 4 (`padding-bottom: 88px` in `@media (max-width: 599px)`) |
| Dumb component isolation | Task 1 (props + emits only, no composable imports) |
| Reuse `useOwnerCalendarState` | Task 5 step 2/3 (wired in smart parent) |
| Desktop behavior preserved for prev/next/month | Task 3 (only `!mobile` gates it — desktop unchanged) |
