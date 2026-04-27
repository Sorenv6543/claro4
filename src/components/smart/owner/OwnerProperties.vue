<!-- Owner-specific property management page.
     Uses owner-scoped composables (useOwnerProperties, useOwnerBookings)
     to ensure all data is filtered to the current owner only.
     Do NOT bypass these composables to call stores directly. -->

<template>
  <div class="owner-properties-page">
    <v-container class="pt-0" fluid>
      <!-- Flat page header (no gradient) -->
      <div class="page-header">
        <div class="page-header__main">
          <div class="page-header__title-row">
            <h1 class="text-h5 font-weight-bold page-heading">My Properties</h1>
            <v-chip color="primary" size="small" variant="tonal">
              {{ myProperties.length }}
            </v-chip>
          </div>
          <p class="text-body-2 page-subheading">
            Manage your rental properties and settings
          </p>
        </div>
        <v-btn
          v-if="mobile"
          aria-label="Add Property"
          class="flex-shrink-0"
          color="primary"
          icon="mdi-plus"
          size="small"
          @click="handleCreateProperty"
        />
        <v-btn
          v-else
          class="flex-shrink-0"
          color="primary"
          prepend-icon="mdi-plus"
          size="small"
          @click="handleCreateProperty"
        >
          Add Property
        </v-btn>
      </div>

      <!-- C3 — Compact Inline Bar -->
      <div class="c3-inline-bar mb-5">
        <div class="c3-cell">
          <v-icon color="primary" size="20">mdi-home-city</v-icon>
          <span class="c3-value">{{ myProperties.length }}</span>
          <span class="c3-label">Properties</span>
        </div>
        <div class="c3-divider" />
        <div class="c3-cell">
          <v-icon color="success" size="20">mdi-check-circle</v-icon>
          <span class="c3-value">{{ myActiveProperties.length }}</span>
          <span class="c3-label">Active</span>
        </div>
        <div class="c3-divider" />
        <div class="c3-cell">
          <v-icon color="info" size="20">mdi-calendar-multiple</v-icon>
          <span class="c3-value">{{ myBookings.length }}</span>
          <span class="c3-label">Bookings</span>
        </div>
        <div class="c3-divider" />
        <div class="c3-cell">
          <v-icon color="warning" size="20">mdi-swap-horizontal</v-icon>
          <span class="c3-value">{{ myTodayTurns.length }}</span>
          <span class="c3-label">Turns</span>
        </div>
      </div>

      <!-- Segment filter -->
      <div v-if="!mobile" class="d-flex ga-2 flex-wrap mb-4">
        <v-btn
          v-for="seg in segments"
          :key="seg.value"
          :color="selectedSegment === seg.value ? 'primary' : undefined"
          density="compact"
          size="small"
          :variant="selectedSegment === seg.value ? 'flat' : 'outlined'"
          @click="selectedSegment = seg.value"
        >
          {{ seg.title }}
        </v-btn>
      </div>

      <!-- Property expansion list -->
      <PropertyExpansionList
        :bookings="myBookings"
        :loading="propertiesLoading"
        :properties="propertyItems"
        @delete="handleDeleteProperty"
        @edit="editProperty"
        @view="viewProperty"
      />
    </v-container>

    <!-- Property Modal - Same modal system as HomeOwner -->
    <PropertyModal
      :existing-property-count="myProperties.length"
      :mode="propertyModalMode"
      :open="propertyModalOpen"
      :owner-id="authStore.user?.id || ''"
      :property="propertyModalData"
      :stepper="propertyModalMode === 'create'"
      @close="handlePropertyModalClose"
      @delete="handlePropertyModalDelete"
      @save="handlePropertyModalSave"
      @skip="handlePropertyModalSkip"
    />

    <!-- Confirmation Dialog - Same system as HomeOwner -->
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
  </div>
</template>

<script setup lang="ts">
  import type { Property, PropertyFormData, PropertyRecord } from '@/types'
  import { computed, onMounted, ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import PropertyModal from '@/components/dumb/shared/PropertyModal.vue'
  import PropertyExpansionList from '@/components/dumb/owner/PropertyExpansionList.vue'

  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useAuthStore } from '@/stores/auth'
  import { useUIStore } from '@/stores/ui'
  import { formatPropertyAddress } from '@/types/property'

  // Component metadata
  defineOptions({
    name: 'OwnerProperties',
  })

  const uiStore = useUIStore()
  const authStore = useAuthStore()
  const router = useRouter()
  const { mobile } = useDisplay()

  const {
    myProperties,
    myActiveProperties,
    fetchMyProperties,
    createMyProperty,
    updateMyProperty,
    deleteMyProperty,
    error: propertyError,
    loading: propertiesLoading,
  } = useOwnerProperties()

  const {
    myBookings,
    myTodayTurns,
    fetchMyBookings,
  } = useOwnerBookings()

  // Segment tabs
  const selectedSegment = ref('all')

  const segments = [
    { title: 'All', value: 'all' },
    { title: 'Active', value: 'active' },
    { title: 'Inactive', value: 'inactive' },
  ]

  // Count bookings per property so we can block deletion when bookings exist
  const bookingCountByProperty = computed(() => {
    const counts = new Map<string, number>()
    for (const booking of myBookings.value) {
      counts.set(booking.property_id, (counts.get(booking.property_id) ?? 0) + 1)
    }
    return counts
  })

  // Computed property items for the table
  const propertyItems = computed(() => {
    let items = myProperties.value
    if (selectedSegment.value === 'active') {
      items = items.filter(p => p.active)
    } else if (selectedSegment.value === 'inactive') {
      items = items.filter(p => !p.active)
    }
    return items.map(property => ({
      ...property,
      display_name: formatPropertyAddress(property, 'short'),
      full_address: formatPropertyAddress(property),
      booking_count: bookingCountByProperty.value.get(property.id) ?? 0,
    }))
  })

  // ============================================================================
  // UI STATE - SAME MODAL MANAGEMENT AS HomeOwner
  // ============================================================================

  // Property Modal - Same pattern as HomeOwner
  const propertyModalOpen = computed(() => uiStore.isModalOpen('propertyModal'))
  const propertyModalMode = computed(() => {
    const modal = uiStore.getModalState('propertyModal')
    return (modal?.mode as 'create' | 'edit') || 'create'
  })
  const propertyModalData = computed(() => {
    const modal = uiStore.getModalState('propertyModal')
    return modal?.data as Property | undefined
  })

  // Confirmation Dialog - Same pattern as HomeOwner
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
  // EVENT HANDLERS - SAME ORCHESTRATION PATTERN AS HomeOwner
  // ============================================================================

  function handleCreateProperty (): void {
    const propertyData = {
      owner_id: authStore.user?.id,
    }
    uiStore.openModal('propertyModal', 'create', propertyData)
  }

  async function handleDeleteProperty (propertyId: string): Promise<void> {
    const property = myProperties.value.find(p => p.id === propertyId)
    if (!property) return

    const bookingCount = bookingCountByProperty.value.get(propertyId) ?? 0
    const label = formatPropertyAddress(property, 'short')

    if (bookingCount > 0) {
      uiStore.openConfirmDialog('confirmDialog', {
        title: 'Cannot Delete Property',
        message: `"${label}" has ${bookingCount} booking${bookingCount === 1 ? '' : 's'}. Please delete or complete them before removing this property.`,
        confirmText: 'View Bookings',
        cancelText: 'OK',
        dangerous: false,
        data: { type: 'property-blocked', id: propertyId },
      })
      return
    }

    uiStore.openConfirmDialog('confirmDialog', {
      title: 'Delete Property',
      message: `Are you sure you want to delete "${label}"? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      dangerous: true,
      data: { type: 'property', id: propertyId },
    })
  }

  // Navigation functions
  function editProperty (id: string): void {
    const property = myProperties.value.find(p => p.id === id)
    if (property) uiStore.openModal('propertyModal', 'edit', property as PropertyRecord)
  }

  function viewProperty (id: string): void {
    router.push(`/owner/properties/${id}`)
  }

  // ============================================================================
  // MODAL EVENT HANDLERS - SAME PATTERN AS HomeOwner
  // ============================================================================

  function handlePropertyModalClose (): void {
    uiStore.closeModal('propertyModal')
  }

  async function handlePropertyModalSave (data: PropertyFormData): Promise<void> {
    try {
      const propertyData = {
        ...data,
        owner_id: authStore.user?.id,
      }

      if (propertyModalMode.value === 'create') {
        const id = await createMyProperty(propertyData as PropertyFormData)
        if (!id) {
          const message = propertyError.value || 'Failed to create your property'
          uiStore.addNotification('error', 'Save Failed', message)
          return
        }
      } else if (propertyModalData.value) {
        // Verify owner can update this property (same check as HomeOwner)
        if (propertyModalData.value.owner_id !== authStore.user?.id) {
          throw new Error('Cannot update property not owned by current user')
        }
        const success = await updateMyProperty(propertyModalData.value.id, propertyData as Partial<PropertyFormData>)
        if (!success) {
          const message = propertyError.value || 'Failed to update your property'
          uiStore.addNotification('error', 'Save Failed', message)
          return
        }
      }
      uiStore.closeModal('propertyModal')
    } catch (error) {
      const message = propertyError.value || (error instanceof Error ? error.message : 'Failed to save your property')
      console.error('[OwnerProperties] Failed to save property:', error)
      uiStore.addNotification('error', 'Save Failed', message)
    }
  }

  async function handlePropertyModalSkip (data: PropertyFormData): Promise<void> {
    const id = await createMyProperty(data)
    if (id) {
      uiStore.closeModal('propertyModal')
      router.push(`/owner/properties/${id}`)
    } else {
      const message = propertyError.value || 'Property creation failed'
      console.error('[OwnerProperties] Property creation failed during skip:', propertyError.value)
      uiStore.addNotification('error', 'Creation Failed', message)
    }
  }

  async function handlePropertyModalDelete (propertyId: string): Promise<void> {
    const property = myProperties.value.find(p => p.id === propertyId)
    if (!property || property.owner_id !== authStore.user?.id) {
      console.warn('Cannot delete property not owned by current user')
      return
    }

    await handleDeleteProperty(propertyId)
  }

  // ============================================================================
  // CONFIRMATION DIALOG HANDLERS - SAME PATTERN AS HomeOwner
  // ============================================================================

  async function handleConfirmDialogConfirm (): Promise<void> {
    const data = confirmDialogData.value

    if (data?.type === 'property-blocked') {
      uiStore.closeConfirmDialog('confirmDialog')
      router.push('/owner/bookings')
      return
    }

    if (data?.type === 'property' && data?.id) {
      try {
        const success = await deleteMyProperty(data.id as string)
        if (success) {
          uiStore.closeModal('propertyModal')
        } else {
          const message = propertyError.value || 'Failed to delete your property'
          console.error('[OwnerProperties] Failed to delete property:', message)
          uiStore.addNotification('error', 'Delete Failed', message)
        }
      } catch (error) {
        const message = propertyError.value || (error instanceof Error ? error.message : 'Failed to delete your property')
        console.error('[OwnerProperties] Failed to delete property:', error)
        uiStore.addNotification('error', 'Delete Failed', message)
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
  // LIFECYCLE - SAME INITIALIZATION AS HomeOwner
  // ============================================================================

  onMounted(async () => {
    if (authStore.isAuthenticated && authStore.user?.role === 'owner') {
      try {
        await Promise.all([
          fetchMyProperties(),
          fetchMyBookings(),
        ])
      } catch (error: unknown) {
        console.error('Failed to load properties data:', error)
        uiStore.addNotification('error', 'Error', 'Failed to load properties. Please refresh.')
      }
    }
  })
</script>

<style scoped>
.owner-properties-page {
  padding: 0 1rem 1rem 1rem;
  min-height: calc(100vh - var(--app-bar-height, 64px));
}

/* C3 — Compact Inline Bar */
.c3-inline-bar {
  display: flex;
  align-items: stretch;
  flex-wrap: wrap;
  min-height: 64px;
  border-radius: var(--claro-radius-sm);
  background: var(--claro-surface);
  border: 1px solid var(--claro-divider);
  overflow: hidden;
}

.c3-cell {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
}

.c3-divider {
  width: 1px;
  align-self: stretch;
  background: var(--claro-divider);
}

.c3-value {
  font-size: 20px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-on-surface);
  line-height: 1;
}

.c3-label {
  font-size: 12px;
  color: var(--claro-text-secondary);
}

</style>
