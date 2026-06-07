# Requirements

## v1: Multi-tenant Foundation & Booking Sync (Phase 1)
- **AUTH-01**: Secure user authentication via Supabase Auth.
- **AUTH-02**: Role-based Access Control (Admin, Owner, Cleaner).
- **MT-01**: Multi-tenant data isolation using Supabase RLS.
- **MT-02**: Tenant-specific configuration (branding, settings).
- **PROP-01**: Property management (CRUD) for owners.
- **SYNC-01**: iCal Sync Engine to ingest bookings from Airbnb, VRBO, etc.
- **SYNC-02**: Conflict detection (overlapping bookings).
- **DB-01**: Core data model (Tenants, Users, Properties, Bookings).

## v1: Mobile "Proof of Clean" Engine (Phase 2)
- **MOB-01**: Mobile-optimized Cleaner Interface (PWA).
- **TASK-01**: Automated cleaning task generation from bookings.
- **TASK-02**: Dynamic checklists per property type.
- **TASK-03**: Photo Proof upload for completed tasks.
- **DASH-01**: Owner mobile dashboard ("Is it ready?").
- **NOTIF-01**: Basic email/push notification for completed tasks.

## v1: Desktop "Control Room" Dispatch (Phase 3)
- **ADM-01**: Desktop-optimized Admin "Control Room" interface.
- **SCHED-01**: Visual Scheduler (FullCalendar) with drag-and-drop dispatching.
- **SCHED-02**: Cleaner availability and shift management.
- **INV-01**: Inventory low-stock alerts based on usage logic.
- **REP-01**: Operational reporting (turnover times, cleaner performance).

## v1: Scaling & Real-time Integrations (Phase 4)
- **SYNC-03**: Direct API integrations with OTAs (Airbnb, VRBO) for real-time sync.
- **NOTIF-02**: Automated Guest-Ready SMS via Twilio/Firebase.
- **PAY-01**: Cleaner payout and invoice generation.
- **WL-01**: Multi-tenant white-labeling (custom domains/CSS).

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| MT-01 | Phase 1 | Pending |
| MT-02 | Phase 1 | Pending |
| PROP-01 | Phase 1 | Pending |
| SYNC-01 | Phase 1 | Pending |
| SYNC-02 | Phase 1 | Pending |
| DB-01 | Phase 1 | Pending |
| MOB-01 | Phase 2 | Pending |
| TASK-01 | Phase 2 | Pending |
| TASK-02 | Phase 2 | Pending |
| TASK-03 | Phase 2 | Pending |
| DASH-01 | Phase 2 | Pending |
| NOTIF-01 | Phase 2 | Pending |
| ADM-01 | Phase 3 | Pending |
| SCHED-01 | Phase 3 | Pending |
| SCHED-02 | Phase 3 | Pending |
| INV-01 | Phase 3 | Pending |
| REP-01 | Phase 3 | Pending |
| SYNC-03 | Phase 4 | Pending |
| NOTIF-02 | Phase 4 | Pending |
| PAY-01 | Phase 4 | Pending |
| WL-01 | Phase 4 | Pending |
