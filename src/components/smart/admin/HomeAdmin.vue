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
  import { useAdminBookings } from '@/composables/admin/useAdminBookings'
  import { useAdminProperties } from '@/composables/admin/useAdminProperties'
  import { useAuthStore } from '@/stores/auth'
  import { usePropertyStore } from '@/stores/property'
  import { useUIStore } from '@/stores/ui'
  // ============================================================================
  // REACTIVE STATE
  // ============================================================================
  import { formatPropertyAddress } from '@/types/property'

  const uiStore = useUIStore()
  const propertyStore = usePropertyStore()
  const { createProperty, updateProperty, deleteProperty } = useAdminProperties()
  const { deleteBooking } = useAdminBookings()
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
        await createProperty(formData)
      } else {
        const existingProperty = propertyModalData.value
        if (existingProperty) {
          await updateProperty(existingProperty.id, formData)
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
        await deleteBooking(data.id as string)
        uiStore.closeModal('eventModal')
      } catch (error) {
        console.error('Failed to delete booking:', error)
        uiStore.addNotification('error', 'Delete Failed', error instanceof Error ? error.message : 'Could not delete booking')
        return
      }
    } else if (data?.type === 'property' && data?.id) {
      try {
        await deleteProperty(data.id as string)
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
