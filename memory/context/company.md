---
name: project-context
description: Claro project tech stack, architecture, and domain context
type: reference
---

# Project Context — Claro

## Product
Multi-tenant property cleaning scheduler. Two user roles: Property Owners (30-40 clients) and Business Admin (1 user).

## Tech Stack
- Frontend: Vue 3 + Vite + Vuetify 4
- State: Pinia (Map-based stores with TTL caching)
- Backend: Supabase (auth, Postgres, RLS, realtime)
- Calendar: FullCalendar
- PWA: vite-plugin-pwa with Workbox

## Key Domain Terms
- **Turn**: Same-day booking (checkin + checkout same day), always high priority
- **Turn booking**: Short stay requiring fast cleaning turnaround
- **Booking priority**: low | normal | high | urgent (turns are always >= high)
- **Adjacent bookings**: One checkout == another checkin — these do NOT conflict

## Architecture
- Smart/Dumb component split
- Role-separated component trees (admin/, owner/, shared/)
- Business logic centralized in src/utils/businessLogic.ts
