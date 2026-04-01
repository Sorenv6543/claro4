# Pencil-to-Vuetify Restyle Workflow

**Date:** 2026-04-01
**Scope:** Full app restyle using Materio .pen component library as visual source of truth
**Approach:** Hybrid — token bridge for foundational design system + selective wrapper components

## Problem

The current Claro4 UI uses Vuetify defaults with colors hardcoded in `vuetify.ts` and scattered SCSS. The Materio `.pen` file (`design/materio-vuetify.lib.pen`) contains both a styled component library and page mockups that define the target visual language. There is no systematic way to apply and maintain that design across the app.

## Goals

1. A repeatable workflow that restyles any page using the .pen file as the visual source of truth
2. Two-way sync between Pencil variables and a CSS token file so design and code stay in lockstep
3. Granular git workflow enabling safe rollback of individual visual changes
4. Full app coverage: all owner pages, admin pages, auth pages, and calendars (last)

## Architecture: Token Bridge

Three layers connected by a shared token file:

```
Pencil .pen (variables) ◄──two-way sync──► src/styles/tokens.css (CSS custom properties)
                                                      │
                                                      ▼
                                            src/plugins/vuetify.ts (theme reads tokens)
                                                      │
                                                      ▼
                                            Vue components (stock Vuetify + selective wrappers)
```

### Two-Way Sync Protocol

- **Design to Code:** Pencil MCP `get_variables()` extracts token values from .pen file. Write them to `src/styles/tokens.css`. Vuetify theme picks up changes automatically.
- **Code to Design:** Read `src/styles/tokens.css` values. Pencil MCP `set_variables()` updates the .pen file to match.

### How Vuetify Reads Tokens

`vuetify.ts` imports `tokens.css` and references CSS custom properties in theme color definitions. Vuetify 4 supports CSS color values directly in theme config, so `primary: 'var(--claro-primary)'` wires the theme to the token file without runtime JS. Components that use `color="primary"` automatically resolve to the token value. For non-color tokens (spacing, radii, shadows), components reference them via CSS: `var(--claro-radius-lg)` in scoped styles or wrapper components.

## Token File: `src/styles/tokens.css`

Single source of truth for all design values. Replaces hardcoded hex values in `vuetify.ts`, component styles, and scattered SCSS.

### Token Categories

```css
:root {
  /* Colors — primary palette */
  --claro-primary: ;
  --claro-primary-light: ;
  --claro-primary-dark: ;
  --claro-secondary: ;
  --claro-accent: ;

  /* Colors — surfaces */
  --claro-background: ;
  --claro-surface: ;
  --claro-surface-variant: ;
  --claro-card-bg: ;

  /* Colors — semantic */
  --claro-success: ;
  --claro-warning: ;
  --claro-error: ;
  --claro-info: ;

  /* Colors — domain-specific */
  --claro-turn-urgent: ;
  --claro-turn-standard: ;
  --claro-booking-standard: ;

  /* Typography */
  --claro-font-family: ;
  --claro-font-weight-regular: ;
  --claro-font-weight-medium: ;
  --claro-font-weight-semibold: ;

  /* Spacing scale */
  --claro-space-xs: ;
  --claro-space-sm: ;
  --claro-space-md: ;
  --claro-space-lg: ;
  --claro-space-xl: ;

  /* Shape */
  --claro-radius-sm: ;
  --claro-radius-md: ;
  --claro-radius-lg: ;
  --claro-radius-pill: ;

  /* Elevation / shadows */
  --claro-shadow-sm: ;
  --claro-shadow-md: ;
  --claro-shadow-lg: ;

  /* Gradients */
  --claro-gradient-primary: ;
  --claro-gradient-surface: ;

  /* Layout dimensions */
  --claro-app-bar-height: 64px;
  --claro-app-bar-height-mobile: 56px;
  --claro-drawer-width: 380px;
  --claro-drawer-width-collapsed: 72px;
  --claro-content-padding: 24px;
  --claro-content-padding-mobile: 12px;

  /* Responsive spacing */
  --claro-card-gap: var(--claro-space-md);
  --claro-card-padding: var(--claro-space-md);
  --claro-section-gap: var(--claro-space-lg);

  /* Touch targets */
  --claro-touch-target-min: 44px;

  /* Density */
  --claro-input-density: comfortable;
}

/* Mobile overrides */
@media (max-width: 599px) {
  :root {
    --claro-card-gap: var(--claro-space-sm);
    --claro-card-padding: var(--claro-space-sm);
    --claro-section-gap: var(--claro-space-md);
    --claro-content-padding: var(--claro-content-padding-mobile);
    --claro-input-density: compact;
  }
}

/* Tablet */
@media (min-width: 600px) and (max-width: 959px) {
  :root {
    --claro-card-gap: var(--claro-space-sm);
    --claro-card-padding: var(--claro-space-md);
    --claro-drawer-width: 320px;
  }
}
```

### Responsiveness: What's Tokenized vs. What Stays in responsive.scss

| Concern | Location | Rationale |
|---------|----------|-----------|
| Spacing, padding, gaps | `tokens.css` with media query overrides | Designer-facing values; Pencil can influence them; two-way sync works |
| Layout dimensions (app bar, drawer) | `tokens.css` | Currently hardcoded in multiple places; centralizing as tokens |
| Breakpoint values (600px, 960px) | `responsive.scss` — untouched | Vuetify breakpoint system, not a design token |
| Device-specific hacks (iPhone SE, Galaxy) | `responsive.scss` — untouched | Platform-specific, not expressible in a design file |
| FullCalendar mobile overrides (750+ lines) | `responsive.scss` — untouched | Saved for last phase; complex; not token-driven |
| Safe area / PWA viewport | `responsive.scss` — untouched | Platform concerns, not design concerns |
| Touch target minimums | `tokens.css` | Pencil can validate these in mobile frames |

Principle: `tokens.css` handles values a designer cares about. `responsive.scss` handles platform-specific behavior. The two files can reference each other — `responsive.scss` consumes token values where it currently hardcodes pixels.

## Selective Wrapper Components

Only created where stock Vuetify + tokens can't express the Materio pattern.

### Wrappers to Create

All in `src/components/dumb/shared/`:

| Component | Purpose | Props / Slots |
|-----------|---------|---------------|
| `DashboardShell.vue` | Materio-style app bar + sidebar + content shell with gradient/surface treatments | Slots: `#appbar`, `#sidebar`, `#default`. Token-driven background, shadow, sidebar styling |
| `DashboardCard.vue` | Materio card anatomy: header with optional icon badge, colored accent bar, content, actions | Props: `title`, `icon`, `accent-color`. Slots: `#default`, `#actions` |
| `StatCard.vue` | Materio KPI widget: large number + trend indicator + icon with colored background circle | Props: `value`, `label`, `icon`, `trend`, `color` |

### Stock Vuetify — Tokens Are Enough

These components need no wrapper. Vuetify global defaults + token colors/radii/shadows handle the Materio look:

`v-btn`, `v-text-field`, `v-select`, `v-chip`, `v-badge`, `v-list`, `v-list-item`, `v-table`, `v-dialog`, `v-alert`, `v-timeline`

### Existing Components to Update

These already exist and will be updated to consume tokens and use the new wrappers:

- `OwnerWelcomeBanner.vue` — use `StatCard` inside, apply token gradients
- `OwnerPropertySummaryCards.vue` — wrap with `DashboardCard`, token colors for occupancy bars
- `OwnerUpcomingBookings.vue` — wrap with `DashboardCard`
- `OwnerRecentActivity.vue` — wrap with `DashboardCard`, token timeline colors
- `OwnerCleaningStatus.vue` — wrap with `DashboardCard`, token chip colors
- `MaterioDataTable.vue` — update to consume tokens

## Per-Page Restyle Workflow

Repeatable playbook for restyling any page using all three MCPs:

### Phase 1: Capture Current State
1. **Chrome DevTools MCP** `take_screenshot()` — save as "before" baseline
2. **Chrome DevTools MCP** `take_snapshot()` — capture current DOM structure

### Phase 2: Read Design Intent
3. **Pencil MCP** `open_document("design/materio-vuetify.lib.pen")`
4. **Pencil MCP** `get_variables()` — extract design tokens
5. **Pencil MCP** `batch_get(filePath, patterns: [{reusable: true}])` — discover reusable components
6. **Pencil MCP** `get_screenshot(nodeId)` — screenshot components matching the target page

### Phase 3: Research Vuetify APIs
7. **Vuetify MCP** `get_component_api_by_version()` — confirm which props/slots absorb the Pencil style via tokens vs. which need wrappers

### Phase 4: Implement
8. Sync tokens — write/update `src/styles/tokens.css`
9. Update theme — modify `vuetify.ts` to reference token values
10. Create/update wrappers — only where needed
11. Update the page — swap stock Vuetify usage for wrappers where applicable

### Phase 5: Verify & Sync Back
12. **Chrome DevTools MCP** `take_screenshot()` — "after" screenshot
13. Compare before/after visually
14. If tokens changed: **Pencil MCP** `set_variables()` to sync back to .pen
15. **Pencil MCP** `get_screenshot()` — verify .pen still reflects code

## Git Workflow

### Branch
All restyle work happens on `feature/materio-restyle` branched from `main`.

### Commit Strategy
One commit per visual unit. Never batch multiple visual changes.

**Prefix convention:**
- `tokens:` — token file changes
- `theme:` — vuetify.ts theme config changes
- `wrapper:` — new or modified wrapper components
- `restyle:` — applying tokens/wrappers to a specific page/component
- `sync:` — two-way sync operations between .pen and tokens.css

**Rule:** Commit before moving to the next component. The workflow enforces "commit then proceed" at each step.

### Reverting
- Each commit is small enough to `git revert <sha>` cleanly
- Bad page restyle: revert the series of commits for that page
- Bad single component: revert only that component's commit
- Branch stays on `feature/materio-restyle` until satisfied, then merge to main

## Rollout Order

1. **Token foundation** — extract tokens, create `tokens.css`, wire `vuetify.ts`
2. **Wrapper components** — `DashboardShell`, `DashboardCard`, `StatCard`
3. **`owner/overview`** — the design DNA page; establishes patterns for everything else
4. **Owner properties page**
5. **Owner profile / other owner pages**
6. **Admin dashboard**
7. **Admin sub-pages**
8. **Auth pages** (login, register)
9. **Calendars (owner + admin)** — last, most complex, most custom CSS

## Success Criteria

- Every page visually matches the .pen file's intent
- `tokens.css` and .pen variables are in sync bidirectionally
- No hardcoded hex values in `vuetify.ts` or components — all reference tokens
- Existing functionality untouched — routing, stores, events, data all work
- `pnpm build` and `pnpm test:run` pass after each page restyle
- Every visual change is independently revertible via git

## Future: Skill Encoding

Once the workflow proves valuable across the full restyle, encode it as a Claude Code skill that triggers on "restyle [page] using .pen file" — automating the MCP orchestration, commit cadence, and verification steps. This is out of scope for the initial implementation.
