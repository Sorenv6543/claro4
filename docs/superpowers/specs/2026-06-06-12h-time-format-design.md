# Design: 12-Hour Time Format Implementation

**Date:** 2026-06-06
**Status:** Draft
**Topic:** 12h Time Format

## Overview
Standardize all user-facing time displays to a 12-hour format (e.g., "2:30 PM") while maintaining 24-hour formats for internal logic and sorting.

## Proposed Changes

### 1. Update `src/utils/timelineMath.ts`
- Ensure `fmt12(timeStr: string)` handles all edge cases.
- Add `fmt12Now()` to get the current time in 12h format.
- Standardize `fmtChipLabel` to use the same logic.

### 2. systemic Replacement in Components
Update the following areas to use `fmt12()` for display:

#### Mobile (OwnerDayBar.vue)
- Greeting time display.
- Urgent turn banner times.
- Event list times.
- Bottom sheet details.

#### Desktop (OwnerOverview.vue)
- Operational status stats.
- Urgent turn banner.
- Timeline chips (already partially done via `fmtChipLabel`).
- Upcoming activity list.

#### Shared Components
- `PropertyList.vue` event times.
- `BookingForm.vue` (display only, input remains 24h or uses a picker).

### 3. Internal Logic
- Keep `HH:mm` strings for all sorting, comparisons, and database storage.
- Only apply `fmt12` at the leaf nodes (template interpolation or computed display values).

## Success Criteria
- No "14:30" strings visible to the user.
- All times follow "h:mm AM/PM" or "h:mm am/pm" (as per local style).
- Sorting and timeline positioning remain accurate.
