# Layout & Navigation Restyle — Brainstorm State (2026-03-26)

**Branch:** `materioUiswap`
**Visual companion server:** may need restarting (`scripts/start-server.sh --project-dir C:\Users\Soren\claro4`)

---

## Context

Continuing the Materio UI swap. Previous session restyled dashboards, tables, and forms (see `docs/implementation-notes/2026-03-25-materio-ui-swap-session.md`). This session focuses on **layouts & navigation** — sidebars, app bars, and mobile bottom nav.

## Change already made this session

- `src/utils/authHelpers.ts`: Changed owner default post-login route from `/owner/dashboard` to `/owner/overview`

## Decisions Made

1. **Sidebar style: LIGHT** — White background, subtle blue-tinted active state, clean & airy. Not the dark Materio sidebar. Both owner and admin sidebars follow this same visual direction.

2. **Admin sidebar content: TBD** — Still need to decide whether to strip metrics/alerts/quick actions (nav-only) or keep some. The question was asked but not yet answered.

## Questions Still to Ask

- Admin sidebar content scope (nav-only vs keep extras)
- Owner sidebar: add Overview link to nav items?
- App bar restyle direction (owner has calendar controls embedded, admin has no app bar)
- Mobile bottom nav restyle
- Should owner and admin share the same app bar pattern?
- Sidebar collapsed/icon-only mode?

## Key Files to Modify

| File | What |
|------|------|
| `src/components/smart/owner/OwnerNavigationDrawer.vue` | Owner sidebar — restyle to Materio light |
| `src/components/smart/admin/AdminSidebar.vue` | Admin sidebar — restyle to Materio light, possibly strip content |
| `src/layouts/owner.vue` | Owner app bar + layout shell |
| `src/layouts/admin.vue` | Admin layout shell (currently no app bar) |
| `src/components/smart/owner/OwnerBottomNav.vue` | Mobile bottom nav |

## Reference Images

- `UI/Layer 1.png` — Materio dark sidebar (eCommerce dashboard)
- `UI/Layer 2.png` — Materio dark sidebar (Analytics dashboard)
- `UI/Layer 3.png` — Materio light sidebar (collapsed icon-only mode)
- `UI/Layer 9.png` — Materio calendar page with sidebar
- `UI/Layer 16.png` — Materio Academy dashboard (the target aesthetic)

## Current State Summary

### Owner Sidebar (OwnerNavigationDrawer.vue)
- 264px wide, permanent on md+, temporary on mobile
- Sections: Navigation (Schedule, Check-ins [disabled], Bookings, Properties), My Properties (dynamic list), Account (Settings)
- User info at bottom with avatar + name + email
- Clean but unstyled — needs Materio visual treatment

### Admin Sidebar (AdminSidebar.vue)
- 280px wide, permanent on desktop, temporary on mobile
- 200px brand overlay at top (gradient background with shield icon)
- 8 nav items, business metrics (4 cards), urgent alerts, quick actions (5 items), user info
- Very content-heavy — contrast with Materio's clean nav-only approach

### Owner Layout (owner.vue)
- v-app-bar with hamburger, "Claro" logo, calendar controls (conditional), notification bell, avatar menu
- Calendar controls only show on `/owner/dashboard`
- Uses OwnerNavigationDrawer + OwnerBottomNav

### Admin Layout (admin.vue)
- No app bar — just AdminSidebar + content area
- Content area shifts with margin-left when sidebar is open
- No hamburger toggle visible (sidebar is always-open on desktop)
