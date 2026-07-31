# Claro4 Owner-Side Refactor & Cleanup Plan

> **For Hermes:** Use GSD workflow structure. Load the `plan` and `subagent-driven-development` skills. Use `delegate_task` for each phase with full context.

**Goal:** Purge Materio remnants, remove deprecated skills, simplify Owner UI, extract shareable patterns for Admin reuse.

**Architecture:** This is a pure cleanup/simplification phase — no new features, no new routes. Delete dead code, consolidate existing components, update documentation, port knowledge to Obsidian vault.

**Tech Stack:** Vue 3 + Vite + Vuetify 4 + Pinia + TypeScript + Vitest

---

## Phase 0: GSD Initialization

### Task 0.1: Initialize GSD tracking

**Objective:** Set up GSD phase tracking so progress is visible.

**Files:**
- Create: `.serena/STATE.md` (update)
- Modify: `AGENTS.md` (create if not exists)

**Step 1: Check GSD state**

Run: `ls -la .serena/`
Expected: project.yml exists, STATE.md may not

**Step 2: Create AGENTS.md**

```markdown
# Claro4 — AI Agent Guide

This project uses a GSD (Get Stuff Done) workflow for feature planning and execution.

## Current Phase: Owner-Side Refactor
Goal: Purge Materio, remove dead code, simplify Owner UI, extract shared patterns.

See `.hermes/plans/2026-06-08_095900-claro4-owner-refactor.md` for full plan.

## Key References
- `CLAUDE.md` — Full project guide
- `DESIGN.md` — Bento/glassmorphism design system
- `/root/obsidian-vault/` — Codebase knowledge & decisions
```

**Step 3: Commit**

```bash
git add .serena/STATE.md AGENTS.md
git commit -m "chore: init GSD phase for owner-side refactor"
```

---

## Phase 1: Remove Dead Code

### Task 1.1: Delete orphaned DashboardShowcase and all Dashboard*Card components

**Objective:** Remove `DashboardShowcase.vue` and all 10 `Dashboard*Card.vue` components. These were Materio-era leftovers and DashboardShowcase is not imported by any route or component.

**Files to delete:**
- `src/components/smart/shared/DashboardShowcase.vue`
- `src/components/dumb/shared/DashboardAwardCard.vue`
- `src/components/dumb/shared/DashboardCard.vue`
- `src/components/dumb/shared/DashboardDepositWithdrawCard.vue`
- `src/components/dumb/shared/DashboardEarningsCard.vue`
- `src/components/dumb/shared/DashboardSalesCard.vue`
- `src/components/dumb/shared/DashboardShell.vue`
- `src/components/dumb/shared/DashboardStatMiniCard.vue`
- `src/components/dumb/shared/DashboardTransactionsCard.vue`
- `src/components/dumb/shared/DashboardUserRolesTable.vue`
- `src/components/dumb/shared/DashboardWeeklyOverview.vue`

**Step 1: Verify DashboardShowcase has zero imports**

Run: `grep -rn 'DashboardShowcase' src/ --include='*.ts' --include='*.vue' | grep -v node_modules`
Expected: Only the file's own `defineOptions({ name: 'DashboardShowcase' })` line.

**Step 2: Delete all 11 files**

```bash
rm src/components/smart/shared/DashboardShowcase.vue
rm src/components/dumb/shared/DashboardAwardCard.vue
# ... (all 10)
```

**Step 3: Check if DashboardCard is used in AdminReports.vue**

Run: `grep 'DashboardCard' src/components/smart/admin/AdminReports.vue`
Expected: AdminReports.vue uses `<DashboardCard>` — this needs replacing with a simple v-card or local card component.

**Step 4: Replace DashboardCard usage in AdminReports.vue**

Replace:
```vue
<DashboardCard icon="mdi-chart-line" title="Business Analytics Dashboard">
```
With:
```vue
<v-card class="bg-surface rounded-xl" variant="flat">
  <v-card-title class="d-flex align-center gap-2 text-body-1 font-weight-bold">
    <v-icon start>mdi-chart-line</v-icon>
    Business Analytics Dashboard
  </v-card-title>
  <v-card-text>
```

(Repeat for all 3 DashboardCard usages in AdminReports.vue)

**Step 5: Run build to confirm nothing breaks**

Run: `pnpm build:fast`
Expected: Build succeeds (DashboardShowcase and children were already dead code).

**Step 6: Commit**

```bash
git add -A
git commit -m "chore: remove orphaned Materio Dashboard components and DashboardShowcase"
```

### Task 1.2: Remove .bak files

**Objective:** Clean up stale backup files.

**Files to delete:**
- `src/pages/admin/dashboard.vue.bak`
- `src/pages/owner/calendar..bak`
- `src/plugins/supabase-plugin-config.ts.bak`

**Step 1: Delete**

```bash
rm src/pages/admin/dashboard.vue.bak src/pages/owner/calendar..bak src/plugins/supabase-plugin-config.ts.bak
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove stale .bak files"
```

### Task 1.3: Remove crud-testing.vue

**Objective:** Remove leftover dev/testing page.

**Files to delete:**
- `src/pages/crud-testing.vue`

**Step 1: Check if it's routed**

Run: `grep -rn 'crud-testing' src/router/`
Expected: No route references (or if there is, remove the route entry too).

**Step 2: Delete**

```bash
rm src/pages/crud-testing.vue
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove dev-only crud-testing page"
```

### Task 1.4: Clean stale Materio comments from codebase

**Objective:** Materio theme is already removed (commit `2041804`). Just clean the stale comments referencing it.

**Files to modify:**
- `src/utils/constants.ts` — 3 comment blocks reference Materio
- `src/layouts/admin.vue` — 2 comment blocks reference Materio style
- `src/plugins/chartjs.ts` — 2 comment blocks + JSDoc
- `src/__tests__/components/admin/AdminTimelineCard.spec.ts` — 1 comment
- `src/__tests__/components/owner/OwnerNavigationDrawer.spec.ts` — 1 comment

**Step 1: Fix constants.ts**

Replace:
```
 * 5 user-selectable property colors (Claude Design v1 / Materio palette).
```
With:
```
 * 5 user-selectable property colors.
```

Replace:
```
/** A property color from the current Claude Design v1 / Materio palette. */
```
With:
```
/** A property color from the current palette. */
```

Replace:
```
 * no Materio-equivalent teal exists in PROPERTY_COLORS. Migration is a
 *    Materio replacement.
```
With:
```
 * teal exists in PROPERTY_COLORS.
```

**Step 2: Fix admin.vue layout**

Replace `<!-- Right-side nav icons (Materio style) -->` with `<!-- Right-side nav icons -->`
Replace `/* Materio-style app bar icons */` with `/* App bar icons */`

**Step 3: Fix chartjs.ts**

Replace Materio references with generic descriptions.

**Step 4: Fix test comments**

Replace Materio references with neutral descriptions.

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove stale Materio comments from codebase"
```

---

## Phase 2: Audit & Cleanup .claude Skills

### Task 2.1: Audit all 15 skills for staleness

**Objective:** Determine which skills reference deprecated APIs or outdated workflows.

**Skills to audit:**
1. `check-schema-sync` — Created Mar 6, 2026. 2+ months old. Deprecated if Supabase schema has changed.
2. `claro-design` — Updated Jun 5, 2026. Recent — likely current.
3. `claro4-business-logic` — Created May 3, 2026. **References deprecated functions `getCleaningWindow` and `canScheduleCleaning`** per CLAUDE.md.
4. `claro4-typescript` — May 3, 2026. May be stale.
5. `claro4-vuetify` — May 3, 2026. May reference old Vuetify 4 patterns.
6. `cls-debugging` — Mar 19, 2026. Debugging skill — likely fine.
7. `console-error-triage` — Mar 19, 2026. Debugging — fine.
8. `db-migration` — Mar 6, 2026. Migration workflow — may be stale.
9. `memory-leak-detection` — Mar 19, 2026. Debugging — fine.
10. `new-component` — Mar 6, 2026. Scaffolding — likely fine.
11. `performance-audit` — Mar 19, 2026. Debugging — fine.
12. `run-claro4` — May 28, 2026. Recent — likely current.
13. `spa-route-performance` — Mar 19, 2026. Debugging — fine.
14. `supabase-postgres-best-practices` — Apr 27, 2026. Third-party content — fine.
15. `supabase` — Apr 27, 2026. Third-party content — fine.

**Step 1: Read each skill's SKILL.md**

For skills 3, 4, 5, 8 specifically — read their SKILL.md to check for deprecated references.

**Step 2: Categorize each skill**

- **KEEP** (current): claro-design, cls-debugging, console-error-triage, memory-leak-detection, new-component, performance-audit, run-claro4, spa-route-performance, supabase, supabase-postgres-best-practices
- **UPDATE** (deprecated content): claro4-business-logic (fix deprecated function refs), claro4-typescript (verify), claro4-vuetify (verify)
- **DELETE** (stale/prune): check-schema-sync (no migration tooling in this project), db-migration (check if still relevant)

### Task 2.2: Update claro4-business-logic skill

**Objective:** Remove references to deprecated `getCleaningWindow` and `canScheduleCleaning`.

**Files:**
- Modify: `.claude/skills/claro4-business-logic/SKILL.md`

**Step 1: Read current skill**

Run: `cat .claude/skills/claro4-business-logic/SKILL.md`

**Step 2: Replace deprecated function references**

Search for `getCleaningWindow` and `canScheduleCleaning` in the skill. Replace with the current approach (the `cleaning_window` metadata from `BookingWithMetadata`).

**Step 3: Commit**

```bash
git add .claude/skills/claro4-business-logic/SKILL.md
git commit -m "docs: remove deprecated function refs from claro4-business-logic skill"
```

### Task 2.3: Remove or merge stale skills

**Objective:** If check-schema-sync and db-migration are unused, remove them.

**Step 1: Check if they're referenced in CLAUDE.md or elsewhere**

Run: `grep -rn 'check-schema-sync\|db-migration' . --include='*.md' --include='*.json' | grep -v node_modules`

**Step 2: Delete if unreferenced**

```bash
rm -rf .claude/skills/check-schema-sync
rm -rf .claude/skills/db-migration
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove unused skills (check-schema-sync, db-migration)"
```

---

## Phase 3: Simplify Owner Side

### Task 3.1: Audit Owner pages for unused/duplicate components

**Objective:** Review the Owner component tree and identify consolidation opportunities.

**Owner pages (7):**
- `/owner/overview` → `pages/owner/overview/index.vue` → uses `OwnerOverview.vue`
- `/owner/calendar` → `pages/owner/calendar/index.vue` → uses `OwnerCalendar.vue`
- `/owner/bookings` → `pages/owner/bookings/index.vue` → uses `OwnerBookings.vue`
- `/owner/properties` → `pages/owner/properties/index.vue` → uses `OwnerProperties.vue`
- `/owner/properties/:id` → `pages/owner/properties/view.vue` → uses `OwnerPropertyView.vue`, `OwnerPropertyTimeline.vue`
- `/owner/reports` → `pages/owner/reports/index.vue` → uses `Reports.vue` (shared)
- `/owner/settings` → `pages/owner/settings/index.vue` → uses `OwnerSettings.vue`

**Smart components (12):**
- OwnerOverview.vue, OwnerCalendar.vue, OwnerCalendarBoldSplit.vue, OwnerCalendarpen.vue
- OwnerBookings.vue, OwnerProperties.vue, OwnerPropertyView.vue, OwnerPropertyTimeline.vue
- OwnerSettings.vue, OwnerNavigationDrawer.vue, GlobalBookingModal.vue

**Dumb components (32):**
- BookingStatsCard, CalendarNavPill, MobileTimelineFeed, OwnerBandGrid
- OwnerBookingForm, OwnerBookingInlay, OwnerBookingList, OwnerCalendarControls
- OwnerChart, OwnerChartGallery, OwnerCleaningStatus, OwnerDayBar
- OwnerDayViewBottomSheet, OwnerDetailCard, OwnerMapAnchoredList, OwnerMiniCalendar
- OwnerPropertyForm, OwnerPropertySummaryCards, OwnerQuickActions
- OwnerRecentActivity, OwnerUpcomingBookings, OwnerUrgentTurnsBanner
- OwnerWelcomeBanner, PropertyAccessSection, PropertyCleaningSection
- PropertyColorPicker, PropertyContactSection, PropertyInfoSection
- PropertyList, PropertyPhotosSection, PropertySectionCard, TurnBookingDialog

**Step 1: Check which dumb components are actually imported**

Run: `for f in src/components/dumb/owner/*.vue; do name=$(basename $f .vue); count=$(grep -rl "$name" src/components/ src/pages/ --include='*.vue' --include='*.ts' | grep -v node_modules | wc -l); if [ "$count" -le 1 ]; then echo "UNUSED: $name (imported $count times)"; fi; done`

**Step 2: Check OwnerCalendarBoldSplit and OwnerCalendarpen — these look like stale variants**

Run: `grep -rn 'OwnerCalendarBoldSplit\|OwnerCalendarpen' src/ --include='*.vue' --include='*.ts'`

**Step 3: Report findings**

List which Owner components are:
- Actually used by routes
- Orphaned (not imported anywhere)
- Potential duplicates (two calendar variants, etc.)

### Task 3.2: Consolidate Owner calendar components

**Objective:** If OwnerCalendarBoldSplit and OwnerCalendarpen are unused variants, remove them. Keep only `OwnerCalendar.vue`.

**Files to potentially delete:**
- `src/components/smart/owner/OwnerCalendarBoldSplit.vue`
- `src/components/smart/owner/OwnerCalendarpen.vue`

**Step 1: Verify unused status**

Run: `grep -rn 'OwnerCalendarBoldSplit\|OwnerCalendarpen' src/ --include='*.vue' --include='*.ts' | grep -v node_modules`

**Step 2: Delete if orphaned**

```bash
rm src/components/smart/owner/OwnerCalendarBoldSplit.vue src/components/smart/owner/OwnerCalendarpen.vue
```

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: remove unused Owner calendar variants, keep OwnerCalendar.vue"
```

### Task 3.3: Identify shared patterns between Owner and Admin

**Objective:** Document components/composables that Owner uses but Admin could reuse.

**Potential shared patterns to note (don't implement yet):**

| Owner Component | Admin Equivalent | Reuse Potential |
|---|---|---|
| `OwnerCalendar.vue` | `AdminCalendar.vue` | Different data sources but same FullCalendar setup |
| `OwnerBookingForm.vue` | `AdminBookingForm.vue` | Different roles, same booking fields |
| `OwnerPropertyForm.vue` | (none in admin) | Admin could use for property editing |
| `OwnerOverview.vue` | `AdminOverview.vue` | Different data but similar timeline layout |
| `PropertyColorPicker.vue` | (shared already) | Already in dumb/shared |
| `PropertySectionCard.vue` | (shared already) | Already tested |
| `TurnBookingDialog.vue` | `AdminBookingForm.vue` (turn section) | Could be extracted to shared |

**Step 1: Create a cross-reference file**

Write: `docs/cross-role-reuse.md` with the above table, plus notes on what would need to change.

### Task 3.4: Remove unused Owner dumb components

**Objective:** Delete any Owner dumb components that are not imported by any smart component or page.

**Step 1: For each orphan found in Task 3.1, delete it**

```bash
# Example — adjust based on actual findings
rm src/components/dumb/owner/UnusedComponent.vue
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove unused Owner dumb components"
```

---

## Phase 4: Document in Obsidian Vault

### Task 4.1: Create project knowledge base in Obsidian

**Objective:** Port key codebase knowledge to Obsidian vault so it's accessible across AI agents.

**Files to create in `/root/obsidian-vault/`:**
- `claro4/Overview.md` — Project overview, tech stack, architecture
- `claro4/Owner-Side.md` — Owner routes, components, data flow
- `claro4/Admin-Side.md` — Admin routes, components, data flow
- `claro4/Design-System.md` — Bento/glassmorphism design
- `claro4/Supabase-Schema.md` — Database schema, RLS policies
- `claro4/Deprecated.md` — What was removed and why (for history)

**Step 1: Create directory structure**

```bash
mkdir -p /root/obsidian-vault/claro4
```

**Step 2: Write each knowledge doc**

Extract from CLAUDE.md, DESIGN.md, PRODUCT.md, and router configs.

**Step 3: Commit obsidian vault**

```bash
cd /root/obsidian-vault
git add -A
git commit -m "feat: add claro4 project knowledge base"
```

### Task 4.2: Update CLAUDE.md to point to Obsidian

**Objective:** Add a reference in CLAUDE.md so Claude knows to look in Obsidian for extended knowledge.

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Add reference section**

```markdown
## Knowledge Base

Extended project documentation is maintained in the Obsidian vault at `/root/obsidian-vault/claro4/`:
- `Overview.md` — Project architecture and tech stack
- `Owner-Side.md` — Owner UI components and data flow
- `Admin-Side.md` — Admin UI components and data flow
- `Design-System.md` — Bento/glassmorphism design reference
- `Supabase-Schema.md` — Database tables, views, RLS
- `Deprecated.md` — History of removed/refactored code
```

**Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: add Obsidian vault reference to CLAUDE.md"
```

---

## Phase 5: GSD Phase Wrap-up

### Task 5.1: Run full test suite

**Objective:** Verify nothing is broken.

**Step 1: Run tests**

Run: `pnpm test:run`
Expected: 442+ tests passing (some may change based on deletions).

**Step 2: Run build**

Run: `pnpm build:fast`
Expected: Build succeeds.

### Task 5.2: Push to GitHub

**Objective:** Sync the VPS changes with GitHub.

**Step 1: Push**

```bash
cd /root/claro4
git push origin main
```

**Step 2: Push obsidian vault**

```bash
cd /root/obsidian-vault
git push origin main
```

### Task 5.3: Update GSD state

**Objective:** Mark phase as complete.

**Files:**
- Modify: `.serena/STATE.md`

Mark the refactor phase as complete and note what was achieved.

---

## Risks & Tradeoffs

| Risk | Mitigation |
|------|------------|
| DashboardCard removal may break AdminReports.vue | Task 1.1 Step 4 handles the replacement |
| Deleting components that seem unused but are dynamically imported | Task 3.1 Step 1 verifies actual import count |
| Obsidian vault notes get stale | They're extracted from CLAUDE.md which is already maintained |
| Deleting calendar variants that are the actual active route component | Task 3.2 Step 1 checks route references first |

## Open Questions

- [ ] Should we keep `claro4-typescript` and `claro4-vuetify` skills or just reference the MCP servers directly?
- [ ] Is `OwnerNavigationDrawer` used correctly? It's a smart component but navigation drawers are typically presentational.
- [ ] `GlobalBookingModal.vue` — is this used? Need to check.
- [ ] What about the `owner.vue` layout file?

## Verification Checklist

- [ ] `pnpm test:run` — all tests pass
- [ ] `pnpm build:fast` — build succeeds
- [ ] Owner routes all still load (overview, calendar, bookings, properties, reports, settings)
- [ ] Obsidian vault has all 6 docs
- [ ] CLAUDE.md references vault
- [ ] .bak files gone
- [ ] crud-testing.vue gone
- [ ] Dashboard*Card components gone
- [ ] AdminReports.vue still renders correctly
- [ ] Stale skill content updated
- [ ] Materio comments removed from all 5 files
- [ ] Git pushed to both repos
