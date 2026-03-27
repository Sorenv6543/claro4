# Admin Overview Page Redesign — Operations Command Center

**Date:** 2026-03-27
**Status:** Draft

## Summary

Redesign the admin overview/dashboard page (`/admin`) from a metrics-focused dashboard into a **time-aware operations command center** using a split-view layout. The page surfaces problems (unassigned cleanings, urgent turns, cleaner overload) and lets the admin resolve them in-place without navigating away.

## Design Principles

1. **Operations-first** — This is a command center, not a reporting dashboard. Metrics stay minimal.
2. **Time-aware** — Before ~4 PM: focus on rest-of-today. After ~4 PM: shift to tomorrow's prep.
3. **Actionable** — Every problem shown can be fixed inline (assign cleaner, change status).
4. **Mobile-ready** — Desktop-first split layout that collapses to single column with alerts on top.

## Existing Admin Features (Current State)

The admin side currently has these pages and capabilities:

| Page | Route | Purpose |
|------|-------|---------|
| Dashboard/Home | `/admin` | Welcome banner, weekly bookings chart, top properties, upcoming checkouts, urgent turns, cleaner availability |
| Schedule | `/admin/schedule` | Master FullCalendar with all bookings, month/week/day/list views, drag-resize |
| Bookings | `/admin/bookings` | Filterable bookings table (status, type, property, date range), create/edit bookings |
| Properties | `/admin/properties` | Property grid with search + filters (status, tier, owner, duration), create/edit |
| Property Owners | `/admin/property-owners` | Owner data table with search, view portfolios |
| Owner Detail | `/admin/owners/:id` | Single owner profile, edit info, view their properties |
| Cleaners | `/admin/cleaners` | Cleaner management, stats (total, available, busy, ratings), performance metrics |
| Reports | `/admin/reports` | Business analytics, KPIs, charts, export |
| Users | `/admin/users` | System user management, bulk role changes, add users |

**Key admin composables:** `useAdminBookings` (system-wide bookings, turns, unassigned), `useAdminProperties` (all properties), `useCleanerManagement` (availability, performance, workload), `useAdminCalendarState`, `useAdminUserManagement`, `useAdminErrorHandler`.

**Current dashboard (AdminDashboard.vue) shows:** Welcome banner with stat pills, weekly bookings chart, top properties, upcoming checkouts, urgent turns card, cleaner availability card. This is being replaced by the new design below.

## Page Structure

Three vertical zones:

### 1. Metrics Strip (Top)

A single `v-row` of 3-4 `v-chip` components with `variant="tonal"`:

| Metric | Color | Example |
|--------|-------|---------|
| Total cleanings today/tomorrow | `info` | "14 cleanings today" |
| Unassigned count | `error` (if > 0), `success` (if 0) | "2 unassigned" or "All assigned ✓" |
| Turn count | `warning` | "3 turns" |
| Active cleaners | `success` | "8 cleaners active" |

Chips are reactive — the "unassigned" chip turns green when you resolve the last one.

### 2. Split Content Area (Main)

Desktop (`≥ 960px`): `v-row` with two columns.

| Panel | Column | Purpose |
|-------|--------|---------|
| Timeline | `v-col cols="12" md="7"` | Chronological schedule for today (or tomorrow after evening shift) |
| Action Panel | `v-col cols="12" md="5" order="1" order-md="2"` | Stacked problem cards with inline resolution |

### 3. Time-Aware Behavior

A computed based on current hour drives the page mode:

- **Before ~4 PM:** Heading "Today's Schedule". Timeline shows rest-of-day bookings. Tomorrow Preview card is dimmed/small in action panel.
- **After ~4 PM:** Heading "Tomorrow's Prep". Timeline shows tomorrow's bookings. A collapsed "Today's Recap" summary replaces the day's timeline. Tomorrow Preview card expands and gains full prominence with assign actions for unassigned items.

The threshold (~4 PM) should be a constant, easy to adjust.

## Left Panel — Today's Timeline

A vertical stack of booking cards sorted chronologically by relevant time (checkout_time for departures, checkin_time for arrivals).

### Booking Card Layout

Each booking is a `v-card` with `variant="outlined"` using horizontal flex layout:

| Element | Position | Vuetify Component | Details |
|---------|----------|-------------------|---------|
| Time | Left, fixed width | Text | Bold, e.g. "9:00" |
| Property color dot | After time | Styled div | 10px circle using property's `color` field |
| Property name + type | Center, flex-grow | Text | Name on first line, "Checkout → Standard clean" or "Turn (checkin 3:00 PM)" below |
| Status chip | Right area | `v-chip size="small"` | pending (grey), scheduled (blue), in_progress (amber), completed (green) |
| Assigned cleaner | Right area | `v-avatar size="24"` + text | Initials avatar + name, or "Team A (2)" for team assignments |
| Unassigned indicator | Right area (replaces cleaner) | `v-chip color="error" size="small"` | "Unassigned" — shown instead of cleaner when none assigned |
| Quick actions | Far right | `v-btn icon size="small"` | Assign, view details, change status (via menu) |

### Visual Indicators

- **Unassigned bookings**: Red left border (`border-left: 3px solid error`), light red background tint
- **In-progress bookings**: Amber/orange left border
- **Completed bookings**: Collapse to a single summary line: "✓ 3 completed cleanings earlier today" — saves space, reduces noise
- All other bookings: No left border accent

### Time Grouping

Subtle text dividers between time groups:
- "Morning" (before 12:00)
- "Afternoon" (12:00–17:00)
- "Evening" (after 17:00)

Implemented as simple styled text with a bottom border, not heavy section headers.

## Right Panel — Action Panel

Stacked `v-card` components ordered by urgency. Cards disappear when their items are resolved.

### Card 1: Unassigned Cleanings (Red Accent)

- **Visibility:** Only shown when unassigned bookings exist
- **Border:** `border-color="error"`
- **Header:** "⚠ Unassigned" + count `v-badge`
- **Each item:** Property name, time, booking type. "Assign ▾" button on the right.
- **Assign action:** Opens `v-menu` with three-tab interface (see Assignment Flow below)

### Card 2: Urgent Turns (Orange Accent)

- **Visibility:** Only shown when turns exist within 6-hour window
- **Border:** `border-color="warning"`
- **Header:** "🔄 Urgent Turns" + count badge
- **Each item:** Property name, time window ("11:00 AM out → 3:00 PM in"), time remaining countdown, assigned cleaner or unassigned indicator
- **Priority chips:** Critical (< 2h, red), Urgent (< 6h, orange)
- **Countdown:** Reactive, updates every minute. Uses `calculateBookingPriority` from `businessLogic.ts`

### Card 3: Cleaner Availability (Neutral Border)

- **Visibility:** Always shown
- **Border:** Default grey
- **Header:** "👤 Cleaner Availability"
- **Each cleaner/team:** Avatar + name, `v-progress-linear` showing utilization (jobs assigned / max_daily_bookings), fraction text (e.g., "2/4")
- **Color coding:** Green (< 50% utilized), Amber (50-75%), Red (> 75% or at capacity)
- **Teams** appear in the list alongside individual cleaners, showing team utilization
- **Expand on click:** Shows the cleaner's/team's assigned bookings for today

### Card 4: Tomorrow Preview (Info Accent)

- **Visibility:** Always shown, but prominence changes with time of day
- **Before 4 PM:** Dimmed (`opacity: 0.7`), single summary line: "9 cleanings · 2 turns · All assigned ✓"
- **After 4 PM:** Full prominence, expands to show tomorrow's unassigned items with assign actions, similar to Card 1
- **Border:** Default grey before 4 PM, `border-color="info"` after 4 PM

### Empty State

When all action cards are resolved (no unassigned, no urgent turns):
- Unassigned and Urgent Turns cards disappear
- A `v-card` appears with a check icon and "All clear — no actions needed" in muted text
- Cleaner Availability and Tomorrow Preview remain visible

## Assignment Flow (Inline)

When the admin clicks "Assign ▾" on any unassigned booking:

A `v-menu` opens anchored to the button, containing a `v-btn-toggle` with three modes:

### Tab 1: Assign Cleaner
- List of individual cleaners with availability (utilization bar)
- Cleaners at capacity are shown but disabled/greyed
- Click a cleaner → immediate assignment with optimistic update

### Tab 2: Assign Team
- List of saved/predefined teams with team name and member count
- Shows team availability (aggregate of member utilization)
- Click a team → assigns team to the booking

### Tab 3: Quick Group
- Multi-select list of available individual cleaners
- Select 2-3 cleaners → "Assign Group" button at bottom
- Creates an ad-hoc group assignment for this booking only

**Data model note:** Supporting teams requires:
- A `cleaner_teams` table (id, name, member cleaner IDs)
- Bookings support: `assigned_cleaner_id` (single), `assigned_team_id` (saved team), or an ad-hoc group (array of cleaner IDs, possibly via junction table)
- Full team CRUD (create, edit, manage members) is **out of scope** for this spec — deferred to a separate "Cleaner Teams Management" feature. This spec only needs the ability to *use* existing teams and *create ad-hoc groups* when assigning.

## Mobile Layout (< 960px)

Vuetify's responsive grid handles the reflow:

1. **Metrics strip** — Horizontal scrollable row of chips (no change)
2. **Action panel stacks on top** — `order="1"` puts alerts first on mobile (most important when checking phone between jobs)
3. **Timeline below** — Same cards but more compact:
   - Time + property + status on one line
   - Cleaner info and actions move behind a `v-btn icon="mdi-dots-vertical"` overflow menu
   - Completed bookings auto-collapse
4. **Empty state** — Smaller: just icon + one line text

## Components to Create/Modify

### New Dumb Components (`src/components/dumb/admin/`)

| Component | Purpose |
|-----------|---------|
| `AdminMetricsStrip.vue` | Top row of stat chips — receives counts as props |
| `AdminTimelineCard.vue` | Single booking card in the timeline — receives booking, property, cleaner as props, emits assign/view/status events |
| `AdminTimelineDivider.vue` | "Morning" / "Afternoon" / "Evening" time group divider |
| `AdminUnassignedCard.vue` | Action panel card listing unassigned bookings with assign buttons |
| `AdminUrgentTurnsCard.vue` | Action panel card listing urgent turns with countdowns (replaces existing `UrgentTurnsCard.vue`) |
| `AdminCleanerAvailabilityCard.vue` | Compact cleaner utilization list (replaces existing `CleanerAvailabilityCard.vue`) |
| `AdminTomorrowPreview.vue` | Tomorrow summary/prep card with time-aware prominence |
| `AdminAllClearCard.vue` | Empty state when no actions needed |
| `AssignmentMenu.vue` | The 3-tab assign menu (cleaner / team / quick group) — reusable across overview and other pages |

### Modified Smart Components

| Component | Changes |
|-----------|---------|
| `AdminDashboard.vue` | **Major rewrite** — Replace current grid layout with split-view. Wire up new dumb components. Add time-aware computed. Remove weekly chart, top properties (those move to Reports if not already there). |
| `HomeAdmin.vue` | Minor — Update modal/event handling to support new assignment flow |

### Modified Composables

| Composable | Changes |
|------------|---------|
| `useAdminBookings.ts` | Add `todayBookingsByTime` computed (sorted chronologically), `tomorrowBookings` computed, `unassignedToday` computed. Add `assignCleanerToBooking`, `assignTeamToBooking`, `assignGroupToBooking` methods. |
| `useCleanerManagement.ts` | Add team-aware availability. Add `allTeams` computed (once teams table exists). |

### New Composable

| Composable | Purpose |
|------------|---------|
| `useTimeAwareMode.ts` (`src/composables/admin/`) | Encapsulates the time-of-day logic: exports `isEveningMode` (boolean), `currentModeLabel` ("Today's Schedule" / "Tomorrow's Prep"), `eveningThresholdHour` (configurable, default 16). Updates reactively. |

## Database Changes (Scoped to Assignment Support)

### New Table: `cleaner_teams`

```sql
CREATE TABLE cleaner_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  member_ids UUID[] NOT NULL,  -- array of user_profile IDs with role='cleaner'
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Bookings Table Additions

```sql
ALTER TABLE bookings
  ADD COLUMN assigned_team_id UUID REFERENCES cleaner_teams(id),
  ADD COLUMN assigned_group_ids UUID[];  -- ad-hoc group, no FK (cleaner IDs)
```

**Constraint:** A booking should have at most one of: `assigned_cleaner_id`, `assigned_team_id`, or `assigned_group_ids` populated. Enforce via CHECK constraint:

```sql
ALTER TABLE bookings ADD CONSTRAINT one_assignment_type CHECK (
  (CASE WHEN assigned_cleaner_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN assigned_team_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN assigned_group_ids IS NOT NULL AND array_length(assigned_group_ids, 1) > 0 THEN 1 ELSE 0 END) <= 1
);
```

### RLS for `cleaner_teams`

- Admins: full CRUD
- Cleaners: SELECT where their ID is in `member_ids`
- Owners: no access

### TypeScript Types

```typescript
// src/types/team.ts (new file)
interface CleanerTeam {
  id: string
  name: string
  member_ids: string[]
  active: boolean
  created_at: string
  updated_at: string
}

// Update Booking type
interface Booking {
  // ... existing fields ...
  assigned_cleaner_id: string | null   // existing
  assigned_team_id: string | null      // new
  assigned_group_ids: string[] | null  // new
}
```

## Out of Scope

- **Cleaner Teams Management page** — Full CRUD for creating/editing teams, managing members. Separate spec.
- **Reports page changes** — Any displaced widgets (weekly chart, top properties) moving to reports. Separate task.
- **Realtime updates** — The overview will use existing Supabase realtime subscriptions from the stores. No new realtime channels needed.
- **Push notifications** — Alerting admin of urgent turns via browser notifications. Separate feature.
- **Drag-drop assignment** — Dragging a cleaner onto a booking card. Nice-to-have for a future iteration.
