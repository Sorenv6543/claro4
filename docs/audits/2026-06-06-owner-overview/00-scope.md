# Design Audit Scope

**Audit date:** 2026-06-06
**Audited surface:** Owner Overview page — primary landing screen for property owners
**Live URL:** http://localhost:3000/owner/overview
**Primary component:** `src/components/smart/owner/OwnerOverview.vue`
**Supporting components:**
- `src/components/dumb/owner/OwnerWelcomeBanner.vue`
- `src/components/dumb/owner/OwnerDayBar.vue`
- `src/components/dumb/owner/PropertyList.vue`
- `src/components/dumb/owner/OwnerBookingInlay.vue`
- `src/components/dumb/shared/RangeToggle.vue`
- Booking detail drawer (Teleported `bdr-*` elements in OwnerOverview.vue)

## Primary User
Property owners — 30–40 clients who hold 1–5 rental properties each. Not technically sophisticated. Use the app once or a few times per week. They do not manage cleaning operations; they observe their booking schedule and contact their cleaning company when needed.

## Primary Task
Understand today's booking situation at a glance, and take a booking action (reschedule, cancel, or contact admin) when needed.

## Constraints
- Stack: Vue 3 + Vuetify 4, Pinia, Supabase
- Design system: glass/bento aesthetic with CSS custom property tokens (`--claro-*`)
- Dark mode supported via Vuetify theme
- Mobile + desktop responsive (breakpoint via `useDisplay`)
- No admin or cleaning-operations terminology may appear in owner-facing copy
- Auth: session-persisted via Supabase JWT

## Non-goals for this audit
- Admin views (`/admin/*`)
- Owner Calendar page (`/owner/calendar`)
- Owner Bookings list page (`/owner/bookings`)
- Backend / Supabase schema

## Reference
No external competitor reference specified. Audit against the ten Dieter Rams principles only.
