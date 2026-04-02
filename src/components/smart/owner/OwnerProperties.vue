<!-- Owner-specific property management page.
     Uses owner-scoped composables (useOwnerProperties, useOwnerBookings)
     to ensure all data is filtered to the current owner only.
     Do NOT bypass these composables to call stores directly. -->

<template>
  <div class="owner-properties-page">
    <v-container fluid>
      <!-- Header -->
      <div class="d-flex justify-space-between align-center mb-5">
        <div>
          <h1 class="text-h4 font-weight-bold">My Properties</h1>
          <p class="text-body-2 text-medium-emphasis mt-1">Manage your rental properties and settings</p>
        </div>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="handleCreateProperty"
        >
          Add Property
        </v-btn>
      </div>

      <!-- Stat Cards Row -->
      <v-row class="mb-5" density="compact">
        <v-col cols="6" sm="3">
          <StatCard
            color="primary"
            icon="mdi-home-city"
            label="Total Properties"
            :value="myProperties.length"
          />
        </v-col>
        <v-col cols="6" sm="3">
          <StatCard
            color="success"
            icon="mdi-check-circle"
            label="Active"
            :value="myActiveProperties.length"
          />
        </v-col>
        <v-col cols="6" sm="3">
          <StatCard
            color="info"
            icon="mdi-calendar-multiple"
            label="Total Bookings"
            :value="myBookings.length"
          />
        </v-col>
        <v-col cols="6" sm="3">
          <StatCard
            color="warning"
            icon="mdi-swap-horizontal"
            label="Today's Turns"
            :value="myTodayTurns.length"
          />
        </v-col>
      </v-row>

      <!-- Data Table -->
      <MaterioDataTable
        expandable
        :headers="tableHeaders"
        :items="propertyItems"
        :loading="false"
        :search-keys="['display_name', 'full_address', 'property_type']"
        searchable
      >
        <!-- Property column with color dot and address -->
        <template #[`item.display_name`]="{ item }">
          <div class="d-flex align-center ga-2">
            <div
              class="property-color-dot"
              :style="{ backgroundColor: item.color }"
            />
            <div>
              <div class="font-weight-medium">{{ item.display_name }}</div>
              <div class="text-caption text-medium-emphasis">{{ item.full_address }}</div>
            </div>
          </div>
        </template>

        <!-- Bedrooms -->
        <template #[`item.bedrooms`]="{ item }">
          <div class="d-flex align-center ga-1">
            <v-icon color="medium-emphasis" size="16">mdi-bed-outline</v-icon>
            <span class="text-body-2">{{ item.bedrooms || 0 }}</span>
          </div>
        </template>

        <!-- Bathrooms -->
        <template #[`item.bathrooms`]="{ item }">
          <div class="d-flex align-center ga-1">
            <v-icon color="medium-emphasis" size="16">mdi-shower</v-icon>
            <span class="text-body-2">{{ item.bathrooms || 0 }}</span>
          </div>
        </template>

        <!-- Type chip -->
        <template #[`item.property_type`]="{ item }">
          <v-chip color="secondary" size="small" variant="tonal">
            <v-icon size="14" start>{{ getPropertyIcon(item.property_type) }}</v-icon>
            {{ item.property_type || 'N/A' }}
          </v-chip>
        </template>

        <!-- Status chip -->
        <template #[`item.active`]="{ item }">
          <v-chip
            :color="item.active ? 'success' : 'error'"
            size="small"
            variant="tonal"
          >
            {{ item.active ? 'Active' : 'Inactive' }}
          </v-chip>
        </template>

        <!-- Actions -->
        <template #[`item.actions`]="{ item }">
          <div class="d-flex align-center ga-1">
            <v-btn
              color="primary"
              icon="mdi-eye-outline"
              size="small"
              variant="text"
              @click.stop="viewProperty(item)"
            />
            <v-btn
              color="primary"
              icon="mdi-pencil-outline"
              size="small"
              variant="text"
              @click.stop="editProperty(item)"
            />
            <v-btn
              color="error"
              icon="mdi-delete-outline"
              size="small"
              variant="text"
              @click.stop="handleDeleteProperty(item.id)"
            />
          </div>
        </template>

        <!-- Expanded row content -->
        <template #expand-content="{ item }">
          <div class="expanded-content pa-4">
            <v-row density="compact">
              <v-col cols="12" md="3" sm="6">
                <div class="expanded-field">
                  <div class="text-caption text-medium-emphasis mb-1">Special Instructions</div>
                  <div class="text-body-2">{{ item.special_instructions || 'None' }}</div>
                </div>
              </v-col>
              <v-col cols="12" md="3" sm="6">
                <div class="expanded-field">
                  <div class="text-caption text-medium-emphasis mb-1">Access Info</div>
                  <div class="text-body-2">{{ item.access_info || 'Not specified' }}</div>
                </div>
              </v-col>
              <v-col cols="12" md="3" sm="6">
                <div class="expanded-field">
                  <div class="text-caption text-medium-emphasis mb-1">Contact</div>
                  <div class="text-body-2">
                    <template v-if="item.contact_name || item.contact_phone">
                      {{ item.contact_name }}<br v-if="item.contact_name && item.contact_phone">{{ item.contact_phone }}
                    </template>
                    <template v-else>Not specified</template>
                  </div>
                </div>
              </v-col>
              <v-col cols="12" md="3" sm="6">
                <div class="expanded-field">
                  <div class="text-caption text-medium-emphasis mb-1">Cleaning Duration</div>
                  <div class="text-body-2">{{ item.cleaning_duration }} min</div>
                </div>
              </v-col>
            </v-row>
          </div>
        </template>
      </MaterioDataTable>

      <!-- Empty State -->
      <v-card v-if="myProperties.length === 0" class="text-center pa-8 mt-4" variant="flat">
        <v-icon class="mb-4" color="grey-lighten-1" size="64">mdi-home-outline</v-icon>
        <h3 class="text-h6 mb-2">No Properties Yet</h3>
        <p class="text-body-2 text-medium-emphasis mb-4">Add your first property to start managing bookings and cleanings.</p>
        <v-btn color="primary" prepend-icon="mdi-plus" @click="handleCreateProperty">
          Add Your First Property
        </v-btn>
      </v-card>
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
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
import MaterioDataTable from '@/components/dumb/shared/MaterioDataTable.vue'
import StatCard from '@/components/dumb/shared/StatCard.vue'
import PropertyModal from '@/components/dumb/shared/PropertyModal.vue'
import type { Property, PropertyFormData, PropertyRecord } from '@/types'
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

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

  // Table headers
  const tableHeaders = [
    { title: 'Property', key: 'display_name', sortable: true },
    { title: 'Beds', key: 'bedrooms', sortable: true, width: '80px' },
    { title: 'Baths', key: 'bathrooms', sortable: true, width: '80px' },
    { title: 'Type', key: 'property_type', sortable: true },
    { title: 'Status', key: 'active', sortable: true },
    { title: 'Actions', key: 'actions', sortable: false, width: '130px', align: 'end' as const },
  ]

  // Computed property items for the table
  const propertyItems = computed(() =>
    myProperties.value.map(property => ({
      ...property,
      display_name: formatPropertyAddress(property, 'short'),
      full_address: formatPropertyAddress(property),
    })),
  )

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
  padding: 1rem;
  min-height: calc(100vh - var(--app-bar-height, 64px));
}


/* Property color dot */
.property-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Expanded content */
.expanded-content {
  background: rgba(var(--v-theme-on-surface), 0.02);
}

.expanded-field {
  padding: 8px 0;
}
</style>
