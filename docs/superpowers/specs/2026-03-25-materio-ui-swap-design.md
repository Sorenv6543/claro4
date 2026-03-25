# Materio UI Swap — Design Spec

**Date:** 2026-03-25
**Branch:** `materioUiswap`
**Goal:** Restyle Claro4's admin dashboard, owner pages, and onboarding flows to match Materio's Academy dashboard aesthetic — keeping Claro4's blue color palette and existing navigation/sidebar structure.

---

## 1. Design Reference

- **Materio Academy Dashboard** — Welcome banner with greeting + stat pills (colored icons), donut chart widget, horizontal bar chart, list cards with avatars, progress indicators
- **Materio Data Tables** — Expandable Rows (chevron toggle revealing detail panel), Row Editing via Dialog (edit/delete icons in ACTIONS column, modal form on edit click)
- **Materio Form Wizard** — Numbered steps (01, 02, 03) with connecting line, Previous/Next navigation, per-step validation

**Palette (kept from Claro4):**
- Primary: `#1976D2` (blue)
- Secondary: `#5C6BC0` (indigo)
- Accent: `#82B1FF`
- Success: `#4CAF50`, Warning: `#FF9800`, Error: `#F44336`, Info: `#2196F3`
- Background: `#F5F7FA`
- Surface: `#FFFFFF`

**Typography:** Inter (already in use), keep current weights (400, 500, 600).

---

## 2. Scope

### In Scope
1. **Admin Dashboard restyle** — Academy-style welcome banner, stat pill row, card grid with domain widgets
2. **Owner Overview page** — New `/owner/overview` route with 6 operational widgets
3. **Owner Bookings** (`/owner/bookings`) — Materio data table with expandable rows + row editing via dialog
4. **Owner Properties** (`/owner/properties`) — Materio data table with expandable rows + row editing via dialog
5. **Owner Profile** (`/owner/profile`) — Restyle with Materio card patterns
6. **Admin Bookings** (`/admin/bookings`) — Materio data table with expandable rows + row editing via dialog, owner-perspective data
7. **Owner Add Property wizard** — Numbered step form wizard for property onboarding
8. **Admin Add User wizard** — Numbered step form wizard for user creation

### Out of Scope (DO NOT TOUCH)
- Calendar pages (HomeOwner calendar, HomeAdmin calendar, Master Schedule)
- Auth pages
- Navigation/sidebar structure
- Store logic, composables, business logic
- Supabase queries or migrations

---

## 3. Admin Dashboard Restyle

**Current:** Header ("Admin Dashboard") + 4 stat cards + mini calendar + weekly insights + today's schedule.

**New layout (Academy-style):**

```
┌─────────────────────────────────────────────────────────────────┐
│ Welcome Banner                                                   │
│ ┌───────────────────────────────────┐ ┌───────────────────────┐ │
│ │ "Welcome back, {name} 👋"         │ │ Cleaning Workload     │ │
│ │ "Here's your business overview"   │ │ Weekly Report         │ │
│ │                                   │ │ {donut: completed vs  │ │
│ │ 🏠 Properties  📋 Bookings  🔥 Turns│ │  pending cleanings}  │ │
│ │    14             5          3    │ │ 12 of 18 done        │ │
│ └───────────────────────────────────┘ └───────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────┐ ┌──────────────────────────────────┐   │
│ │ Bookings This Week   │ │ Top Properties (by bookings)     │   │
│ │ Horizontal bar chart │ │ Avatar list: property name,      │   │
│ │ Mon-Sun bars         │ │ address, booking count           │   │
│ │ Color = booking type │ │                                  │   │
│ └──────────────────────┘ └──────────────────────────────────┘   │
│ ┌──────────────────────┐ ┌─────────────────┐ ┌──────────────┐  │
│ │ Upcoming Checkouts   │ │ Urgent Turns    │ │ Cleaner       │  │
│ │ List: property,      │ │ Banner card:    │ │ Availability  │  │
│ │ guest, date, status  │ │ count + details │ │ Progress ring │  │
│ │ "View All" link      │ │ priority badges │ │ per cleaner   │  │
│ └──────────────────────┘ └─────────────────┘ └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

**Component mapping:**
- Welcome banner → `AdminWelcomeBanner.vue` (dumb/admin)
- Stat pills → Inline in banner (icon + label + count, colored icon backgrounds like Materio)
- Cleaning workload donut → `CleaningWorkloadCard.vue` (dumb/admin) — uses a simple CSS donut or `v-progress-circular`
- Bookings this week → `WeeklyBookingsChart.vue` (dumb/admin) — horizontal bars using CSS (no chart library needed)
- Top properties → `TopPropertiesCard.vue` (dumb/admin) — list with property color dots + booking count
- Upcoming checkouts → `UpcomingCheckoutsCard.vue` (dumb/admin) — list card with "View All" link
- Urgent turns → `UrgentTurnsCard.vue` (dumb/admin) — alert-style card with priority badges
- Cleaner availability → `CleanerAvailabilityCard.vue` (dumb/admin) — `v-progress-circular` per cleaner

**Smart component:** `AdminDashboard.vue` — orchestrates data fetching, passes props to dumb widgets.

---

## 4. Owner Overview Page

**New route:** `/owner/overview` (added to router, owner layout)

**Layout:**

```
┌─────────────────────────────────────────────────────────────────┐
│ Welcome Banner                                                   │
│ ┌───────────────────────────────────┐ ┌───────────────────────┐ │
│ │ "Welcome back, {name} 👋"         │ │ Booking Activity      │ │
│ │ "Your property overview"          │ │ This Month            │ │
│ │                                   │ │ {donut: active vs     │ │
│ │ 🏠 Properties  📋 Bookings  🔥 Turns│ │  completed bookings} │ │
│ │    3             8          2     │ │ 8 total               │ │
│ └───────────────────────────────────┘ └───────────────────────┘ │
├─────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Urgent Turns Banner (conditional — only shows if turns > 0)  ││
│ │ 🔥 2 urgent turns today — [Property A @ 11:00] [Prop B @2pm]││
│ └──────────────────────────────────────────────────────────────┘│
│ ┌──────────────────────┐ ┌──────────────────────────────────┐   │
│ │ Property Summary     │ │ Upcoming Check-ins/outs          │   │
│ │ Cards per property:  │ │ This week list:                  │   │
│ │ - occupancy rate     │ │ - property, guest, date, type    │   │
│ │ - next booking       │ │ - status chips                   │   │
│ │ - color dot          │ │ "View Calendar" link             │   │
│ └──────────────────────┘ └──────────────────────────────────┘   │
│ ┌──────────────────────┐ ┌──────────────────────────────────┐   │
│ │ Mini Calendar        │ │ Recent Activity                  │   │
│ │ Month grid with      │ │ Timeline: latest bookings        │   │
│ │ booking density dots │ │ created/modified/cancelled        │   │
│ │ Property color coded │ │ Relative timestamps              │   │
│ └──────────────────────┘ └──────────────────────────────────┘   │
│ ┌──────────────────────────────────────────────────────────────┐│
│ │ Cleaning Status                                              ││
│ │ Per-property: next cleaning date, cleaner assigned, status   ││
│ └──────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

**Component mapping:**
- Welcome banner → `OwnerWelcomeBanner.vue` (dumb/owner) — reuses pattern from admin
- Booking activity donut → Inline `v-progress-circular`
- Urgent turns → `OwnerUrgentTurnsBanner.vue` (dumb/owner)
- Property summary → `OwnerPropertySummaryCards.vue` (dumb/owner)
- Upcoming check-ins/outs → `OwnerUpcomingBookings.vue` (dumb/owner)
- Mini calendar → `OwnerMiniCalendar.vue` (dumb/owner)
- Recent activity → `OwnerRecentActivity.vue` (dumb/owner)
- Cleaning status → `OwnerCleaningStatus.vue` (dumb/owner)

**Smart component:** `OwnerOverview.vue` (smart/owner) — new file, fetches from existing composables.

---

## 5. Data Tables — Materio Style

### Pattern: Expandable Rows + Row Editing via Dialog

All tables share a common visual pattern borrowed from Materio:

**Table structure:**
- `v-data-table` with Materio styling: no outer border, subtle row dividers, header row with uppercase small text, generous row height
- Expandable rows: chevron on left, clicking expands an inline detail panel with additional fields
- ACTIONS column on right: edit (pencil icon) and delete (trash icon) buttons
- Edit action opens a `v-dialog` with the edit form pre-populated
- Status shown as colored `v-chip` (pill style)
- Pagination at bottom with items-per-page selector

**Shared dumb component:** `MaterioDataTable.vue` (dumb/shared) — wraps `v-data-table` with:
- Props: `headers`, `items`, `expandable` (boolean), `searchable` (boolean)
- Slots: `expanded-row`, `item.actions`, column-specific slots
- Built-in search bar (optional)
- Materio-style header formatting

### 5a. Owner Bookings (`/owner/bookings`)

**Current:** Stats row + filter bar + basic data table with actions.

**New:** Materio data table.

| Column | Content |
|--------|---------|
| Expand chevron | Toggle detail panel |
| Property | Property name + color dot |
| Dates | Check-in → Check-out (formatted) |
| Type | `v-chip`: Standard / Turn |
| Status | `v-chip`: Confirmed / Pending / Cancelled |
| Guest Count | Number |
| Actions | Edit (dialog) / Delete |

**Expanded row:** Guest name, notes, special instructions, created date, priority badge.

**Edit dialog:** Pre-populated booking form fields (dates, type, status, guest info, notes).

### 5b. Owner Properties (`/owner/properties`)

**Current:** Grid of property cards with color-coded borders.

**New:** Materio data table.

| Column | Content |
|--------|---------|
| Expand chevron | Toggle detail panel |
| Property | Name + color dot + address |
| Bedrooms | Number |
| Bathrooms | Number |
| Type | `v-chip` |
| Status | `v-chip`: Active / Inactive |
| Actions | Edit (dialog) / Delete / View |

**Expanded row:** Special instructions, cleaning notes, contact info, default check-in/out times, property photos thumbnail strip.

**Edit dialog:** Property form (name, address, bedrooms, bathrooms, type, cleaning instructions, etc.).

### 5c. Owner Profile (`/owner/profile`)

**Current:** Read-only two-column layout with avatar.

**New:** Materio card styling — clean card with avatar header, info rows, and action buttons matching Materio's typography and spacing. Row editing via dialog for profile fields.

### 5d. Admin Bookings (`/admin/bookings`)

**Current:** 880-line component with table + card view toggle, comprehensive filters.

**New:** Materio data table with owner-perspective columns.

| Column | Content |
|--------|---------|
| Expand chevron | Toggle detail panel |
| Property | Name + color dot + owner name |
| Dates | Check-in → Check-out |
| Type | `v-chip` |
| Status | `v-chip` |
| Priority | Priority badge |
| Cleaner | Assigned cleaner name or "Unassigned" |
| Actions | Assign / Edit (dialog) / Cancel |

**Expanded row:** Guest info, notes, cleaning details, owner contact, created/modified dates.

**Keep:** Existing filter bar (search, status, type, property, date range) — just restyle to match Materio.

---

## 6. Form Wizards

### Pattern: Numbered Steps

Materio's form wizard: numbered circles (01, 02, 03) connected by a line, step title + subtitle, Previous/Next buttons, per-step validation.

**Implementation:** Use Vuetify's `v-stepper` with custom styling to match Materio's numbered look (large number, small subtitle text, connecting line between steps).

**Shared component:** `MaterioFormWizard.vue` (dumb/shared) — wraps `v-stepper` with:
- Props: `steps` (array of { title, subtitle }), `modelValue` (current step)
- Slots: per-step content
- Built-in Previous/Next buttons with validation hooks
- Materio numbered styling (circles with step numbers)

### 6a. Owner Add Property Wizard

**Current:** Modal with two-step stepper inside `PropertyModal.vue`.

**New:** Full-page wizard at `/owner/properties/create` (or modal, keeping current pattern but with Materio stepper styling).

**Steps:**
1. **Property Details** — Name, address, property type, color picker
2. **Rooms & Amenities** — Bedrooms, bathrooms, max guests, amenities
3. **Cleaning & Access** — Cleaning instructions, access notes, default check-in/out times, contact info

### 6b. Admin Add User Wizard

**Current:** No dedicated wizard exists for user creation.

**New:** Form wizard (modal or page).

**Steps:**
1. **Account Details** — Email, role (owner/admin), display name
2. **Profile Info** — Phone, company, notes
3. **Review & Create** — Summary card, confirm button

---

## 7. Shared Styling Updates

### Materio Card Style
Applied globally via `vuetify.ts` component defaults or a shared CSS class:
- Subtle shadow (`elevation="2"` — already set)
- `rounded="lg"` — already set
- Card title: `font-weight: 600`, `font-size: 1.125rem`
- Card subtitle: `font-size: 0.875rem`, `color: rgba(0,0,0,0.6)`
- Generous padding: `pa-4` to `pa-6`

### Stat Pill Pattern
Reusable across both dashboards:
```
[colored-bg icon] Label
                   Large Number (colored)
```
- Icon in a 48px rounded square with light-tinted background (e.g., blue icon on light blue bg)
- Label in small grey text above
- Value in large colored text below

### Status Chips
Consistent across all tables:
- Confirmed/Active → `color="success"` pill
- Pending → `color="warning"` pill
- Cancelled/Rejected → `color="error"` pill
- Turn → `color="info"` pill

---

## 8. File Map

| Action | File | Responsibility |
|--------|------|----------------|
| **Admin Dashboard** | | |
| Modify | `src/components/smart/admin/AdminDashboard.vue` | Restyle to Academy layout, use new dumb widgets |
| Create | `src/components/dumb/admin/AdminWelcomeBanner.vue` | Welcome greeting + stat pills |
| Create | `src/components/dumb/admin/CleaningWorkloadCard.vue` | Donut chart widget |
| Create | `src/components/dumb/admin/WeeklyBookingsChart.vue` | Horizontal bar chart |
| Create | `src/components/dumb/admin/TopPropertiesCard.vue` | Property list with booking counts |
| Create | `src/components/dumb/admin/UpcomingCheckoutsCard.vue` | Checkout list card |
| Create | `src/components/dumb/admin/UrgentTurnsCard.vue` | Urgent turns alert card |
| Create | `src/components/dumb/admin/CleanerAvailabilityCard.vue` | Cleaner progress rings |
| **Owner Overview** | | |
| Create | `src/components/smart/owner/OwnerOverview.vue` | Smart component — data orchestration |
| Create | `src/components/dumb/owner/OwnerWelcomeBanner.vue` | Welcome greeting + stat pills |
| Create | `src/components/dumb/owner/OwnerUrgentTurnsBanner.vue` | Conditional urgent turns alert |
| Create | `src/components/dumb/owner/OwnerPropertySummaryCards.vue` | Per-property summary cards |
| Create | `src/components/dumb/owner/OwnerUpcomingBookings.vue` | Check-in/out list |
| Create | `src/components/dumb/owner/OwnerMiniCalendar.vue` | Month grid with booking dots |
| Create | `src/components/dumb/owner/OwnerRecentActivity.vue` | Activity timeline |
| Create | `src/components/dumb/owner/OwnerCleaningStatus.vue` | Per-property cleaning status |
| Create | `src/pages/owner/overview.vue` | Page wrapper |
| Modify | `src/router/index.ts` | Add `/owner/overview` route |
| **Data Tables** | | |
| Create | `src/components/dumb/shared/MaterioDataTable.vue` | Shared Materio-styled data table wrapper |
| Modify | `src/components/smart/owner/OwnerBookings.vue` | Restyle with MaterioDataTable |
| Modify | `src/components/smart/owner/OwnerProperties.vue` | Restyle with MaterioDataTable |
| Modify | `src/components/smart/owner/OwnerProfile.vue` | Restyle with Materio card patterns |
| Modify | `src/components/smart/admin/AdminBookings.vue` | Restyle with MaterioDataTable |
| **Form Wizards** | | |
| Create | `src/components/dumb/shared/MaterioFormWizard.vue` | Shared numbered stepper component |
| Modify | `src/components/dumb/shared/PropertyModal.vue` | Use MaterioFormWizard for stepper |
| Create | `src/components/dumb/admin/AdminUserWizard.vue` | User creation wizard form |

---

## 9. Constraints

- **No calendar changes** — HomeOwner (calendar), HomeAdmin (calendar), Master Schedule are untouched
- **No store/composable changes** — All data comes from existing composables; widgets derive from existing data
- **No new Supabase queries** — Use what's already fetched
- **Keep blue palette** — Materio's purple is not adopted; styling patterns only
- **Responsive** — All new components must work on mobile (already enforced by Vuetify grid)
- **Build must pass** — `pnpm build` (with vue-tsc) must succeed
