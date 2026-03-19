/**
 * Property Type Definitions
 * Types for properties managed in the cleaning scheduler
 */

/**
 * Valid pricing tiers for properties
 */
export type PricingTier = 'basic' | 'standard' | 'premium' | 'luxury';

/**
 * Property Interface
 * Core data model for properties in the system.
 * Properties are identified by their structured address, not a name.
 */
export interface Property {
  id: string;
  owner_id: string;
  address_street: string;
  address_unit?: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  bedrooms?: number;
  bathrooms?: number;
  square_feet?: number;
  property_type?: 'apartment' | 'house' | 'condo' | 'townhouse';
  cleaning_duration: number;
  special_instructions?: string;
  pricing_tier: PricingTier;
  active: boolean; // Soft-delete flag; preserves historical data while removing from active scheduling
  created_at?: string;
  updated_at?: string;
}

/**
 * Extended property interface with analytics
 * Used for property dashboard views
 */
export interface PropertyWithMetrics extends Property {
  metrics: {
    utilizationRate: number;
    averageGapBetweenBookings: number;
    turnPercentage: number;
    revenueProjection: number;
    cleaningLoad: 'light' | 'moderate' | 'heavy';
  };
}

/**
 * Property form data
 * Used for creating/editing properties
 */
export type PropertyFormData = Omit<Property, 'id' | 'created_at' | 'updated_at'>;

/**
 * Use this type at Supabase realtime/modal boundaries that need Record<string, unknown>.
 * Never add [key: string]: unknown to Property itself.
 */
export type PropertyRecord = Property & Record<string, unknown>;

/**
 * Map type for property collections
 */
export type PropertyMap = Map<string, Property>;

/**
 * Format a property address for display.
 * Short format: "123 Main St" or "123 Main St, Apt 4"
 * Full format: "123 Main St, Apt 4, Austin, TX 78701"
 */
export function formatPropertyAddress(property: Pick<Property, 'address_street' | 'address_unit' | 'address_city' | 'address_state' | 'address_zip'>, format: 'short' | 'full' = 'full'): string {
  const street = property.address_street || '';
  const unit = property.address_unit ? `, ${property.address_unit}` : '';

  if (format === 'short') {
    return `${street}${unit}`.trim() || 'No address';
  }

  const parts = [
    `${street}${unit}`,
    property.address_city,
    property.address_state ? `${property.address_state} ${property.address_zip || ''}`.trim() : property.address_zip,
  ].filter(Boolean);

  return parts.join(', ') || 'No address';
}

/**
 * Type guard for Property objects
 */
export function isProperty(obj: unknown): obj is Property {
  if (typeof obj !== 'object' || obj === null) return false;
  const p = obj as Partial<Property>;
  return (
    typeof p.id === 'string' &&
    typeof p.address_street === 'string' &&
    typeof p.address_city === 'string' &&
    typeof p.address_state === 'string' &&
    typeof p.address_zip === 'string' &&
    typeof p.cleaning_duration === 'number' &&
    typeof p.active === 'boolean'
  );
}
