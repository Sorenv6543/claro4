# Claude — Claro App Review & Roadmap Prompt

> Paste into Claude Code, Cowork, or any Claude session with MCP tools connected.



## Project: Claro — Property Cleaning Scheduler
Multi-tenant app with two roles: Property Owners (30-40 clients) and Business Admin (1 user).

Stack: Vue 3 + Vite + Vuetify 4 (^4.0.1), Pinia stores (Map-based with TTL caching), Supabase (auth/Postgres/RLS/realtime), FullCalendar, PWA via vite-plugin-pwa.

## Recent changes (last 30 days — this is what I'm unsure about)

1. Admin user management refactor (this week): Singleton calendar state pattern, new Supabase composables (useSupabaseCleanerTeams, useSupabaseUserProfiles), new stores (cleanerTeam.ts, userProfile.ts), removed deprecated property create/edit pages.

## Data layer (the part I need verified)
Supabase composables: useSupabaseAuth, useSupabaseBookings, useSupabaseProperties, useSupabaseCleanerTeams, useSupabaseUserProfiles, useRealtimeSync
Pinia stores: auth, booking, property, ui, user, cleanerTeam, userProfile
Types: api.ts, booking.ts, property.ts, user.ts, team.ts, ui.ts, index.ts

## Design tooling
- Pencil.dev MCP connected — design files are version-controlled in design/ directory
- Existing file: design/materio-vuetify.lib.pen (Materio-inspired Vuetify component library)
- Pencil tools available: batch_design, batch_get, export_nodes, get_screenshot, get_variables, get_guidelines, snapshot_layout, find_empty_space_on_canvas
- Design-to-code workflow: design in Pencil → get_variables for design tokens → export_nodes for reference images → implement in Vue/Vuetify matching the design

## What I have access to
- Chrome DevTools MCP via remote debugging (can take screenshots, inspect DOM, read console/network, execute JS)
- Pencil.dev MCP for reading/creating designs, exporting assets, extracting design tokens
- Vuetify MCP for component API lookups
- Supabase MCP for running SQL and checking migrations/tables
- Full shell access (pnpm dev, pnpm build, pnpm test:run)

## Architecture rules
- Smart components (src/components/smart/): data-aware, use stores/composables
- Dumb components (src/components/dumb/): pure UI, props + events only — NEVER import stores
- Business logic centralized in src/utils/businessLogic.ts
- Role-separated trees: src/components/{smart,dumb}/{admin,owner,shared}/
- Path aliases: @components, @composables, @stores, @types, @utils
</context>

<task>
Perform a systematic health check of my app, then give me a concrete prioritized roadmap. Work through these phases IN ORDER:

## Phase 1: Backend ↔ Frontend Verification
Start the dev server (pnpm dev). For each of these data flows, verify end-to-end by checking the browser via Chrome DevTools:

1. Auth flow — Login, session persistence, role detection (isOwner/isAdmin), route guards redirecting correctly
2. Bookings — Fetch, create, update, delete. Verify realtime subscription fires on changes. Check that booking validation (validateBooking, detectBookingConflicts, calculateBookingPriority) works correctly with the UI
3. Properties — CRUD operations, color assignment, owner-scoped filtering
4. Admin user management — The NEW composables (useSupabaseCleanerTeams, useSupabaseUserProfiles) and stores (cleanerTeam.ts, userProfile.ts) — verify these actually fetch data and render in AdminCleaners, AdminPropertyOwners, AdminUsers pages
5. Realtime subscriptions — Verify useRealtimeSync establishes channels, check for subscription leaks on unmount

For each flow: take a screenshot, check the console for errors, check network requests for failed calls, and report what works and what is broken. Output a table:

| Flow | Status | Issues Found | Console Errors | Network Failures |
|------|--------|-------------|----------------|------------------|

## Phase 2: Type & Build Health
Run `pnpm build` (which runs vue-tsc --noEmit). Run `pnpm test:run`. Run `pnpm test:performance`. Report all failures with file paths and line numbers.

## Phase 3: UI Audit — Vuetify Depth & Responsiveness
After verifying the backend works, audit the current UI for:

1. **Flatness** — Identify pages/components that underuse Vuetify's design system. Look for: missing elevation, no use of v-card variants, raw HTML where Vuetify components exist, missing transitions, no loading states, no empty states, no skeleton loaders
2. **Responsiveness** — Check every page at mobile (375px), tablet (768px), and desktop (1440px) via Chrome DevTools. Flag layouts that break or waste space. Identify where Vuetify's `useDisplay` composable SHOULD be used but isn't — particularly for: conditional rendering of components by breakpoint, switching between mobile/desktop layouts, adjusting grid columns, hiding/showing navigation elements
3. **Missing Vuetify patterns** — Cross-reference against Vuetify 4 capabilities I'm not using: v-bottom-sheet for mobile actions, v-navigation-drawer responsive behavior, v-app-bar collapse/extend, v-banner for notifications, density prop adjustments per breakpoint, v-skeleton-loader during data fetches
4. **Design system alignment** — Open design/materio-vuetify.lib.pen via Pencil MCP. Use get_variables to extract design tokens (colors, spacing, typography). Use batch_get to list the reusable components in the library. Compare the Pencil design system against what's actually implemented in src/plugins/vuetify.ts and src/styles/. Flag mismatches between design tokens and code.

Output a prioritized list of UI improvements grouped by page, ordered by impact.

## Phase 4: Deployment Readiness Assessment
Based on everything above, tell me:
- What MUST be fixed before any deployment (blockers)
- What SHOULD be fixed but can ship without (polish)
- What can wait for v2 (backlog)
- Whether I should deploy the backend/auth flow first and iterate on UI, or wait until UI is further along

Give me a recommended deployment timeline with concrete milestones.
</task>

<constraints>
- Only make changes if I explicitly ask. This is an AUDIT — read-only unless something is actively crashing.
- Do NOT refactor or reorganize code during this review.
- Use the Chrome DevTools MCP to take real screenshots and read real console output — do not guess at UI state.
- Use the Vuetify MCP to look up any component API before recommending it — do not guess Vuetify 4 props.
- Use the Pencil MCP to read design files — do not guess at design tokens or component specs.
- Use the Supabase MCP to verify table schemas match TypeScript types if you find type mismatches.
- Check the existing 70+ dumb components in src/components/dumb/ before recommending new ones — many patterns already exist (SkeletonLoader, LoadingSpinner, ErrorAlert, etc.)
- After each phase, output: ✅ Phase N complete — [summary]. Wait for my go-ahead before starting the next phase.
</constraints>

<output_format>
For each phase: structured findings with specific file paths and line numbers.
Phase 3 must include a design token comparison table (Pencil values vs code values).
Final roadmap: numbered list grouped by priority tier (blocker / polish / backlog) with estimated effort per item (S/M/L).
Deployment recommendation: concrete timeline, not vague advice.
</output_format>
```
