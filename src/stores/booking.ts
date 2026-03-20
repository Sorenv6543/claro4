// EVENTS/BOOKING STORE - BOOKING STORE - BOOKING CRUD - BOOKING FILTERS - BOOKING ACTIONS
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Booking, BookingMap, BookingStatus, BookingType } from '@/types/booking.ts';
import {
  filterBookingsByDateRange,
  getUrgentTurns,
  getUpcomingBookings
} from '@/utils/businessLogic.ts';
import { createMapCache } from '@/utils/cachedMapFilter.ts';
import supabase from '@/plugins/supabase.ts';

// Uses Map collections for efficient booking access and management
export const useBookingStore = defineStore('booking', () => {
  // State
  const bookings = ref<BookingMap>(new Map());
  const loading = ref<boolean>(false);
  const error = ref<string | null>(null);

  // Shared TTL cache for all filtered Maps
  const cache = createMapCache(10_000);
  const invalidateCache = cache.invalidate;

  // GET EVENTS/BOOKINGS BY FILTER FUNCTIONS - Optimized Map-based filtering
  const bookingsArray = computed((): Booking[] => {
    return Array.from(bookings.value.values());
  });

  const getBookingById = computed(() => (id: string): Booking | undefined => {
    return bookings.value.get(id);
  });

  // Map-based status filtering with caching
  const bookingsByStatusMap = cache.cachedGroupBy<Booking, BookingStatus>(
    () => bookings.value,
    (booking) => booking.status
  );

  // Map-based type filtering with caching
  const bookingsByTypeMap = cache.cachedGroupBy<Booking, BookingType>(
    () => bookings.value,
    (booking) => booking.booking_type
  );

  // Efficient getter functions that return Maps
  const bookingsByStatus = computed(() => (status: BookingStatus): Map<string, Booking> => {
    return bookingsByStatusMap.value.get(status) || new Map();
  });

  const bookingsByType = computed(() => (type: BookingType): Map<string, Booking> => {
    return bookingsByTypeMap.value.get(type) || new Map();
  });

  const bookingsByProperty = cache.cachedFilterBy<Booking>(
    () => bookings.value,
    (booking, propertyId) => booking.property_id === propertyId
  );

  const bookingsByOwner = cache.cachedFilterBy<Booking>(
    () => bookings.value,
    (booking, ownerId) => booking.owner_id === ownerId
  );

  // Use business logic utilities for complex filtering
  const bookingsByDateRange = computed(() => (startDate: string, endDate: string): Map<string, Booking> => {
    return filterBookingsByDateRange(bookings.value, startDate, endDate);
  });
  
  // Optimized pre-computed common filters using business logic
  const pendingBookingsMap = computed((): Map<string, Booking> => {
    return bookingsByStatus.value('pending');
  });
  
  const scheduledBookingsMap = computed((): Map<string, Booking> => {
    return bookingsByStatus.value('scheduled');
  });
  
  const turnBookingsMap = computed((): Map<string, Booking> => {
    return bookingsByType.value('turn');
  });
  
  const standardBookingsMap = computed((): Map<string, Booking> => {
    return bookingsByType.value('standard');
  });
  
  const upcomingBookingsMap = computed((): Map<string, Booking> => {
    return getUpcomingBookings(bookings.value);
  });
  
  const urgentTurnsMap = computed((): Map<string, Booking> => {
    return getUrgentTurns(bookings.value);
  });
  
  // Array getters ONLY for components that need arrays
  const pendingBookings = computed((): Booking[] => {
    return Array.from(pendingBookingsMap.value.values());
  });
  
  const scheduledBookings = computed((): Booking[] => {
    return Array.from(scheduledBookingsMap.value.values());
  });
  
  const turnBookings = computed((): Booking[] => {
    return Array.from(turnBookingsMap.value.values());
  });
  
  const standardBookings = computed((): Booking[] => {
    return Array.from(standardBookingsMap.value.values());
  });
   
  // ACTIONS - EVENTS/BOOKINGCRUD - ADD - UPDATE - REMOVE - UPDATE STATUS - ASSIGN CLEANER - FETCH - CLEAR ALL
  // addBooking - updateBooking - removeBooking - updateBookingStatus - assignCleaner - fetchBookings - clearAll

  // function addBooking(booking: Booking) {
  //   bookings.value.set(booking.id, booking);
  //   invalidateCache(); // Invalidate cache when data changes
  // }
  // Example: src/stores/booking.ts - Add these methods
async function addBooking(booking: Booking) {
  // Optimistic update
  bookings.value.set(booking.id, booking);
  error.value = null;
  
  try {
    const { error: supaError } = await supabase.from('bookings').insert(booking);
    if (supaError) throw supaError;
    invalidateCache(); // Invalidate cache after successful insert
  } catch (err: unknown) {
    // Rollback on error
    bookings.value.delete(booking.id);
    error.value = err instanceof Error ? err.message : 'Failed to add booking.';
    console.error('addBooking error:', err);
    throw err;
  }
}
  
  async function updateBooking(id: string, updates: Partial<Booking>) {
    const existing = bookings.value.get(id);
    if (!existing) {
      error.value = 'Booking not found';
      throw new Error('Booking not found');
    }

    console.log('🔍 [BookingStore] Updating booking:', { id, updates, existingOwner: existing.owner_id });

    // Create updated booking object
    const updated = { 
      ...existing, 
      ...updates, 
      updated_at: new Date().toISOString() 
    };
    
    // Store original state for potential rollback
    const originalMap = new Map(bookings.value);
    
    // Optimistic update
    bookings.value.set(id, updated);
    error.value = null;
    
    try {
      const { error: supaError } = await supabase
        .from('bookings')
        .update(updates)
        .eq('id', id);
      
      if (supaError) {
        console.error('❌ [BookingStore] Supabase update error:', supaError);
        throw supaError;
      }
      
      console.log('✅ [BookingStore] Successfully updated booking in Supabase');
      invalidateCache(); // Invalidate cache after successful update
    } catch (err: unknown) {
      console.error('❌ [BookingStore] Update failed, rolling back:', err);
      
      // Complete rollback - restore entire map to prevent corruption
      bookings.value.clear();
      originalMap.forEach((booking, key) => {
        bookings.value.set(key, booking);
      });
      
      error.value = err instanceof Error ? err.message : 'Failed to update booking.';
      invalidateCache(); // Invalidate cache after rollback
      throw err;
    }
  }
  
  async function removeBooking(id: string) {
    const existing = bookings.value.get(id);
    if (!existing) {
      error.value = 'Booking not found';
      throw new Error('Booking not found');
    }

    // Optimistic update
    bookings.value.delete(id);
    error.value = null;
    
    try {
      const { error: supaError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', id);
      
      if (supaError) throw supaError;
      invalidateCache(); // Invalidate cache after successful delete
    } catch (err: unknown) {
      // Rollback on error
      bookings.value.set(id, existing);
      error.value = err instanceof Error ? err.message : 'Failed to remove booking.';
      console.error('removeBooking error:', err);
      throw err;
    }
  }
  
  function updateBookingStatus(id: string, status: BookingStatus) {
    updateBooking(id, { status });
  }
  
  function assignCleaner(id: string, cleanerId: string) {
    updateBooking(id, { assigned_cleaner_id: cleanerId });
  }
  
  async function fetchBookings() {
    loading.value = true;
    error.value = null;
    
    try {
      console.log('🔍 [BookingStore] Fetching bookings from Supabase...');
      
      // Fetch bookings from Supabase
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .order('checkout_date', { ascending: true });
      
      if (fetchError) {
        console.error('❌ [BookingStore] Supabase error:', fetchError);
        throw fetchError;
      }
      
      console.log(`✅ [BookingStore] Fetched ${data?.length || 0} bookings from Supabase:`, data);
      
      // Clear existing bookings and add fetched ones
      bookings.value.clear();
      
      if (data && data.length > 0) {
        data.forEach(booking => {
          bookings.value.set(booking.id, booking);
        });
        console.log(`✅ [BookingStore] Added ${data.length} bookings to store`);
      }
      
      loading.value = false;
      invalidateCache(); // Invalidate cache after fetch
    } catch (err) {
      console.error('❌ [BookingStore] Error fetching bookings:', err);
      error.value = err instanceof Error ? err.message : 'Unknown error fetching bookings';
      loading.value = false;
    }
  }
  
  function clearAll() {
    bookings.value.clear();
    invalidateCache(); // Invalidate cache when data changes
  }
  
  return {
    // State
    bookings,
    loading,
    error,
    
    // Map getters (primary - for O(1) operations)
    bookingsByStatusMap,
    bookingsByTypeMap,
    pendingBookingsMap,
    scheduledBookingsMap,
    turnBookingsMap,
    standardBookingsMap,
    upcomingBookingsMap,
    urgentTurnsMap,
    
    // Parameterized Map getters
    getBookingById,
    bookingsByStatus,
    bookingsByType,
    bookingsByProperty,
    bookingsByOwner,
    bookingsByDateRange,
    
    // Array getters (secondary - only when UI needs arrays)
    bookingsArray,
    pendingBookings,
    scheduledBookings,
    turnBookings,
    standardBookings,
    
    // Actions
    addBooking,
    updateBooking,
    removeBooking,
    updateBookingStatus,
    assignCleaner,
    fetchBookings,
    clearAll,
    
    // Cache management
    invalidateCache
  };
}); 