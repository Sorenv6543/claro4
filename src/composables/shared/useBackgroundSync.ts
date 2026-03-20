import { ref, computed, onMounted, onUnmounted } from 'vue'
import supabase from '@/plugins/supabase'
import type { Booking, BookingFormData } from '@/types/booking'
import type { Property, PropertyFormData } from '@/types/property'

// Background sync operation types
export type SyncOperation = 
  | 'create_booking'
  | 'update_booking'
  | 'create_property'
  | 'update_property'
  | 'delete_booking'
  | 'delete_property'

export interface SyncQueueItem {
  id: string
  operation: SyncOperation
  data: unknown
  timestamp: number
  retryCount: number
  maxRetries: number
  userId: string
  userRole: string
}

export interface SyncResult {
  success: boolean
  item: SyncQueueItem
  error?: string
}

const SYNC_QUEUE_KEY = 'pwa-sync-queue'
const MAX_RETRIES = 3

export const useBackgroundSync = () => {
  // State
  const syncQueue = ref<SyncQueueItem[]>([])
  const isProcessing = ref(false)
  const lastSyncTime = ref<Date | null>(null)
  
  // Online status management
  const isOnline = ref(navigator.onLine)

  // Computed
  const queueLength = computed(() => syncQueue.value.length)
  const hasPendingOperations = computed(() => queueLength.value > 0)
  const canProcess = computed(() => isOnline.value && !isProcessing.value)

  // Load queue from localStorage on initialization
  const loadQueue = () => {
    try {
      const stored = localStorage.getItem(SYNC_QUEUE_KEY)
      if (stored) {
        syncQueue.value = JSON.parse(stored)
        console.log(`Loaded ${syncQueue.value.length} items from sync queue`)
      }
    } catch (error) {
      console.error('Error loading sync queue:', error)
      syncQueue.value = []
    }
  }

  // Save queue to localStorage
  const saveQueue = () => {
    try {
      localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(syncQueue.value))
    } catch (error) {
      console.error('Error saving sync queue:', error)
    }
  }

  // Add operation to sync queue
  const queueOperation = (
    operation: SyncOperation,
    data: unknown,
    userId: string,
    userRole: string
  ): string => {
    const item: SyncQueueItem = {
      id: generateId(),
      operation,
      data,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: MAX_RETRIES,
      userId,
      userRole
    }

    syncQueue.value.push(item)
    saveQueue()
    
    console.log(`Queued ${operation} operation:`, item)
    
    // Try to process immediately if online
    if (canProcess.value) {
      processQueue()
    }

    return item.id
  }

  // Process the sync queue
  const processQueue = async (): Promise<void> => {
    if (!canProcess.value || queueLength.value === 0) {
      return
    }

    isProcessing.value = true
    console.log(`Processing ${queueLength.value} queued operations`)

    const results: SyncResult[] = []
    const failedItems: SyncQueueItem[] = []

    for (const item of [...syncQueue.value]) {
      try {
        const result = await processItem(item)
        results.push(result)

        if (result.success) {
          // Remove successful item from queue
          syncQueue.value = syncQueue.value.filter(i => i.id !== item.id)
          console.log(`Successfully processed ${item.operation}:`, item.id)
        } else {
          // Handle failed item
          item.retryCount++
          if (item.retryCount < item.maxRetries) {
            failedItems.push(item)
            console.log(`Retry ${item.retryCount}/${item.maxRetries} for ${item.operation}:`, item.id)
          } else {
            // Remove item after max retries
            syncQueue.value = syncQueue.value.filter(i => i.id !== item.id)
            console.error(`Max retries exceeded for ${item.operation}:`, item.id)
          }
        }
      } catch (error) {
        console.error(`Error processing ${item.operation}:`, error)
        item.retryCount++
        if (item.retryCount < item.maxRetries) {
          failedItems.push(item)
        } else {
          syncQueue.value = syncQueue.value.filter(i => i.id !== item.id)
        }
      }
    }

    // Update queue with failed items that will retry
    saveQueue()
    lastSyncTime.value = new Date()
    isProcessing.value = false

    console.log(`Sync complete. ${results.filter(r => r.success).length} successful, ${failedItems.length} failed`)
  }

  // Process individual sync item
  const processItem = async (item: SyncQueueItem): Promise<SyncResult> => {
    try {
      switch (item.operation) {
        case 'create_booking':
          await createBookingSync(item.data as BookingFormData)
          break
        case 'update_booking':
          await updateBookingSync((item.data as { id: string }).id, item.data as Partial<Booking>)
          break
        case 'create_property':
          await createPropertySync(item.data as PropertyFormData)
          break
        case 'update_property':
          await updatePropertySync((item.data as { id: string }).id, item.data as Partial<Property>)
          break
        case 'delete_booking':
          await deleteBookingSync((item.data as { id: string }).id)
          break
        case 'delete_property':
          await deletePropertySync((item.data as { id: string }).id)
          break
        default:
          throw new Error(`Unknown sync operation: ${item.operation}`)
      }

      return { success: true, item }
    } catch (error) {
      return {
        success: false,
        item,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  // Sync operation implementations using Supabase
  const createBookingSync = async (data: BookingFormData): Promise<void> => {
    const { error } = await supabase.from('bookings').insert(data)
    if (error) throw new Error(`Create booking failed: ${error.message}`)
  }

  const updateBookingSync = async (id: string, data: Partial<Booking>): Promise<void> => {
    // Strip id from the update payload to avoid overwriting it
    const { id: _id, ...updates } = data as Partial<Booking> & { id?: string }
    const { error } = await supabase.from('bookings').update(updates).eq('id', id)
    if (error) throw new Error(`Update booking failed: ${error.message}`)
  }

  const createPropertySync = async (data: PropertyFormData): Promise<void> => {
    const { error } = await supabase.from('properties').insert(data)
    if (error) throw new Error(`Create property failed: ${error.message}`)
  }

  const updatePropertySync = async (id: string, data: Partial<Property>): Promise<void> => {
    const { id: _id, ...updates } = data as Partial<Property> & { id?: string }
    const { error } = await supabase.from('properties').update(updates).eq('id', id)
    if (error) throw new Error(`Update property failed: ${error.message}`)
  }

  const deleteBookingSync = async (id: string): Promise<void> => {
    const { error } = await supabase.from('bookings').delete().eq('id', id)
    if (error) throw new Error(`Delete booking failed: ${error.message}`)
  }

  const deletePropertySync = async (id: string): Promise<void> => {
    // Soft delete: set active = false to preserve historical data
    const { error } = await supabase
      .from('properties')
      .update({ active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) throw new Error(`Delete property failed: ${error.message}`)
  }

  // Utility functions
  const generateId = (): string => {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Clear all queued operations
  const clearQueue = (): void => {
    syncQueue.value = []
    saveQueue()
    console.log('Sync queue cleared')
  }

  // Remove specific operation from queue
  const removeFromQueue = (id: string): boolean => {
    const initialLength = syncQueue.value.length
    syncQueue.value = syncQueue.value.filter(item => item.id !== id)
    const removed = initialLength > syncQueue.value.length
    
    if (removed) {
      saveQueue()
      console.log(`Removed operation ${id} from sync queue`)
    }
    
    return removed
  }

  // Get queue status for UI display
  const getQueueStatus = () => {
    const operations = syncQueue.value.reduce((acc, item) => {
      acc[item.operation] = (acc[item.operation] || 0) + 1
      return acc
    }, {} as Record<SyncOperation, number>)

    return {
      total: queueLength.value,
      operations,
      isProcessing: isProcessing.value,
      lastSync: lastSyncTime.value
    }
  }

  // Retry failed operations
  const retryFailedOperations = async (): Promise<void> => {
    if (canProcess.value) {
      await processQueue()
    }
  }

  // Initialize
  loadQueue()

  // Track listeners and intervals for cleanup
  let autoSyncInterval: ReturnType<typeof setInterval> | null = null
  let updateOnlineStatus: (() => void) | null = null
  let autoSyncOnlineHandler: (() => void) | null = null

  // Setup online status listeners
  onMounted(() => {
    updateOnlineStatus = () => {
      isOnline.value = navigator.onLine
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)
  })

  onUnmounted(() => {
    // Clean up online/offline listeners
    if (updateOnlineStatus) {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
    // Clean up auto-sync interval and listener
    if (autoSyncInterval) {
      clearInterval(autoSyncInterval)
      autoSyncInterval = null
    }
    if (autoSyncOnlineHandler) {
      window.removeEventListener('online', autoSyncOnlineHandler)
      autoSyncOnlineHandler = null
    }
  })

  // Auto-process when coming online
  const startAutoSync = () => {
    const checkAndProcess = () => {
      if (canProcess.value && hasPendingOperations.value) {
        processQueue()
      }
    }

    // Check every 30 seconds when online
    if (autoSyncInterval) clearInterval(autoSyncInterval)
    autoSyncInterval = setInterval(checkAndProcess, 30000)

    // Process immediately when coming online
    if (autoSyncOnlineHandler) {
      window.removeEventListener('online', autoSyncOnlineHandler)
    }
    autoSyncOnlineHandler = checkAndProcess
    window.addEventListener('online', checkAndProcess)
  }

  return {
    // State
    syncQueue: computed(() => syncQueue.value),
    isProcessing,
    lastSyncTime,
    
    // Computed
    queueLength,
    hasPendingOperations,
    canProcess,
    
    // Methods
    queueOperation,
    processQueue,
    clearQueue,
    removeFromQueue,
    getQueueStatus,
    retryFailedOperations,
    startAutoSync
  }
} 