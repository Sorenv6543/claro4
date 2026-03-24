<!-- Owner-specific property management page.
     Uses owner-scoped composables (useOwnerProperties, useOwnerBookings)
     to ensure all data is filtered to the current owner only.
     Do NOT bypass these composables to call stores directly. -->

<template>
  <div class="owner-properties-container">
    <!-- Property Management Interface -->
    <v-container fluid>
      <v-row>
        <v-col cols="12">
          <div class="d-flex justify-space-between align-center mb-4">
            <h1 class="text-h4">
              My Properties
            </h1>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              @click="handleCreateProperty"
            >
              Add Property
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <v-row class="mb-2 compact-stats-row">
        <v-col
          class="pa-1"
          cols="6"
          sm="3"
        >
          <v-card
            class="compact-stat-card stat-card-primary"
            elevation="1"
          >
            <v-card-text class="pa-2 text-center">
              <div class="stat-number">
                {{ myProperties.length }}
              </div>
              <div class="stat-label">
                Total Properties
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col
          class="pa-1"
          cols="6"
          sm="3"
        >
          <v-card
            class="compact-stat-card stat-card-success"
            elevation="1"
          >
            <v-card-text class="pa-2 text-center">
              <div class="stat-number">
                {{ myActiveProperties.length }}
              </div>
              <div class="stat-label">
                Active Properties
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col
          class="pa-1"
          cols="6"
          sm="3"
        >
          <v-card
            class="compact-stat-card stat-card-info"
            elevation="1"
          >
            <v-card-text class="pa-2 text-center">
              <div class="stat-number">
                {{ myBookings.length }}
              </div>
              <div class="stat-label">
                Total Bookings
              </div>
            </v-card-text>
          </v-card>
        </v-col>
        <v-col
          class="pa-1"
          cols="6"
          sm="3"
        >
          <v-card
            class="compact-stat-card stat-card-warning"
            elevation="1"
          >
            <v-card-text class="pa-2 text-center">
              <div class="stat-number">
                {{ myTodayTurns.length }}
              </div>
              <div class="stat-label">
                Today's Turns
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Property List -->
      <v-row>
        <v-col
          v-for="property in myProperties"
          :key="property.id"
          class="pa-2"
          cols="12"
          lg="3"
          md="4"
          sm="6"
        >
          <v-card
            class="compact-property-card"
            elevation="2"
            :style="{ borderLeft: '4px solid ' + property.color }"
            @click="viewProperty(property)"
          >
            <v-card-text class="pa-3">
              <div class="d-flex align-center justify-space-between mb-2">
                <v-icon
                  :color="property.color"
                  size="20"
                >
                  {{ getPropertyIcon(property.property_type) }}
                </v-icon>
                <v-menu>
                  <template #activator="{ props: menuProps }">
                    <v-btn
                      v-bind="menuProps"
                      icon="mdi-dots-vertical"
                      size="x-small"
                      variant="text"
                      @click.stop
                    />
                  </template>
                  <v-list density="compact">
                    <v-list-item @click="editProperty(property)">
                      <v-list-item-title>Edit</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="viewProperty(property)">
                      <v-list-item-title>View</v-list-item-title>
                    </v-list-item>
                    <v-list-item @click="handleDeleteProperty(property.id)">
                      <v-list-item-title>Delete</v-list-item-title>
                    </v-list-item>
                  </v-list>
                </v-menu>
              </div>

              <div class="property-name mb-1">
                {{ formatPropertyAddress(property, 'short') }}
              </div>
              <div class="property-address mb-2">
                {{ formatPropertyAddress(property) }}
              </div>

              <div class="property-details">
                <span class="detail-item">
                  <v-icon
                    class="mr-1"
                    size="12"
                  >mdi-bed</v-icon>
                  {{ property.bedrooms || 0 }}
                </span>
                <span class="detail-item">
                  <v-icon
                    class="mr-1"
                    size="12"
                  >mdi-shower</v-icon>
                  {{ property.bathrooms || 0 }}
                </span>
                <span class="detail-item">
                  <v-icon
                    class="mr-1"
                    size="12"
                  >mdi-home</v-icon>
                  {{ property.property_type || 'N/A' }}
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Empty State -->
      <v-row v-if="myProperties.length === 0">
        <v-col
          class="text-center py-8"
          cols="12"
        >
          <v-icon
            class="mb-4"
            color="grey-lighten-1"
            size="64"
          >
            mdi-home-outline
          </v-icon>
          <h3 class="text-h6 mb-2">
            No Properties Yet
          </h3>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Add your first property to start managing bookings and cleanings.
          </p>
          <v-btn
            color="primary"
            prepend-icon="mdi-plus"
            @click="handleCreateProperty"
          >
            Add Your First Property
          </v-btn>
        </v-col>
      </v-row>
    </v-container>

    <!-- Property Modal - Same modal system as HomeOwner -->
    <PropertyModal
      :existing-property-count="myProperties.length"
      :mode="propertyModalMode"
      :open="propertyModalOpen"
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
  import { computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import PropertyModal from '@/components/dumb/shared/PropertyModal.vue'

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

  const {
    myProperties,
    myActiveProperties,
    fetchMyProperties,
    createMyProperty,
    updateMyProperty,
    deleteMyProperty,
    error: propertyError,
  } = useOwnerProperties()

  const {
    myBookings,
    myTodayTurns,
    fetchMyBookings,
  } = useOwnerBookings()

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
  // HELPER FUNCTIONS - STYLING AND ICONS
  // ============================================================================

  // Property type icon mapping
  function getPropertyIcon (propertyType?: string): string {
    switch (propertyType) {
      case 'house': { return 'mdi-home'
      }
      case 'apartment': { return 'mdi-apartment'
      }
      case 'condo': { return 'mdi-office-building'
      }
      case 'townhouse': { return 'mdi-home-group'
      }
      default: { return 'mdi-home-outline'
      }
    }
  }

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

    uiStore.openConfirmDialog('confirmDialog', {
      title: 'Delete Property',
      message: `Are you sure you want to delete "${formatPropertyAddress(property, 'short')}"? This will also delete all associated bookings. This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      dangerous: true,
      data: { type: 'property', id: propertyId },
    })
  }

  // Navigation functions
  function editProperty (property: Property): void {
    uiStore.openModal('propertyModal', 'edit', property as PropertyRecord)
  }

  function viewProperty (property: Property): void {
    router.push(`/owner/properties/${property.id}`)
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

    uiStore.openConfirmDialog('confirmDialog', {
      title: 'Delete Property',
      message: `Are you sure you want to delete "${formatPropertyAddress(property, 'short')}"? This will also delete all associated bookings. This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      dangerous: true,
      data: { type: 'property', id: propertyId },
    })
  }

  // ============================================================================
  // CONFIRMATION DIALOG HANDLERS - SAME PATTERN AS HomeOwner
  // ============================================================================

  async function handleConfirmDialogConfirm (): Promise<void> {
    const data = confirmDialogData.value

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
      await Promise.all([
        fetchMyProperties(),
        fetchMyBookings(),
      ])
    }
  })
</script>

<style scoped>
.owner-properties-container {
  padding: 1rem;
  min-height: calc(100vh - var(--app-bar-height, 64px));
}

.v-card {
  height: 100%;
}

/* Compact stat cards */
.compact-stats-row {
  max-height: 60px;
}

.compact-stat-card {
  min-height: auto !important;
  height: 60px !important;
  cursor: default;
}

.compact-stat-card .v-card-text {
  padding: 8px !important;
}

.stat-number {
  font-size: 1.25rem !important;
  font-weight: 600;
  line-height: 1.2;
  margin-bottom: 2px;
}

.stat-label {
  font-size: 0.7rem !important;
  line-height: 1;
  opacity: 0.9;
}

/* Stat card color themes */
.stat-card-primary {
  background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
  border-left: 4px solid rgb(var(--v-theme-primary));
}

.stat-card-primary .stat-number {
  color: rgb(var(--v-theme-primary));
}

.stat-card-success {
  background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
  border-left: 4px solid rgb(var(--v-theme-success));
}

.stat-card-success .stat-number {
  color: rgb(var(--v-theme-success));
}

.stat-card-info {
  background: linear-gradient(135deg, #f3e5f5 0%, #e1bee7 100%);
  border-left: 4px solid rgb(var(--v-theme-secondary));
}

.stat-card-info .stat-number {
  color: rgb(var(--v-theme-secondary));
}

.stat-card-warning {
  background: linear-gradient(135deg, #fff3e0 0%, #ffcc02 100%);
  border-left: 4px solid rgb(var(--v-theme-warning));
}

.stat-card-warning .stat-number {
  color: rgb(var(--v-theme-warning));
}

/* Compact property cards */
.compact-property-card {
  min-height: auto !important;
  height: 140px !important;
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: 12px !important;
}

.compact-property-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.property-name {
  font-size: 0.9rem;
  font-weight: 600;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.property-address {
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface-variant));
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.property-details {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.detail-item {
  display: flex;
  align-items: center;
  font-size: 0.7rem;
  color: rgb(var(--v-theme-on-surface-variant));
  background: rgba(var(--v-theme-surface-variant), 0.3);
  padding: 2px 6px;
  border-radius: 4px;
}

.owner-properties-container {
  --owner-primary: rgb(var(--v-theme-primary));
  --owner-accent: rgb(var(--v-theme-secondary));
  --owner-surface: rgb(var(--v-theme-surface));
  --owner-border: rgb(var(--v-theme-on-surface), 0.12);
}
</style>
