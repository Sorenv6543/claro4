# Codebase Concerns

**Analysis Date:** 2026-03-09

## Tech Debt

**Large Monolithic Components:**
- Issue: Several components exceed 1000 lines, mixing UI, orchestration, and business logic.
- Files: `src/components/smart/owner/OwnerOverview.vue` (1735 lines), `src/components/smart/admin/PerformanceMetricsDashboard.vue` (1031 lines), `src/components/dumb/shared/PropertyModal.vue` (1016 lines).
- Impact: Increased cognitive load, difficult to test, and prone to regressions during modification.
- Fix approach: Extract logic into composables and split UI into smaller, reusable dumb components.

**Missing Feature Implementations (TODOs):**
- Issue: Significant features are marked as TODO across the codebase.
- Files: `src/components/smart/admin/AdminReports.vue` (export logic), `src/composables/shared/usePushNotifications.ts` (server integration), `src/router/guards.ts` (loading state).
- Impact: Incomplete user workflows and missing operational visibility.
- Fix approach: Prioritize and implement the missing logic, starting with critical infrastructure like loading states and push notifications.

**Mocked Infrastructure in Production Code:**
- Issue: Hardcoded values or "replace with Supabase query" comments found in source files.
- Files: `src/composables/admin/useCleanerManagement.ts` (PR #28 ref).
- Impact: Logic may not reflect real production data patterns once migrated.
- Fix approach: Replace mocks with actual Supabase queries and verify with real data.

## Security Considerations

**Role Leakage Risk:**
- Risk: Potential for Admin-only logic or data to be inadvertently imported into Owner-facing components.
- Files: `src/pages/owner/`, `src/composables/owner/`.
- Current mitigation: Role-based directory structure and manual chunking in Vite.
- Recommendations: Implement automated linting rules (e.g., `eslint-plugin-import`) to prevent cross-role imports.

**Client-side Data Filtering:**
- Risk: Sensitive data might be filtered on the client instead of the server (Supabase RLS).
- Files: `src/stores/`, `src/utils/cachedMapFilter.ts`.
- Current mitigation: Reliance on Supabase RLS policies.
- Recommendations: Audit all `select('*')` queries to ensure only necessary columns are fetched.

## Performance Bottlenecks

**Large Vue Bundle:**
- Problem: The primary bundle size is growing due to heavy libraries like FullCalendar and Vuetify.
- Files: `vite.config.ts` (manualChunks).
- Cause: Inclusion of multiple FullCalendar plugins and the entire Vuetify library.
- Improvement path: Optimize imports and ensure tree-shaking is fully effective; continue leveraging role-based chunking.

**Store Memory Consumption:**
- Problem: `Map` collections in stores with TTL caching may grow large over long sessions.
- Files: `src/stores/`, `src/utils/cachedMapFilter.ts`.
- Cause: Retaining large sets of booking or property data in memory.
- Improvement path: Monitor store sizes and implement a maximum entry limit for the cache.

## Fragile Areas

**Router Guards & Auth Flow:**
- Files: `src/router/guards.ts`, `src/composables/supabase/useSupabaseAuth.ts`.
- Why fragile: Critical for security and user experience; complex async dependencies between Supabase session and UI state.
- Safe modification: Thorough integration testing required for any change to the auth lifecycle.
- Test coverage: Gaps in edge-case session expiry and refresh logic.

## Test Coverage Gaps

**Edge Case Auth Logic:**
- What's not tested: Session recovery, multi-tab sync, and role-switch scenarios.
- Files: `src/plugins/supabase.ts`, `src/router/guards.ts`.
- Risk: Users might experience broken sessions or incorrect access levels.
- Priority: High.

**Real-time Synchronization:**
- What's not tested: UI consistency when multiple concurrent database updates occur via Supabase Realtime.
- Files: `src/stores/booking.ts`, `src/plugins/supabase.ts`.
- Risk: Stale or inconsistent data shown to users.
- Priority: Medium.

---

*Concerns audit: 2026-03-09*
