# UI Polish Design — Materio Polished + Subtle Animations

**Date:** 2026-04-02  
**Branch:** feature/materio-restyle  
**Status:** Approved, ready for implementation

## Summary

The current UI looks flat and white because two root token values are misconfigured (background is `#ffffff` instead of `#F5F5F9`, welcome banner gradient is nearly invisible at 4% opacity) and there is no animation CSS anywhere. This spec fixes the root causes globally, then layers in targeted component upgrades and nav icon improvements.

## Decisions

| Question | Answer |
|---|---|
| Design direction | Materio Polished — soft gray bg, white cards, purple gradient banner |
| Animation style | Subtle Micro — shadow lifts, color fades, no bounce/spring |
| Icon treatment | Active-only highlight — filled icon + purple pill on active page, gray outline elsewhere |
| Scope | Owner layout first; admin inherits global CSS changes automatically; calendars last |

---

## Section 1 — Token & Theme Fixes

**Files:** `src/plugins/vuetify.ts`, `src/styles/tokens.css`

### vuetify.ts
- `v-theme-background`: `#ffffff` → `#F5F5F9`
- `v-theme-surface-variant`: keep `#F5F5F9` (no change)
- `VCard` elevation stays at `24` (resting shadow unchanged). The purple-tinted shadow is added only on hover via the global `.v-card:hover` rule in `main.scss` — not as a resting state override.

### tokens.css
- `--claro-background`: `#acacac` → `#F5F5F9` (sync with vuetify.ts)
- `--claro-shadow-md`: update to include a subtle purple tint: `0 4px 18px rgba(115, 103, 240, 0.12), 0 2px 6px rgba(0, 0, 0, 0.06)`
- `--claro-shadow-lg` (hover state): `0 8px 28px rgba(115, 103, 240, 0.18), 0 4px 10px rgba(0, 0, 0, 0.08)`

**Commit prefix:** `tokens:`

---

## Section 2 — Global Animation CSS

**File:** `src/styles/main.scss`

Add a single animation block, guarded by `prefers-reduced-motion`:

```scss
@media (prefers-reduced-motion: no-preference) {
  // Cards lift with purple shadow on hover
  .v-card {
    transition: box-shadow 0.25s ease, transform 0.2s ease;
    &:hover {
      box-shadow: var(--claro-shadow-lg);
      transform: translateY(-2px);
    }
  }

  // Buttons: press feel + hover dim for text/icon variants
  .v-btn {
    transition: opacity 0.15s ease, transform 0.15s ease;
    &:active { transform: scale(0.97); }
  }

  // List items: smooth highlight fade
  .v-list-item {
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  // Chips: tiny lift
  .v-chip {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    &:hover { transform: translateY(-1px); }
  }
}
```

**Exceptions:** Cards inside `.v-data-table` and `.v-calendar` get `transition: none` to avoid jank in dense grids.

**Commit prefix:** `restyle:`

---

## Section 3 — Welcome Banner Upgrade

**File:** `src/components/dumb/owner/OwnerWelcomeBanner.vue`

### Problem
Current gradient: `linear-gradient(135deg, rgb(var(--v-theme-surface)) 0%, rgba(25, 118, 210, 0.04) 0%)` — both stops start at 0%, making this effectively solid white.

### Fix
Replace with `--claro-gradient-primary` (already defined in tokens.css):
```scss
.welcome-banner {
  background: var(--claro-gradient-primary);
  color: #fff;
}
```

Update text colors to white (since banner is now dark):
- Greeting `text-h5`: already inherits, add `color: #fff`
- Subtitle `text-medium-emphasis`: change to `color: rgba(255,255,255,0.8)`
- Stat pill backgrounds: `rgba(255,255,255,0.2)` instead of hardcoded `rgba(25,118,210,0.12)`
- Stat pill icon colors: `#fff` instead of semantic colors (white reads better on purple)
- Stat numbers: `text-white` class or `color: #fff`

The donut chart (right column) stays as-is — `v-progress-circular` with its current color logic.

**Commit prefix:** `restyle:`

---

## Section 4 — Stat Cards & DashboardCard

**Files:** `src/components/dumb/shared/DashboardCard.vue`, `src/components/dumb/shared/StatCard.vue`

### DashboardCard
- Add `transition: box-shadow 0.25s ease, transform 0.2s ease` to the root `v-card`
- The global `.v-card:hover` rule from Section 2 handles this automatically — no scoped CSS needed unless the component overrides it

### StatCard
- Icon wrapper: ensure it uses `--claro-primary` tinted background (`rgba(115,103,240,0.12)`) via the token rather than hardcoded hex
- If `StatCard` already renders a `v-card`, it inherits the hover from Section 2

**Commit prefix:** `restyle:` (only if scoped overrides are needed; global CSS may handle it)

---

## Section 5 — Nav Icon Treatment

**Files:** `src/components/smart/owner/OwnerNavigationDrawer.vue`, `src/components/smart/admin/AdminSidebar.vue`

### Icon swap: outline → filled for active items
Switch from `-outline` suffix to filled variants on the active nav item. Implementation: in `navItems` array, add a `filledIcon` field alongside `icon`. The `v-list-item` uses `filledIcon` when active, `icon` (outline) when inactive.

```ts
const navItems = [
  { label: 'Overview',  icon: 'mdi-view-dashboard-outline', filledIcon: 'mdi-view-dashboard',      to: '/owner/overview' },
  { label: 'Schedule',  icon: 'mdi-calendar-month-outline', filledIcon: 'mdi-calendar-month',       to: '/owner/dashboard' },
  { label: 'Bookings',  icon: 'mdi-format-list-bulleted',   filledIcon: 'mdi-format-list-bulleted', to: '/owner/bookings' },
  { label: 'Properties',icon: 'mdi-home-outline',           filledIcon: 'mdi-home',                 to: '/owner/properties' },
  { label: 'Settings',  icon: 'mdi-cog-outline',            filledIcon: 'mdi-cog',                  to: '/owner/settings' },
]
```

Template change:
```vue
<v-list-item
  :prepend-icon="isActive(item.to) ? item.filledIcon : item.icon"
  ...
/>
```

### Property list items (sidebar)
Keep `mdi-home` (already filled) and the per-property color. No change needed.

### Active state pill
Already handled by Vuetify's `color="primary"` + `active` prop on `v-list-item`. No additional styling required — Vuetify applies a tinted background to active items automatically.

**Commit prefix:** `restyle:`

---

## Section 6 — Scope & Rollout Order

1. `tokens:` — Fix background + shadow tokens in `tokens.css` and `vuetify.ts`
2. `restyle:` — Add global animation CSS to `main.scss`
3. `restyle:` — Update `OwnerWelcomeBanner.vue` gradient + text colors
4. `restyle:` — Update `DashboardCard` / `StatCard` if scoped overrides needed
5. `restyle:` — Update `OwnerNavigationDrawer.vue` icon swap
6. `restyle:` — Update `AdminSidebar.vue` icon swap (mirrors owner)

Admin pages inherit the background + animation changes automatically via global CSS. No page-level admin component changes needed unless a specific admin component has hardcoded white backgrounds.

Calendars are explicitly out of scope (saved for last per established git strategy).

---

## Out of Scope

- Dark mode
- Calendar styling (FullCalendar custom CSS)
- New page layouts or route changes
- Animation on page entrance / route transitions
- Admin-specific component restyling beyond icon swap
