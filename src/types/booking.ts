/**
 * Booking Type Definitions
 * Types for bookings/events in the property cleaning scheduler
 */

/**
 * Valid booking types
 * 'turn' bookings are high priority same-day checkout/checkin
 * 'standard' bookings are regular cleanings with time gap
 */
export type BookingType = 'standard' | 'turn'

/**
 * Valid booking statuses
 * Defines the workflow of a booking
 */
export type BookingStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

/**
 * Booking Interface
 * Core data model for booking/cleaning events
 */

export interface Booking {
  start_date: string | number | Date
  id: string
  property_id: string
  owner_id: string
  checkin_date: string // ISO date when guests check in (arrive) - start of guest stay
  checkout_date: string // ISO date when guests check out (depart) - end of guest stay
  checkin_time: string // Time when guests arrive (HH:MM:SS format)
  checkout_time: string // Time when guests depart (HH:MM:SS format)
  booking_type: BookingType
  status: BookingStatus
  guest_count?: number | null
  notes?: string | null
  priority: 'low' | 'normal' | 'high' | 'urgent'
  assigned_cleaner_id?: string | null
  assigned_team_id?: string | null
  assigned_group_ids?: string[] | null
  turn_date?: string | null // Date of same-day turnover within stay
  turn_start_time?: string | null // When previous guests depart on turn day
  turn_checkin_time?: string | null // When next guests arrive on turn day
  created_at?: string
  updated_at?: string
}

/**
 * Extended booking with calculated fields
 * Used for display and business logic
 */
export interface BookingWithMetadata extends Booking {
  property_name?: string
  cleaning_window?: {
    start: string
    end: string
    duration: number // minutes
  }
}

/**
 * Record-compatible wrapper types for boundaries that require Record<string, unknown>
 * (e.g., modal systems, realtime payloads). Use these instead of weakening domain types.
 */
export type BookingRecord = Booking & Record<string, unknown>
export type BookingWithMetadataRecord = BookingWithMetadata & Record<string, unknown>

/**
 * Form data for creating/editing bookings
 * Includes optional start/end properties for FullCalendar integration
 */
export type BookingFormData = Omit<Booking, 'id' | 'created_at' | 'updated_at'> & {
  start?: string
  end?: string
}

/**
 * Map type for booking collections
 */
export type BookingMap = Map<string, Booking>

/**
 * Type guard for Booking objects
 */
export function isBooking (obj: unknown): obj is Booking {
  if (typeof obj !== 'object' || obj === null) {
    return false
  }
  const b = obj as Partial<Booking>
  return (
    typeof b.id === 'string'
    && typeof b.property_id === 'string'
    && typeof b.checkout_date === 'string'
    && typeof b.checkin_date === 'string'
    && typeof b.priority === 'string'
    && ['low', 'normal', 'high', 'urgent'].includes(b.priority as string)
    && typeof b.owner_id === 'string'
    && typeof b.checkin_time === 'string'
    && typeof b.checkout_time === 'string'
    && typeof b.booking_type === 'string'
    && ['standard', 'turn'].includes(b.booking_type as string)
    && typeof b.status === 'string'
    && ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled'].includes(b.status as string)
    && new Date(b.checkout_date as string) >= new Date(b.checkin_date as string)
  )
}
