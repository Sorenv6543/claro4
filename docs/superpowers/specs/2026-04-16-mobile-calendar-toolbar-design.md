# Mobile Calendar Toolbar

Design date: 2026-04-16
Branch: `feature/materio-restyle`

## Goal

On the owner dashboard (`/owner/dashboard`), the app bar on mobile is overcrowded: it carries the layout items (hamburger, Claro logo, theme/star/bell/avatar) alongside the calendar's own header controls (prev/next, month/year label, Range/Event view toggle). At ~390 px wide these elements overflow or crowd each other.

Split the two concerns so they coexist cleanly on mobile while preserving the current desktop layout.

## Scope

In:
- `src/layouts/owner.vue` — conditionally hide calendar controls on mobile
- `src/pages/owner/dashboard.vue` (or its smart child / the page that renders the calendar) — host the relocated view toggle and a new floating navigation pill
- Reuse `useOwnerCalendarState` — no new composables or stores

Out of scope:
- Admin dashboard/calendar
- Month picker popover on the label (future enhancement)
- Any change to non-calendar pages
- Desktop behavior beyond moving the view toggle below the app bar (see #2)

## Design

### 1. App bar — mobile, calendar route

When `useDisplay().mobile === true` on `/owner/dashboard`, the app bar renders the same content it shows on every other page: hamburger, Claro logo, theme picker, star, bell, avatar. The three calendar-specific controls (prev/next, month/year, view toggle) disappear from the bar on mobile. Desktop keeps prev/next and the month/year label in the bar; see #2 for the view toggle.

### 2. View toggle — both breakpoints

The Range / Event `v-btn-toggle` moves out of the app bar permanently and renders at the top of the calendar page content, above the calendar grid. Same component, same `v-model` tied to `useOwnerCalendarState().viewMode`. Rationale: separates "which view" from "which month" conceptually and frees a slot from the app bar on both breakpoints.

### 3. Floating navigation pill — mobile only, calendar route

A fixed-position pill at the bottom of the viewport containing `[← Apr 2026 →]`.

Visual:
- Rounded pill (`border-radius: 9999px`)
- Frosted backdrop: `background: rgba(var(--v-theme-background), 0.72); backdrop-filter: blur(12px);` — matches the app bar's frosted-glass treatment
- Subtle elevation shadow: `box-shadow: var(--claro-shadow-md)`
- Horizontal centered, fixed width fits content + 16 px padding
- Uses tokens from `tokens.css`

Position:
- `position: fixed`
- `bottom: calc(var(--claro-space-md) + env(safe-area-inset-bottom))`
- `left: 50%; transform: translateX(-50%)`
- `z-index` above the content layer but below any modal/dialog overlay (use Vuetify's z-index convention — ~`var(--v-overlay-opacity, 6)` equivalent; concretely `z-index: 4`)

Behavior:
- Tap prev/next → `calendarState.prev()` / `calendarState.next()`
- Month label is non-interactive (reads `formattedMonthYearShort`)
- Pill stays visible during vertical scroll
- Pill renders only when `useDisplay().mobile` is true AND the route is `/owner/dashboard`

### Edge cases

- **Last calendar row obscured by pill:** add `padding-bottom: 88px` to the calendar container on mobile (pill height ≈ 48 px + 16 px gap above + 16 px bottom + safe-area). Implemented on the calendar wrapper, not globally.
- **iOS safe area:** `env(safe-area-inset-bottom)` handles home-indicator overlap.
- **Landscape orientation on mobile:** pill stays at bottom center; same rules apply.
- **Theme picker / avatar menu above the pill:** pill uses a modest z-index so overlays/menus render over it normally.

## File touches

| File | Change |
|------|--------|
| `src/layouts/owner.vue` | Wrap the `v-if="isCalendarPage"` block of prev/next/month/view-toggle behind an additional `&& !mobile` guard for the prev/next/month; remove the view-toggle entirely from the app bar (it moves to the page). Pull in `useDisplay()` (already imported for `mdAndUp`). |
| `src/pages/owner/dashboard.vue` (or the smart component it renders) | Add a `v-btn-toggle` above the calendar grid, bound to `calendarState.viewMode`. Add a floating pill component (see next row) when mobile. Wire `padding-bottom` on the calendar wrapper when mobile. |
| `src/components/dumb/owner/CalendarNavPill.vue` (new) | Presentational pill with two icon buttons and a label prop. Props: `label: string`. Emits: `prev`, `next`. No store/composable imports — pure dumb component. |

Keeping the pill as a dumb component isolates the presentation from `useOwnerCalendarState`; the dashboard page wires them together.

## Testing considerations

- Manual Chrome DevTools verification at 390 × 844 (iPhone 12/13 Pro), 768 × 1024 (iPad), and 1440 × 900 (desktop).
- Verify:
  - Mobile calendar page: app bar shows no calendar controls; pill is visible and navigates correctly; view toggle is above the grid.
  - Mobile non-calendar page: nothing changes.
  - Desktop calendar page: prev/next/month remain in app bar; view toggle is above the grid (moved from app bar).
  - Scroll calendar page on mobile: pill stays fixed; last row isn't obscured.
  - Theme picker menu still opens over the pill.

Run `pnpm build:fast` after changes to catch type errors. No unit tests needed for purely presentational layout changes; existing calendar state tests already cover `useOwnerCalendarState`.

## Risks

- **Dark theme frosted-glass contrast** — the rgba backdrop may look washed in dark mode. Verify at both themes.
- **Fixed positioning inside `v-main`** — if the pill is rendered inside `v-main` instead of teleported to body, scroll behavior may parent-relative. Render using `<Teleport to="body">` or position it at the root of the dashboard template (inside `v-main` but outside any transformed parent).
