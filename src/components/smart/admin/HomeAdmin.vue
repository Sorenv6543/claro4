<!--
👑 ADMIN INTERFACE
 src/components/smart/admin/HomeAdmin.vue -

✅ UNFILTERED VIEW - Admin sees all data
✅ Access to all properties across all owners
✅ System-wide metrics and controls
✅ Can manage any owner's data

 -->
<template>
  <div class="home-admin-layout">
    <!-- Main Dashboard Content (sidebar and header are now in admin layout) -->
    <AdminDashboard
      @status-change="handleStatusChange"
      @view-booking="handleViewBooking"
    />
  </div>

  <!-- Owner-focused Modals -->

  <PropertyModal
    :mode="propertyModalMode"
    :open="propertyModalOpen"
    :owner-id="authStore.user?.id || ''"
    :property="propertyModalData"
    @close="handlePropertyModalClose"
    @delete="handlePropertyModalDelete"
    @save="handlePropertyModalSave"
  />

  <ConfirmationDialog
    :cancel-text="confirmDialogCancelText"
    :confirm-text="confirmDialogConfirmText"
    :dangerous="confirmDialogDangerous"
    :message="confirmDialogMessage"
    :open="confirmDialogOpen"
    :title="confirmDialogTitle"
    @cancel="handleConfirmDialogCancel"
    @close="handleConfirmDialogClose"
    @confirm="handleConfirmDialogConfirm"
  />
</template>

<script setup lang="ts">
  import type { Property, PropertyFormData } from '@/types'
  import type { Booking } from '@/types/booking'
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'

  import { useDisplay } from 'vuetify'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import PropertyModal from '@/components/dumb/shared/PropertyModal.vue'
  import AdminDashboard from '@/components/smart/admin/AdminDashboard.vue'
  import { useSupabaseBookings } from '@/composables/supabase/useSupabaseBookings'
  import { useSupabaseProperties } from '@/composables/supabase/useSupabaseProperties'
  import { useAuthStore } from '@/stores/auth'
  import { usePropertyStore } from '@/stores/property'
  import { useUIStore } from '@/stores/ui'

  // ============================================================================
  // REACTIVE STATE
  // ============================================================================

  import { formatPropertyAddress } from '@/types/property'

  const uiStore = useUIStore()
  const propertyStore = usePropertyStore()
  const { createProperty: supaCreateProperty, updateProperty: supaUpdateProperty, deleteProperty: supaDeleteProperty } = useSupabaseProperties()
  const { deleteBooking: supaDeleteBooking } = useSupabaseBookings()
  const authStore = useAuthStore()
  const { xs } = useDisplay()

  const sidebarOpen = ref(true)

  // ============================================================================
  // COMPUTED PROPERTIES - STATE
  // ============================================================================

  const isAdminAuthenticated = computed(() => {
    return authStore.isAuthenticated && authStore.user?.role === 'admin'
  })

  // ============================================================================
  // API FUNCTIONS
  // ============================================================================

  async function fetchAllUsers (): Promise<void> {
    // Placeholder for fetching all users
    // This should be implemented based on your API/store structure
    console.log('📊 [HomeAdmin] fetchAllUsers called')
  }

  // ============================================================================
  // UI STATE - MODAL MANAGEMENT
  // ============================================================================

  // Property Modal
  const propertyModalOpen = computed(() => uiStore.isModalOpen('propertyModal'))
  const propertyModalMode = computed(() => {
    const modal = uiStore.getModalState('propertyModal')
    return (modal?.mode as 'create' | 'edit') || 'create'
  })
  const propertyModalData = computed(() => {
    const modal = uiStore.getModalState('propertyModal')
    return modal?.data as Property | undefined
  })

  // Confirmation Dialog
  const confirmDialogOpen = computed(() => uiStore.isConfirmDialogOpen('confirmDialog'))
  const confirmDialogTitle = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.title || 'Confirm'
  })
  const confirmDialogMessage = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.message || 'Are you sure you want to proceed?'
  })
  const confirmDialogConfirmText = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.confirmText || 'Confirm'
  })
  const confirmDialogCancelText = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.cancelText || 'Cancel'
  })
  const confirmDialogDangerous = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.dangerous || false
  })
  const confirmDialogData = computed(() => {
    const dialog = uiStore.getConfirmDialogState('confirmDialog')
    return dialog?.data
  })

  // ============================================================================
  // PROPERTY MODAL HANDLERS
  // ============================================================================

  function handlePropertyModalClose (): void {
    uiStore.closeModal('propertyModal')
  }

  async function handlePropertyModalSave (formData: PropertyFormData): Promise<void> {
    try {
      if (propertyModalMode.value === 'create') {
        await supaCreateProperty(formData)
      } else {
        const existingProperty = propertyModalData.value
        if (existingProperty) {
          await supaUpdateProperty(existingProperty.id, formData)
        }
      }
      uiStore.closeModal('propertyModal')
    } catch (error) {
      console.error('Failed to save property:', error)
      uiStore.addNotification('error', 'Save Failed', error instanceof Error ? error.message : 'Could not save property')
    }
  }

  async function handlePropertyModalDelete (propertyId: string): Promise<void> {
    const property = propertyStore.getPropertyById(propertyId)
    const propertyName = property ? formatPropertyAddress(property, 'short') : 'this property'
    uiStore.openConfirmDialog('confirmDialog', {
      title: 'Delete Property',
      message: `Are you sure you want to delete "${propertyName}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      dangerous: true,
      data: { type: 'property', id: propertyId },
    })
  }

  // ============================================================================
  // ADMIN DASHBOARD EVENT HANDLERS
  // ============================================================================

  function handleViewBooking (booking: Booking): void {
    uiStore.openModal('bookingDetails', 'view', { booking })
  }

  function handleStatusChange (booking: Booking): void {
    uiStore.openModal('bookingStatus', 'view', { booking })
  }

  // ============================================================================
  // CONFIRMATION DIALOG HANDLERS
  // ============================================================================

  async function handleConfirmDialogConfirm (): Promise<void> {
    const data = confirmDialogData.value

    if (data?.type === 'booking' && data?.id) {
      try {
        await supaDeleteBooking(data.id as string)
        uiStore.closeModal('eventModal')
      } catch (error) {
        console.error('Failed to delete booking:', error)
        uiStore.addNotification('error', 'Delete Failed', error instanceof Error ? error.message : 'Could not delete booking')
        return
      }
    } else if (data?.type === 'property' && data?.id) {
      try {
        await supaDeleteProperty(data.id as string)
        uiStore.closeModal('propertyModal')
      } catch (error) {
        console.error('Failed to delete property:', error)
        uiStore.addNotification('error', 'Delete Failed', error instanceof Error ? error.message : 'Could not delete property')
        return
      }
    }

    uiStore.closeConfirmDialog('confirmDialog')
  }

  function handleConfirmDialogCancel (): void {
    uiStore.closeConfirmDialog('confirmDialog')
  }

  function handleConfirmDialogClose (): void {
    uiStore.closeConfirmDialog('confirmDialog')
  }

  // ============================================================================
  // LIFECYCLE HOOKS
  // ============================================================================

  console.log('🔄 [HomeAdmin] Admin component script setup running...')

  // Watch for template rendering (proper debugging)
  watch(isAdminAuthenticated, newValue => {
    console.log('🎨 [HomeAdmin] Template will render, isAdminAuthenticated:', newValue)
  }, { immediate: true })

  async function loadSystemData () {
    try {
      await Promise.all([
        // Property data loaded via useSupabaseProperties realtime sync
        Promise.resolve(),
        // bookingStore.fetchBookings() removed — data loaded via realtime sync
        fetchAllUsers(),
      ])
      console.log('✅ [HomeAdmin] System data loaded successfully')
    } catch (error) {
      console.error('❌ [HomeAdmin] Failed to load system data:', error)
    }
  }

  onMounted(() => {
    console.log('🚀 [HomeAdmin] Admin component mounted successfully!')
    // If auth is already resolved, load data immediately
    if (isAdminAuthenticated.value) {
      loadSystemData()
    }
  // Otherwise the watch below will trigger when auth resolves
  })

  onUnmounted(() => {
  // Cleanup if needed
  })

  // ============================================================================
  // RESPONSIVE BEHAVIOR
  // ============================================================================

  watch(xs, newValue => {
    if (newValue) {
      sidebarOpen.value = false
    }
  })

  // Watch for authentication changes — also covers the case where auth
  // is still loading when onMounted fires (replaces the old 5s polling loop).
  watch(isAdminAuthenticated, (newValue, oldValue) => {
    if (newValue && !oldValue) {
      loadSystemData()
    }
  })
</script>

<style scoped>
/* ================================================================ */
/* ADMIN-SPECIFIC LAYOUT STYLES */
/* ================================================================ */

.home-admin-layout {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.calendar-main-container {
  flex: 1;
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  transition: margin-left 0.3s ease-in-out;
  margin-left: 0;
}

.calendar-main-container.sidebar-open {
  margin-left: 280px; /* Match sidebar width */
}

/* Responsive behavior - overlay on mobile */
@media (max-width: 959px) {
  .calendar-main-container.sidebar-open {
    margin-left: 0; /* No push on mobile */
  }

  .main-app-header.sidebar-open {
    margin-left: 0; /* No push on mobile */
  }
}

.calendar-layout {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.calendar-header-card {
  flex-shrink: 0;
  border-bottom: 1px solid rgb(var(--v-theme-on-surface), 0.12);
  background: rgb(var(--v-theme-surface));
  height: 48px;
  min-height: 48px;
  max-height: 48px;
}

.prominent-header {
  background: linear-gradient(135deg, rgb(var(--v-theme-primary)) 0%, rgba(var(--v-theme-primary), 0.9) 100%) !important;
  border-bottom: 3px solid rgba(var(--v-theme-secondary), 0.8) !important;
  height: 80px !important;
  min-height: 80px !important;
  max-height: 80px !important;
  box-shadow: 0 4px 12px rgba(var(--v-theme-primary), 0.25) !important;
}

/* Admin-specific header styling */
.admin-header {
  background: linear-gradient(135deg, #d32f2f 0%, rgba(211, 47, 47, 0.9) 100%) !important;
  border-bottom: 3px solid rgba(255, 152, 0, 0.8) !important;
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.25) !important;
}

.calendar-content {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  position: relative;
  height: calc(100% - 80px); /* Subtract admin header height */
}

/* Admin-specific navigation arrows */
.nav-arrow-prominent.admin-nav {
  background: rgba(255, 255, 255, 0.95) !important;
  color: #d32f2f !important;
  border: 2px solid rgba(255, 255, 255, 0.8) !important;
}

.nav-arrow-prominent.admin-nav:hover {
  background: rgba(255, 255, 255, 1) !important;
  transform: scale(1.05) !important;
  box-shadow: 0 4px 12px rgba(211, 47, 47, 0.2) !important;
}

/* Admin month display */
.month-display-prominent.admin-month {
  background: rgba(255, 255, 255, 0.95);
  color: #d32f2f;
  padding: 12px 24px;
  border-radius: 2px;
  text-align: center;
  min-width: 250px;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  backdrop-filter: blur(10px);
}

.admin-metrics {
  font-size: 0.75rem;
  font-weight: 500;
  color: rgba(211, 47, 47, 0.8);
  line-height: 1;
  margin-top: 4px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

/* ================================================================ */
/* MAIN APP HEADER - ADMIN STYLING */
/* ================================================================ */

.main-app-header {
  background: white !important;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  border-bottom: 1px solid #e0e0e0 !important;
  z-index: 19 !important;
  transition: margin-left 0.3s ease-in-out;
  margin-left: 0;
}

.main-app-header.sidebar-open {
  margin-left: 280px;
}

.app-title {
  display: flex !important;
  justify-content: center !important;
  align-items: center !important;
}

.brand-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-icon {
  background: #1976d2;
  color: white;
  width: 32px;
  height: 32px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.1rem;
}

/* Admin brand styling */
.brand-icon.admin-brand {
  background: #d32f2f;
  border: 2px solid #ff9800;
  animation: admin-pulse 3s infinite;
}

@keyframes admin-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(211, 47, 47, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(211, 47, 47, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(211, 47, 47, 0);
  }
}

.brand-text {
  color: #d32f2f;
  font-weight: 700;
  font-size: 1.1rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.main-app-header .v-app-bar-nav-icon {
  color: #d32f2f !important;
}

.main-app-header .v-app-bar-nav-icon:hover {
  background: rgba(211, 47, 47, 0.05) !important;
}

/* ================================================================ */
/* ADMIN SPEED DIAL ACTIONS */
/* ================================================================ */

.speed-dial-action {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 8px;
  width: 140px;
  margin-bottom: 8px;
}

.speed-dial-action .text-body-2 {
  justify-self: end;
  white-space: nowrap;
  color: #d32f2f;
  font-weight: 600;
}

.speed-dial-action .v-fab {
  justify-self: center;
}

/* ================================================================ */
/* RESPONSIVE MOBILE-FIRST ENHANCEMENTS */
/* ================================================================ */

@media (max-width: 959px) {
  .home-admin-layout {
    height: 100vh !important;
    height: calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom)) !important;
  }

  .calendar-main-container {
    height: calc(100vh - 56px - env(safe-area-inset-top) - env(safe-area-inset-bottom)) !important;
    margin-top: calc(56px + env(safe-area-inset-top)) !important;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .prominent-header.admin-header {
    height: 70px !important;
    min-height: 70px !important;
    max-height: 70px !important;
  }

  .calendar-content {
    height: calc(100% - 70px) !important;
  }

  .month-display-prominent.admin-month {
    min-width: 180px !important;
    padding: 8px 16px !important;
  }
}

@media (min-width: 960px) {
  .calendar-main-container {
    margin-left: 0;
    height: calc(100vh - 56px) !important;
    margin-top: 56px !important;
  }
}
</style>
