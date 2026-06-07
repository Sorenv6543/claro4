# Milestone 1: Multi-tenant Foundation & Booking Sync

## Goals
- Secure multi-tenant architecture with data isolation.
- Automated booking ingestion from external sources.

## Deliverables
- [ ] Supabase schema with `tenants`, `properties`, and `bookings` tables.
- [ ] RLS policies enforcing tenant-level isolation.
- [ ] iCal sync worker/composable that parses Airbnb/VRBO calendars.
- [ ] Role-based routing for Admin/Owner/Cleaner users.
- [ ] Property management CRUD interface for owners.

## Success Criteria
- **Security**: Tenant A cannot query any data belonging to Tenant B via the API.
- **Accuracy**: iCal sync accurately captures check-in/check-out dates and guest names (where available).
- **Usability**: Owners can add a property and its iCal link in under 2 minutes.
