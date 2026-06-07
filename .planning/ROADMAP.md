# Roadmap

## Project Overview
Claro4 (v89) is a multi-tenant STR cleaning scheduler designed for owners (mobile status) and admins (desktop dispatch).

## Phases
- [ ] **Phase 1: Multi-tenant Foundation & Booking Sync** - Establish secure isolation and automated data ingestion.
- [ ] **Phase 2: Mobile "Proof of Clean" Engine** - Core cleaning workflow with checklists and photo verification.
- [ ] **Phase 3: Desktop "Control Room" Dispatch** - High-efficiency visual scheduling for admins.
- [ ] **Phase 4: Scaling & Real-time Integrations** - Advanced automation, direct APIs, and operational polish.

## Phase Details

### Phase 1: Multi-tenant Foundation & Booking Sync
**Goal**: Establish a secure, multi-tenant database schema and automate booking ingestion via iCal.
**Depends on**: Nothing
**Requirements**: AUTH-01, AUTH-02, MT-01, MT-02, PROP-01, SYNC-01, SYNC-02, DB-01
**Success Criteria**:
  1. Users can log in and are correctly routed to Admin, Owner, or Cleaner dashboards.
  2. One tenant cannot see or modify property/booking data from another tenant (validated by RLS).
  3. Adding an iCal link to a property automatically populates the booking calendar.
  4. Overlapping bookings are flagged as conflicts in the system.
**Plans**:
- [ ] 01-01-PLAN.md — Core Schema & Multi-tenant Isolation
- [ ] 01-02-PLAN.md — Auth State & Protected Routing
- [ ] 01-03-PLAN.md — Property Management & Store
- [ ] 01-04-PLAN.md — iCal Sync & Booking Ingestion
**UI hint**: yes

### Phase 2: Mobile "Proof of Clean" Engine
**Goal**: Deliver the core value proposition: verifiable cleaning status for property owners.
**Depends on**: Phase 1
**Requirements**: MOB-01, TASK-01, TASK-02, TASK-03, DASH-01, NOTIF-01
**Success Criteria**:
  1. Cleaners can access a mobile-optimized list of assigned tasks for the day.
  2. Cleaners cannot complete a task without checking off all items and uploading at least one photo.
  3. Owners receive a notification and can see the "Proof of Clean" photos on their dashboard immediately upon completion.
  4. The property status automatically flips to "Ready" once the cleaner submits the task.
**Plans**: TBD
**UI hint**: yes

### Phase 3: Desktop "Control Room" Dispatch
**Goal**: Provide admins with a powerful desktop environment for managing high-volume turnovers.
**Depends on**: Phase 2
**Requirements**: ADM-01, SCHED-01, SCHED-02, INV-01, REP-01
**Success Criteria**:
  1. Admin can see all bookings and tasks across all managed properties in a single visual calendar.
  2. Admin can assign a cleaner to a task by dragging and dropping them onto a calendar slot.
  3. System alerts admin when low-stock items (e.g., toiletries) need replenishing based on clean counts.
  4. Admin can generate a weekly report showing cleaner efficiency (avg. time per property type).
**Plans**: TBD
**UI hint**: yes

### Phase 4: Scaling & Real-time Integrations
**Goal**: Reduce latency and automate peripheral business operations.
**Depends on**: Phase 3
**Requirements**: SYNC-03, NOTIF-02, PAY-01, WL-01
**Success Criteria**:
  1. Bookings from major OTAs sync within 60 seconds (down from iCal polling intervals).
  2. Guests automatically receive an SMS notification the moment their unit is marked "Ready."
  3. The system generates an accurate invoice/payout summary for cleaners based on completed tasks.
  4. Tenants can apply their own brand colors and logos to their owner-facing portal.
**Plans**: TBD
**UI hint**: yes

## Progress Table

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Sync | 0/4 | In progress | - |
| 2. Proof of Clean | 0/1 | Not started | - |
| 3. Control Room | 0/1 | Not started | - |
| 4. Real-time Ops | 0/1 | Not started | - |

## Key Performance Indicators (KPIs)
- **Sync Reliability**: % of bookings correctly ingested vs source iCal.
- **Turnover Confidence**: % of cleans completed with valid photo proof.
- **Dispatch Velocity**: Average time taken by Admin to assign a new booking task.
- **Owner Satisfaction**: % of owners viewing "Proof of Clean" photos within 1 hour of completion.
- **System Latency**: Time from OTA booking to appearance in Claro4 (Goal: < 60s in Phase 4).
