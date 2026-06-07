# Technology Stack

**Project:** Claro (BookingApp v89)
**Researched:** June 2026

## Recommended Stack

### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vue 3 | 3.5+ | Frontend Framework | Standard for modern composition-based UI; excellent DX with script setup. |
| Vuetify 4 | 4.0 (Stable) | UI Component Library | Material Design 3 support; first-class Vue 3 support; robust "Control Room" components (Data Tables, Navigation Rails). |
| TypeScript | 5.0+ | Typing & Safety | Critical for multi-tenant business logic and Supabase type-safety. |

### State & Logic
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Pinia | 2.1+ | State Management | Map-based collections for O(1) lookups; much cleaner than Vuex. |
| FullCalendar | 6.1+ | Scheduling UI | Industry standard for complex calendars; supports drag-and-drop and custom resource views. |

### Backend & Infrastructure
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Supabase | Latest | Auth, DB, RLS | Out-of-the-box multi-tenancy via RLS; Realtime subscriptions for dispatch updates. |
| PostgreSQL | 15+ | Database | Robust relational support for complex booking/cleaning relationships. |

### Supporting Libraries
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | 3.0+ | Date Manipulation | All scheduling logic; superior to Moment.js for tree-shaking. |
| Vite PWA | 0.20+ | Offline Support | Mobile-first cleaner app; critical for properties with poor cell service (basement units). |
| Sentry | 8.0+ | Monitoring | Monitoring RLS failures and slow FullCalendar renders. |

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| UI Framework | Vuetify 4 | Tailwind CSS | Vuetify provides higher-level components (Date Pickers, Complex Tables) out of the box, faster for "Control Room" apps. |
| Backend | Supabase | Firebase | Firebase lacks the powerful relational queries (JOINs) needed for "Property -> Unit -> Cleaning Task" logic. |
| Calendar | FullCalendar | Vue Cal | FullCalendar is more robust for "Resource Scheduling" (assigning cleaners to columns). |

## Installation

```bash
# Core
pnpm add vuetify@next pinia @fullcalendar/vue3 @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction @supabase/supabase-js date-fns

# Dev dependencies
pnpm add -D sass typescript vue-tsc vite-plugin-pwa
```

## Sources

- [Vuetify 4.0 Stable Announcement (Feb 2026)](https://vuetifyjs.com)
- [Supabase Multi-tenancy Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [FullCalendar v6 Docs](https://fullcalendar.io/docs)
