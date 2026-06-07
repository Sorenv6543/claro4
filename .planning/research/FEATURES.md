# Feature Landscape

**Domain:** Multi-tenant STR Cleaning & Scheduling
**Researched:** June 2026

## Table Stakes

Features users expect in any professional cleaning app.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Calendar Sync (iCal)** | Properties are listed on Airbnb/VRBO; manual entry is a non-starter. | Medium | Needs robust parsing for different OTA formats. |
| **Mobile Checklists** | Cleaners need guided SOPs to maintain "Hotel-Clean" standards. | Low | Must be easy to use with "fat fingers" on mobile. |
| **Photo Proof of Clean** | Protects hosts against false guest refund claims. | Medium | Needs image compression/optimization for fast uploads. |
| **Role-based Dashboards** | Admins need "Control Room" (dispatch); Owners need "Status" (is it ready?). | Medium | Requires strict separation of concerns in UI. |
| **Automated Notifications** | Cleaners need alerts for new jobs; Owners need "Ready" alerts. | High | Needs SMS/Push (Firebase or Twilio). |

## Differentiators

Features that set Claro apart from Turno/Breezeway.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Visual Resource Dispatch** | Drag-and-drop a cleaner onto a task in a resource-grid view. | High | Custom FullCalendar implementation. |
| **Multi-Tenant White-label** | Cleaning companies can provide the "Owner App" under their own branding. | Medium | Using CSS variables for branding. |
| **Inventory Low-Stock Alerts** | Automatic counting based on unit size (e.g., "3 pods used per clean"). | Medium | Logic-driven restocking rather than manual counting. |
| **Direct Guest Ready SMS** | Automatically text the guest "Your place is ready early!" when the cleaner marks complete. | Medium | Huge guest experience win for Breezeway; Turno lacks this. |

## Anti-Features

Features to explicitly NOT build (avoiding Breezeway's "bloat" and Turno's "marketplace" risks).

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Cleaner Marketplace** | High "flake" risk; liability issues; support nightmare. | Focus on "Bring Your Own Team" (BYOT). |
| **Smart Lock Hardware** | Maintenance headache; fragile integrations. | Integrate with a middleware like "Seam" or "RemoteLock" if requested. |
| **Full Guest Messaging** | Competes with PMS; too complex for a cleaning-first tool. | Only provide "Ready for Check-in" automated triggers. |

## Feature Dependencies

```
iCal Sync → Booking Data → Task Generation → Dispatch → Cleaner Checklist → Completion Notification
```

## MVP Recommendation

Prioritize:
1. **iCal Sync Engine**: The "fuel" for the app.
2. **Mobile Completion Workflow**: Checklist + Photo Upload (the core value).
3. **Admin Resource View**: Single-view dispatch (the "Control Room").

Defer: **Inventory Tracking**: Add in Phase 3 once core turnover logic is stable.

## Sources

- Turno Feature List (Marketplace focus)
- Breezeway Feature List (Operations focus)
- Host Forums (Reddit r/AirbnbHost, r/ShortTermRentals)
