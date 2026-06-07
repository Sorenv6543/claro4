<!-- refreshed: 2026-03-09 -->
# Architecture

**Analysis Date:** 2026-03-09

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                      UI Layer (Vue 3 + Vuetify)             │
├──────────────────┬──────────────────┬───────────────────────┤
│   Admin Pages    │   Owner Pages    │    Auth Pages         │
│  `src/pages/admin`│ `src/pages/owner`│   `src/pages/auth`    │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business & State Layer                    │
│         `src/stores`, `src/composables`, `src/utils`        │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Data Layer (Supabase / Postgres)                           │
│  `supabase/migrations`                                       │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Smart Components | Data-aware, orchestration logic, depends on stores/composables. | `src/components/smart/` |
| Dumb Components | Pure UI, receive props, and emit events. | `src/components/dumb/` |
| Stores | Domain state management with TTL caching. | `src/stores/` |
| Composables | Encapsulated logic for role-specific or shared features. | `src/composables/` |
| Business Logic | Centralized rules and validations. | `src/utils/businessLogic.ts` |

## Pattern Overview

**Overall:** Role-Based Clean Architecture

**Key Characteristics:**
- **Strict Role Separation:** Admin and Owner features are isolated in dedicated directories to prevent data leaks.
- **Smart/Dumb Component Pattern:** Separation of concerns between data fetching and UI rendering.
- **Optimistic Updates:** Immediate UI feedback with Supabase rollback logic.

## Layers

**UI Layer:**
- Purpose: Handles user interaction and data presentation.
- Location: `src/pages/`, `src/components/`, `src/layouts/`
- Contains: Vue components and layouts.
- Depends on: Business & State Layer.
- Used by: End users.

**Business & State Layer:**
- Purpose: Manages application state and business rules.
- Location: `src/stores/`, `src/composables/`, `src/utils/`
- Contains: Pinia stores, Vue composables, utility functions.
- Depends on: Data Layer (Supabase).
- Used by: UI Layer.

**Data Layer:**
- Purpose: Persistent storage and real-time synchronization.
- Location: `supabase/`
- Contains: Database migrations, RLS policies, Edge Functions.
- Depends on: N/A
- Used by: Business & State Layer.

## Data Flow

### Primary Request Path (Data Fetching)

1. Page/Smart Component (`src/pages/...`) invokes a store action or composable method.
2. Store/Composable (`src/stores/...`) calls the Supabase client (`src/plugins/supabase.ts`).
3. Supabase returns data; Store updates reactive state; UI re-renders automatically.

### Real-time Update Flow

1. Supabase broadcast/subscription detects a change in Postgres.
2. Listener in `src/plugins/supabase.ts` (or specific composable) receives the payload.
3. The relevant Pinia store is updated, triggering UI updates across all active components.

**State Management:**
- Pinia stores use `Map` collections for O(1) access.
- `cachedMapFilter.ts` implements TTL-based caching for performance.

## Key Abstractions

**Supabase Plugin:**
- Purpose: Singleton client for database and auth interaction.
- Examples: `src/plugins/supabase.ts`
- Pattern: Plugin / Service Locator.

**Role-Based Layouts:**
- Purpose: Provide different shells for Admin vs. Owner interfaces.
- Examples: `src/layouts/admin.vue`, `src/layouts/owner.vue`
- Pattern: Wrapper Component / Slot pattern.

## Entry Points

**Main Application:**
- Location: `src/main.ts`
- Triggers: Browser page load.
- Responsibilities: Initializes Vue, Pinia, Router, Vuetify, and Sentry.

**App Root:**
- Location: `src/App.vue`
- Triggers: Vue app mount.
- Responsibilities: Dynamic layout resolution and global visual elements (Aurora blobs).

## Architectural Constraints

- **Threading:** Single-threaded (JavaScript event loop).
- **Global state:** Managed exclusively via Pinia stores to avoid side effects.
- **Circular imports:** Avoided via intelligent manual chunking in `vite.config.ts`.
- **Role Isolation:** Admin logic must never be imported into Owner components.

## Anti-Patterns

### Logic Duplication

**What happens:** Business rules (e.g., booking validation) implemented directly in multiple components.
**Why it's wrong:** Increases maintenance burden and risk of inconsistency.
**Do this instead:** Use helpers in `src/utils/businessLogic.ts`.

### Heavy Page Components

**What happens:** Large page files containing both orchestration and deep UI logic (e.g., `OwnerOverview.vue`).
**Why it's wrong:** Hard to test and maintain; violates SRP (Single Responsibility Principle).
**Do this instead:** Extract UI logic into Dumb components and orchestration into Composables.

## Error Handling

**Strategy:** Centralized handling with Sentry integration.

**Patterns:**
- `useErrorHandler.ts` for consistent UI error reporting and retries.
- Global `beforeEach` router guards for auth and session validation.

## Cross-Cutting Concerns

**Logging:** Sentry integration for production; console hints in development.
**Validation:** Centralized in `src/utils/businessLogic.ts`.
**Authentication:** Managed via Supabase Auth with persistence in local storage.

---

*Architecture analysis: 2026-03-09*
