# Materio UI Swap — Session Notes (2026-03-25)

**Branch:** `materioUiswap`
**Commits:** `85792b1` (design spec), `479c235` (implementation), `da1fde9` (linter fixes)

---

## Goal

Restyle Claro4's admin dashboard, owner pages, and onboarding flows to match Materio's Academy dashboard aesthetic. Keep Claro4's blue color palette (#1976D2) and existing navigation/sidebar structure. Do NOT touch calendar pages.

## Design Decisions

- **Color palette:** Keep Claro4 blue, borrow Materio's component styling/spacing/typography only
- **Owner dashboard:** Keep full-viewport calendar as-is, add a **separate** `/owner/overview` page with operational widgets
- **No revenue widgets:** Focus on operational metrics (bookings, cleanings, occupancy) since revenue tracking doesn't exist yet
- **Admin dashboard:** Restyle to Materio Academy layout (welcome banner + stat pills + card grid)
- **Tables:** Materio data tables with expandable rows + row editing via dialog for owner bookings, owner properties, admin bookings
- **Onboarding:** Numbered form wizard (Materio style) for property creation (3 steps) and admin user creation (3 steps)
- **Admin dashboard scope:** Full restyle plus new widgets (not just visual refresh)

## Reference Pages (Materio Template)

- **Academy Dashboard:** `https://demos.themeselection.com/materio-vuetify-vuejs-admin-template/demo-1/dashboards/academy` — Welcome banner, stat pills with colored icons, donut charts, list cards, progress indicators
- **Data Tables:** `https://demos.themeselection.com/materio-vuetify-vuejs-admin-template/demo-1/tables/data-table` — Expandable Rows, Row Editing via Dialog patterns
- **Form Wizard:** `https://demos.themeselection.com/materio-vuetify-vuejs-admin-template/demo-1/forms/form-wizard-numbered` — Numbered steps (01, 02, 03) with connecting line, Previous/Next buttons

## What Was Built

### Shared Foundation (2 new components)

| File | Purpose |
|------|---------|
| `src/components/dumb/shared/MaterioDataTable.vue` | Reusable Materio-styled v-data-table wrapper — searchable, expandable rows, slot-based customization, styled headers |
| `src/components/dumb/shared/MaterioFormWizard.vue` | Numbered step wizard (01, 02, 03 circles with connecting lines), Previous/Next/Submit navigation |

### Admin Dashboard Restyle (7 files)

| File | Purpose |
|------|---------|
| `src/components/smart/admin/AdminDashboard.vue` | **Modified** — Academy-style layout: welcome banner, stat pills, card grid with 6 widget types |
| `src/components/dumb/admin/AdminWelcomeBanner.vue` | Greeting + 3 stat pills (properties/bookings/turns) + cleaning workload donut |
| `src/components/dumb/admin/WeeklyBookingsChart.vue` | CSS horizontal bar chart (Mon-Sun) |
| `src/components/dumb/admin/TopPropertiesCard.vue` | Ranked property list with color dots + booking count |
| `src/components/dumb/admin/UpcomingCheckoutsCard.vue` | Next 5 checkouts with status chips |
| `src/components/dumb/admin/UrgentTurnsCard.vue` | Urgent turns alert card with priority badges |
| `src/components/dumb/admin/CleanerAvailabilityCard.vue` | v-progress-circular per cleaner |

### Owner Overview Page (10 files)

| File | Purpose |
|------|---------|
| `src/pages/owner/overview.vue` | Thin page wrapper |
| `src/router/index.ts` | **Modified** — Added `/owner/overview` route |
| `src/components/smart/owner/OwnerOverview.vue` | Smart component — data orchestration from existing composables |
| `src/components/dumb/owner/OwnerWelcomeBanner.vue` | Greeting + stat pills + booking activity donut |
| `src/components/dumb/owner/OwnerUrgentTurnsBanner.vue` | Conditional urgent turns alert |
| `src/components/dumb/owner/OwnerPropertySummaryCards.vue` | Per-property cards with occupancy bars |
| `src/components/dumb/owner/OwnerUpcomingBookings.vue` | Check-in/out list with status chips |
| `src/components/dumb/owner/OwnerMiniCalendar.vue` | Month grid with color-coded booking dots |
| `src/components/dumb/owner/OwnerRecentActivity.vue` | v-timeline with relative timestamps |
| `src/components/dumb/owner/OwnerCleaningStatus.vue` | Per-property cleaning status table |

### Owner Data Tables (3 modified files)

| File | Changes |
|------|---------|
| `src/components/smart/owner/OwnerBookings.vue` | Materio data table + expandable rows + stat pills header + dialog editing |
| `src/components/smart/owner/OwnerProperties.vue` | Materio data table replacing card grid + expandable rows + dialog editing |
| `src/components/smart/owner/OwnerProfile.vue` | Materio card styling: avatar header, info grid, stats, quick actions |

### Admin Bookings + Form Wizards (3 files)

| File | Changes |
|------|---------|
| `src/components/smart/admin/AdminBookings.vue` | Materio data table + expandable rows + collapsible filter bar + owner-perspective columns |
| `src/components/dumb/shared/PropertyModal.vue` | 3-step MaterioFormWizard replacing 2-step v-stepper |
| `src/components/dumb/admin/AdminUserWizard.vue` | New 3-step wizard (account details, profile info, review) |

## Totals

- **25 files changed** (18 created, 7 modified)
- **3,756 lines added**, **2,748 lines removed**
- Build passes (`pnpm build:fast`)
- Calendar pages untouched

## Design Spec

Full spec at: `docs/superpowers/specs/2026-03-25-materio-ui-swap-design.md`

## Next Steps (if continuing)

1. Visual QA — Navigate each page in the browser and compare against Materio reference
2. Add `/owner/overview` to the owner sidebar navigation
3. Wire up AdminUserWizard to an admin page (e.g., admin users page)
4. Test responsive behavior on mobile viewports
5. Run `pnpm test:run` to check for test regressions
6. Consider adding the overview link to the owner's default post-login redirect
