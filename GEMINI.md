# GEMINI.md

## Project Overview
**BookingApp v89** is a multi-tenant property cleaning scheduler designed for property cleaning businesses. It features a role-based architecture serving two distinct user types:
- **Property Owners:** Manage their own properties and bookings (mobile-optimized).
- **Business Admin:** System-wide operations, cleaner management, and analytics.

### Core Tech Stack
- **Frontend:** Vue 3 (Composition API) + TypeScript + Vite
- **UI Framework:** Vuetify 3 (Material Design, auto-imported)
- **State Management:** Pinia with **Map-based collections** (`Map<string, T>`) for O(1) lookups.
- **Calendar:** FullCalendar (Vue 3 integration)
- **Backend/Auth:** Supabase (PostgreSQL, Auth, Realtime Sync)
- **PWA:** `vite-plugin-pwa` (active only in production)
- **Testing:** Vitest + Vue Test Utils + Happy DOM

---

## Architecture & Conventions

### 1. Role-Based Separation
The project maintains a strict separation between **Owner** and **Admin** roles at every layer:
- **Composables:** `src/composables/owner/` (filters by `owner_id`) vs `src/composables/admin/` (no filtering). Shared logic in `src/composables/shared/`.
- **Components:** 
    - **Smart:** (Logic-heavy) in `src/components/smart/{owner,admin}/`.
    - **Dumb:** (Presentational) in `src/components/dumb/{owner,admin,shared}/`.
- **Pages/Layouts:** Separate directories and layout files (`admin.vue`, `owner.vue`).
- **Constraint:** Do NOT create generic components with role props. Create role-specific components that use shared dumb components.

### 2. State Management (Map-Based)
All Pinia stores (`src/stores/`) use `Map<string, T>` instead of arrays. 
- Use Map methods (`.has()`, `.get()`, `.set()`, `.delete()`).
- Convert to arrays only when required by the UI.
- Filtered views are typically cached with a 10-second TTL.

### 3. "Turns" & Business Logic
"Turns" are same-day turnovers (checkout and checkin on the same day).
- Core logic resides in `src/utils/businessLogic.ts`.
- Handles priority calculation, cleaning windows, and conflict detection.

### 4. Supabase & Auth
- **Client:** Configured in `src/plugins/supabase.ts` (PKCE flow).
- **Auth Store:** `src/stores/auth.ts` manages user state and role-based access.
- **RLS:** Enforced at the database level.

---

## Key Commands

### Development
```bash
pnpm run dev                # Start dev server (http://localhost:3000)
pnpm run lint               # Run ESLint with auto-fix
```

### Build & Production
```bash
pnpm run build:production    # Full production build
pnpm run build:owner-only    # Owner-specific build (~800KB)
pnpm run build:admin-only    # Admin-specific build (~1.1MB)
pnpm run preview             # Preview production build
```

### Testing
```bash
pnpm run test               # Vitest watch mode
pnpm run test:run           # Single test run
pnpm run test:coverage      # Run tests with coverage
pnpm run test:performance   # Performance regression tests
```

---

## Development Guidelines

- **Path Aliases:** Use `@/` for `src/`, and specific aliases like `@components`, `@composables`, `@stores`, etc.
- **Naming:** 
    - Owner-specific: `Owner` prefix (e.g., `OwnerSidebar.vue`).
    - Admin-specific: `Admin` prefix (e.g., `AdminSidebar.vue`).
    - Shared: No prefix.
- **Type Safety:** Ensure all new code is fully typed. Tests are located in `src/__tests__/`.
- **API Calls:** Always use composables; never call Supabase or APIs directly from components.
- **Routing:** Define routes in `src/router/index.ts` using `meta.layout` and `meta.role`.
- **PWA:** manifest and service worker logic are production-only. Manifest is at `public/manifest.webmanifest`.

---

## Key Files for Reference
- `CLAUDE.md`: High-level procedural guidance for AI agents.
- `src/utils/businessLogic.ts`: Core scheduling and "turn" logic.
- `src/stores/auth.ts`: Authentication and role state.
- `vite.config.ts`: Build and chunking configuration.
- `docs/`: Extensive project documentation (API, Deployment, Architecture).
