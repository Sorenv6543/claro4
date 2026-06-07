# Research Summary: Claro (BookingApp v89)

**Domain:** Multi-tenant STR (Short-Term Rental) Cleaning & Scheduling
**Researched:** June 2026
**Overall confidence:** HIGH

## Executive Summary

The short-term rental cleaning industry has shifted from residential-style housekeeping to a "Hotel-Clean" hospitality model. In 2026, cleanliness is the primary driver of guest ratings and platform visibility (Guest Favorite badges). This research identifies a clear gap between marketplace-focused tools (Turno) and enterprise property management systems (Breezeway). 

Claro (v89) is positioned to serve the "Sweet Spot": providing property owners with high-confidence "Proof of Clean" and giving cleaning business admins a data-dense "Control Room" for high-velocity turnovers. The technical foundation—Vue 3, Vuetify 4, and Supabase—is state-of-the-art, enabling real-time dispatch and multi-tenant isolation.

## Key Findings

**Stack:** Vue 3 (Composition API) + Vuetify 4 (Material Design 3) + Supabase (RLS-driven multi-tenancy).
**Architecture:** Role-based UI separation (Owner vs Admin) with a centralized "Business Logic" core.
**Critical pitfall:** Sync latency (iCal lag) leading to missed cleans or "guest-cleaner collisions."

## Implications for Roadmap

Suggested phase structure:

1. **Phase 1: Foundation & Isolation** - RLS Multi-tenancy & iCal Sync
   - Addresses: Basic multi-tenant security, guest calendar integration.
   - Avoids: Data leakage between management companies.

2. **Phase 2: The "Proof of Clean" Engine** - Mobile Checklist & Photo Proof
   - Addresses: High-stakes hospitality standards, guest claim protection.
   - Avoids: "Ghost cleans" where cleaners mark tasks complete without site visits.

3. **Phase 3: The Dispatch Control Room** - Desktop Visual Scheduler
   - Addresses: Admin efficiency, drag-and-drop scheduling (FullCalendar).
   - Avoids: Manual dispatch errors during the 11 AM - 4 PM "Turnover Rush."

4. **Phase 4: Real-time Operations** - Direct API & Push Notifications
   - Addresses: Same-day booking alerts, early check-in coordination.
   - Avoids: iCal sync latency issues.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Vuetify 4 and Supabase RLS patterns are well-documented and current. |
| Features | HIGH | Competitor analysis (Turno/Breezeway) reveals clear feature gaps to exploit. |
| Architecture | MEDIUM | RLS performance for STR data density needs careful indexing. |
| Pitfalls | HIGH | Industry-wide issues with iCal lag and sync conflicts are well-documented. |

## Gaps to Address

- **Payment Processing:** Researching the best integration for auto-paying cleaners (Stripe Connect vs simple invoice generation).
- **Laundry Logistics:** STR cleaning often involves "linen services" or "per-load" billing which needs specific data modeling.
- **Smart Lock API:** Investigating "RemoteLock" or "Seam" for auto-generating cleaner access codes.
