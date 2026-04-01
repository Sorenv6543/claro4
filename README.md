# Property Cleaning Scheduler

> Multi-tenant property cleaning scheduler with role-based Owner/Admin UI.
> Built with Vue 3, Vuetify 4, Pinia, Supabase, and FullCalendar.

---

## Overview

A web application for property cleaning businesses managing multiple clients. Two distinct user types are served through separate, optimized interfaces:

- **Property Owners** (30-40 clients): Personal property and booking management, calendar views, turn alerts
- **Business Admin** (1 user): System-wide operations, cleaner team management, cross-client scheduling

### Key Features

- **Role-Based Interfaces** — Separate optimized UIs for owners vs admin with role-based code splitting
- **Turn Priority System** — Same-day turnovers with automatic prioritization (urgent/high/normal/low)
- **Cleaner Team Management** — Team creation, assignment, and scheduling tools
- **Real-Time Updates** — Supabase realtime subscriptions for cross-role data sync
- **PWA Support** — Installable app with offline caching via Workbox (StaleWhileRevalidate for chunks, NetworkFirst for API, CacheFirst for images)
- **Multi-Tenant Architecture** — Row-level security with Supabase, data isolation per owner

---

## Quick Start

### Prerequisites

- **Node.js** 18+
- **pnpm** 10+ (`packageManager` field enforces `pnpm@10.32.1`)
- **Supabase** project with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`

### Installation

```bash
git clone <repo-url>
cd property-cleaning-scheduler

pnpm install
pnpm dev
```

### Scripts

```bash
# Development
pnpm dev                    # Start dev server (port 3000, --host)

# Production Builds
pnpm build                  # Full build (runs vue-tsc --noEmit first)
pnpm build:fast             # Skip type checking for quick iteration
pnpm build:owner-only       # Owner interface only
pnpm build:admin-only       # Admin interface only
pnpm build:pwa              # Build with PWA manifest optimization

# Testing
pnpm test                   # Vitest in watch mode
pnpm test:run               # Run tests once
pnpm test:coverage          # Run with coverage
pnpm test:performance       # Performance regression tests

# Quality
pnpm lint                   # ESLint with auto-fix

# Analysis
pnpm analyze:bundle         # Bundle size analysis
pnpm perf:analysis          # Bundle analysis + regression tests
```

---

## Architecture

### Role-Based Component Structure

```
src/
├── components/
│   ├── dumb/                    # Pure UI — props in, events out
│   │   ├── shared/   (25)       # Cross-role: BookingForm, ConfirmationDialog, MaterioDataTable, etc.
│   │   ├── owner/    (19)       # OwnerBookingForm, PropertyForms, OwnerCalendarControls
│   │   └── admin/    (26)       # AdminBookingForm, CleanerAssignmentModal, UrgentTurnsCard
│   └── smart/                   # Data-aware orchestrators
│       ├── shared/
│       ├── owner/
│       └── admin/
├── composables/
│   ├── shared/                  # useCalendarState, usePerformanceMonitor, usePWA, etc.
│   ├── owner/                   # useOwnerBookings, useOwnerProperties, useOwnerCalendarState
│   ├── admin/                   # useAdminBookings, useCleanerManagement, useTimeAwareMode
│   └── supabase/                # useSupabaseAuth, useSupabaseBookings, useRealtimeSync
├── pages/
│   ├── owner/                   # dashboard, bookings, calendar, properties, profile, settings
│   ├── admin/                   # dashboard, schedule, properties, bookings, cleaners, reports, users
│   └── auth/                    # login, register, no-access
├── stores/                      # Pinia: auth, booking, property, ui, user
├── types/                       # Domain types: booking, property, user, team, ui, api, router
├── utils/                       # businessLogic, authHelpers, constants, calendarHelpers, etc.
├── layouts/                     # admin, owner, auth, default
├── router/                      # Route definitions + auth/role guards
├── plugins/                     # Vuetify config, Supabase client
└── styles/                      # SCSS with responsive custom properties
```

### State Management

Pinia stores use `Map<string, T>` collections with TTL-based cached filtered Maps for O(1) lookups. Business logic lives in `src/utils/businessLogic.ts`, not in stores. Optimistic updates with rollback on failure.

### Build & Chunking

Vite splits output into role-aware chunks: `admin-app`, `owner-app`, `app-core`, plus vendor chunks for `vue-core`, `vuetify`, `calendar`, `supabase`, and general `vendor`. Build flags `__ENABLE_OWNER_FEATURES__` and `__ENABLE_ADMIN_FEATURES__` control role-specific code inclusion.

---

## Tech Stack

- **Framework**: Vue 3.5 + TypeScript 5.9 + Vite 7
- **UI**: Vuetify 4 + Material Design Icons (`@mdi/font`)
- **State**: Pinia 3 with Map-based stores
- **Calendar**: FullCalendar 6 (daygrid, timegrid, list, interaction)
- **Backend**: Supabase (Auth, Postgres, RLS, Realtime)
- **Testing**: Vitest 4 + Vue Test Utils
- **PWA**: vite-plugin-pwa + Workbox
- **Package Manager**: pnpm 10

---

## Supabase Integration

Schema and RLS policies managed through migrations in `supabase/migrations/` (7 migrations). Tables cover properties, bookings, users/profiles, cleaner teams, and booking assignments. Realtime subscriptions in composables auto-sync data across roles.

Requires `.env.local`:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

---

## Routes

### Owner (`/owner/*`) — requires auth, role: owner

`/owner/dashboard` · `/owner/overview` · `/owner/bookings` · `/owner/properties` · `/owner/properties/:id` · `/owner/profile` · `/owner/settings`

### Admin (`/admin/*`) — requires auth, role: admin

`/admin` · `/admin/schedule` · `/admin/properties` · `/admin/bookings` · `/admin/cleaners` · `/admin/calendar` · `/admin/users` · `/admin/property-owners` · `/admin/owners/:id` · `/admin/reports`

### Auth (public)

`/` (login) · `/auth/register` · `/auth/no-access`

Guards in `src/router/guards.ts` enforce `meta.requiresAuth` and `meta.role` automatically.

---

## Documentation

### Deployment

- [Deployment Guide](docs/deployment/deployment-guide.md)
- [Environment Config](docs/deployment/environment-config.md)
- [Deployment Checklist](docs/deployment/deployment-checklist.md)
- [Development Guide](docs/deployment/DEVELOPMENT_GUIDE.md)

### API & Architecture

- [API Reference](docs/api/API_REFERENCE.md)
- [Database API Design](docs/api/DATABASE_API_DESIGN.md)
- [Component Interfaces](docs/COMPONENT_INTERFACES.md)
- [Implementation Guide](docs/IMPLEMENTATION_GUIDE.md)
- [Performance Optimization Patterns](docs/PERFORMANCE_OPTIMIZATION_PATTERNS.md)

### Role-Specific Component Docs

- [Owner Components](docs/api/owner-components.md)
- [Admin Components](docs/api/admin-components.md)
- [Shared Components](docs/api/shared-components.md)
- [Role-Based Integration](docs/api/role-based-integration.md)

### Supabase

- [Migration Plan](docs/supabase_migration/supabase-migration-plan.md)
- [Migration Steps](docs/supabase_migration/supabase-migration-steps.md)
- [Integration Checklist](docs/supabase_migration/supabase-integration-checklist.md)

### Other

- [FullCalendar Reference](docs/fullcalendar-reference.md)
- [PWA Product Requirements](docs/pwa-product-requirements-document.md)
- [UML Diagrams](docs/uml/)

---

## License

Proprietary software for property cleaning business management.

---

**Version**: 0.1.0
**Last Updated**: March 2026
**Architecture**: Role-Based Multi-Tenant
