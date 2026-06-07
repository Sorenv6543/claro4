# Architecture Patterns

**Domain:** Multi-tenant STR Cleaning
**Researched:** June 2026

## Recommended Architecture

Claro uses a **Role-Based Chunking** strategy to keep the mobile cleaner experience fast while providing a data-dense experience for admins.

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| **`AdminShell`** | Desktop Layout, Navigation Rail, Dispatch Center. | `BookingStore`, `CleanerStore` |
| **`OwnerShell`** | Mobile-first layout, Status Dashboard, Property Picker. | `PropertyStore`, `TaskStore` |
| **`ChecklistEngine`** | Renders dynamic checklists based on unit type. | `TaskStore`, `PhotoUploadUtility` |
| **`SyncEngine`** | Background worker for iCal/API polling. | `Supabase Edge Functions` |

### Data Flow

1. **Ingress:** Supabase Edge Function polls iCal feeds → Writes to `bookings` table.
2. **Auto-Task:** Postgres Trigger creates a `cleaning_task` for every `booking.checkout_date`.
3. **Dispatch:** Admin assigns `cleaner_id` via FullCalendar UI → Supabase Realtime notifies Cleaner App.
4. **Execution:** Cleaner completes checklist → Uploads photos to Supabase Storage → Marks as `complete`.
5. **Egress:** `ON update cleaning_task SET status='complete'` → Triggers SMS to Guest (optional) and Host.

## Patterns to Follow

### Pattern 1: JWT-Based Multi-tenancy (RLS)
**What:** Use `app_metadata` in JWT to store `organization_id`.
**When:** All read/write operations.
**Example:**
```sql
CREATE POLICY "Tenant Isolation" ON cleaning_tasks
USING (organization_id = (auth.jwt() -> 'app_metadata' ->> 'org_id')::uuid);
```

### Pattern 2: Cached Map Collections (Pinia)
**What:** Stores should keep data in a `Map<id, item>` for O(1) access.
**When:** Managing large lists of bookings or properties in the Admin view.
**Example:**
```typescript
export const useBookingStore = defineStore('bookings', {
  state: () => ({
    collection: new Map<string, Booking>(),
  }),
  getters: {
    forProperty: (state) => (propId: string) => 
      Array.from(state.collection.values()).filter(b => b.propertyId === propId)
  }
})
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Deep Join RLS
**What:** Policies that join multiple tables (e.g., `Tasks -> Units -> Properties -> Org`).
**Why bad:** Performance degrades exponentially as data grows.
**Instead:** Denormalize `organization_id` onto all high-volume tables (Tasks, Bookings).

### Anti-Pattern 2: Client-side Sync Logic
**What:** Performing iCal parsing in the browser.
**Why bad:** Unreliable; doesn't happen when the app is closed.
**Instead:** Move all sync logic to Supabase Edge Functions.

## Scalability Considerations

| Concern | At 100 properties | At 10K properties |
|---------|-------------------|-------------------|
| **Sync Latency** | Sequential polling is fine. | Need a distributed job queue (e.g., Inngest or specialized worker). |
| **FullCalendar Render** | Standard DayGrid is fast. | Use "Resource View" with virtualization for 100+ cleaners. |
| **Storage (Photos)** | Standard S3/Supabase Storage. | Implement image resizing on upload to save bandwidth/costs. |

## Sources

- Supabase RLS Performance Guides
- Vuetify 4 Component Architecture
- FullCalendar Performance Optimization Wiki
