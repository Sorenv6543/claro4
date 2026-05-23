# GEMINI.md

## Project Overview

**Claro (BookingApp v89)** is a multi-tenant property cleaning scheduler designed for short-term rental owners and cleaning business administrators. It provides role-based interfaces to manage guest bookings and cleaning operations effectively.

### Key Roles
- **Property Owners (30-40 clients):** Focus on property/booking management via a mobile-optimized, fast-orientation interface.
- **Business Admin (1-2 users):** System-wide operational management, cleaner scheduling, and dispatch via a data-dense desktop interface.

### Tech Stack
- **Frontend:** Vue 3 (Composition API) + TypeScript + Vite
- **UI Framework:** Vuetify 4 (Material Design) + SCSS
- **State Management:** Pinia (Map-based collections with TTL caching)
- **Backend:** Supabase (Auth, Postgres, RLS, Realtime)
- **Calendar:** FullCalendar
- **PWA:** Vite PWA with role-based chunking
- **Testing:** Vitest + Vue Test Utils + Playwright (E2E)
- **Monitoring:** Sentry (Error tracking + Profiling)

---

## Architecture & Conventions

### Directory Structure
The project enforces strict role separation across the codebase:
- `src/components/{smart,dumb}/{admin,owner,shared}/`
- `src/composables/{admin,owner,shared,supabase}/`
- `src/pages/{admin,owner,auth}/`
- `src/layouts/` (Role-specific layouts: `admin.vue`, `owner.vue`)
- `src/stores/` (Domain stores: `auth.ts`, `booking.ts`, `property.ts`, etc.)
- `src/utils/` (Centralized business logic and helpers)

### Component Patterns
- **Smart Components:** Data-aware, orchestration logic, depend on stores/composables.
- **Dumb Components:** Pure UI, receive props, and emit events.
- **Radius Rule:** 2px (`rounded="sm"`) for all containers (cards, dialogs, drawers); Pill (`rounded="pill"`) for interactive elements (buttons, chips, badges).

### State Management
- Use `Map` collections in stores for O(1) access.
- Implement TTL-based caching for filtered views using `src/utils/cachedMapFilter.ts`.
- Prefer derived computed values over array cloning.
- Business logic (rules, priority, conflicts) MUST live in `src/utils/businessLogic.ts`.

### TypeScript & Types
- Strict TypeScript is enforced (`vue-tsc --noEmit` on build).
- Keep `src/types/` in sync with Supabase migrations.
- Use `src/utils/typeHelpers.ts` for safe data conversion.

---

## Building and Running

### Development
```bash
pnpm install    # Install dependencies
pnpm dev        # Start dev server (http://localhost:3000)
```
*Requires `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.*

### Production Build
```bash
pnpm build                  # Full production build
pnpm build:owner-only       # Build only owner interface
pnpm build:admin-only       # Build only admin interface
pnpm build:fast             # Skip type checking (dev only)
```

### Testing & Quality
```bash
pnpm test                   # Run tests (watch mode)
pnpm test:run               # Run tests once
pnpm test:coverage          # Run tests with coverage
pnpm test:performance       # Run performance regression tests
pnpm lint                   # Lint with ESLint auto-fix
```

---

## Development Guidelines

1. **Role Separation:** Never leak admin-only data or logic into owner-specific components/composables.
2. **Business Logic:** Call helpers in `src/utils/businessLogic.ts` instead of duplicating rules in components (e.g., `calculateBookingPriority`, `validateBooking`).
3. **Optimistic Updates:** Implement optimistic UI updates with rollback logic in stores/composables for a responsive feel.
4. **UI/UX Consistency:** Adhere to the "Control Room" aesthetic. Studio Violet (#7367F0) is the ONLY accent color. Use semantic colors (Green/Amber/Coral/Cyan) strictly for operational status.
5. **Performance:** Clean up subscriptions/watchers on unmount. Monitor store size and filter performance using `pnpm test:performance`.
6. **Git Flow:** Never stage or commit changes unless explicitly requested. Review recent commits for style.

---

## References
- **`PRODUCT.md`**: Business goals and target users.
- **`DESIGN.md`**: Detailed design system and UI rules.
- **`CLAUDE.md`**: Detailed developer instructions and command reference.
- **`docs/references/`**: Technical guides for Vuetify, Supabase, and Business Logic.
