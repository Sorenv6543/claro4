# Domain Pitfalls

**Domain:** Multi-tenant STR Cleaning
**Researched:** June 2026

## Critical Pitfalls

### Pitfall 1: iCal Lag ("The Same-Day Booking Trap")
**What goes wrong:** A guest books at 10 AM for a 4 PM check-in. The iCal sync only runs every 3 hours. The cleaner isn't notified until 1 PM, but they are already booked for another job.
**Why it happens:** iCal is a "pull" technology with significant latency.
**Prevention:** 
1. Allow "Manual Sync" button for hosts.
2. Implement direct API integration (Hospitable/Guesty) as soon as possible.
3. Set a "Turnover Buffer" warning in the UI if sync is old.

### Pitfall 2: One-Way Status Blindness
**What goes wrong:** Cleaner finishes at 1 PM, but the Host doesn't know. The Guest is waiting at a coffee shop, and the unit sits empty and ready for 3 hours.
**Why it happens:** The cleaning app doesn't notify the booking platform (Airbnb/VRBO).
**Prevention:**
1. Use automated SMS/Email triggers from Supabase Edge Functions on task completion.
2. Provide a "Public Readiness Link" for guests (optional feature).

## Moderate Pitfalls

### Pitfall 3: The "Ghost Clean" (Fraud)
**What goes wrong:** Cleaner marks the job as complete from their couch to get paid.
**Why it happens:** Lack of location or visual verification.
**Prevention:** 
1. Require 3+ photos of the unit (Bed, Bathroom, Kitchen).
2. Capture GPS coordinates at the moment of "Mark Complete" (only to verify proximity to the property).

### Pitfall 4: Timezone "Date-Roll"
**What goes wrong:** Booking is Friday night (checkout Saturday morning). Due to UTC conversion errors, the cleaning task shows up on Friday morning or Sunday.
**Why it happens:** Mismatch between Server (UTC) and Local Property Time.
**Prevention:** Store property-specific timezones in the `properties` table. Perform all task generation logic using `date-fns-tz`.

## Minor Pitfalls

### Pitfall 5: Poor Cell Service in Basements
**What goes wrong:** Cleaner finishes, tries to upload 10 photos, app crashes or hangs because of 1 bar of service.
**Why it happens:** Large image sizes + poor connectivity.
**Prevention:**
1. Client-side image resizing/compression before upload.
2. Implement a "Sync Queue" in the PWA that retries uploads when connection is restored.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| iCal Integration | Malformed iCal strings from niche OTAs. | Use a robust parsing library (e.g., `ical.js`) and log failures for manual review. |
| Multi-tenancy | Organization ID leakage in Edge Functions. | Use Service Role keys ONLY for system tasks; ensure all client-facing functions use user JWT. |
| Dispatch UI | FullCalendar performance with 50+ cleaners. | Use `lazyFetching` and only load the visible window of tasks. |

## Sources

- Reddit r/AirbnbHost "Turno complaints" threads
- Breezeway "Port St. Lucie" case study (Sync failure example)
- Supabase Security Best Practices (RLS section)
