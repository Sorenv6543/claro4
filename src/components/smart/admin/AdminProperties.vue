<template>
  <div class="admin-properties-page">
    <AppDataTable
      :active-filter-count="activeFilterCount"
      :headers="tableHeaders"
      :items="tableItems"
      :items-per-page="25"
      :loading="tableLoading"
      :row-props="propertyRowProps"
      :search-keys="['propertyName', 'fullAddress', 'ownerName']"
      searchable
      subtitle="Manage all properties across all clients"
      title="All Properties"
    >
      <!-- Header actions -->
      <template #header-actions>
        <v-btn
          color="primary"
          prepend-icon="mdi-plus"
          @click="openCreatePropertyDialog"
        >
          Add Property
        </v-btn>
      </template>

      <!-- Segment tabs -->
      <template #segments>
        <div class="d-flex ga-2 flex-wrap">
          <v-btn
            v-for="seg in segments"
            :key="seg.value"
            color="primary"
            density="compact"
            size="small"
            :variant="selectedSegment === seg.value ? 'flat' : 'outlined'"
            @click="selectedSegment = seg.value"
          >
            {{ seg.title }}
          </v-btn>
        </div>
      </template>

      <!-- Collapsible filters -->
      <template #filters>
        <v-row align="center" density="comfortable">
          <v-col cols="6" md="2" sm="3">
            <v-select
              v-model="statusFilter"
              clearable
              density="compact"
              hide-details
              :items="statusOptions"
              placeholder="Status"
              variant="outlined"
            />
          </v-col>

          <v-col cols="6" md="2" sm="3">
            <v-select
              v-model="tierFilter"
              clearable
              density="compact"
              hide-details
              :items="tierOptions"
              placeholder="Pricing Tier"
              variant="outlined"
            />
          </v-col>

          <v-col cols="6" md="3" sm="3">
            <v-select
              v-model="ownerFilter"
              clearable
              density="compact"
              hide-details
              :items="ownerOptions"
              placeholder="Owner"
              variant="outlined"
            />
          </v-col>

          <v-col cols="3" md="2.5" sm="1.5">
            <v-text-field
              v-model="minDuration"
              density="compact"
              hide-details
              placeholder="Min dur."
              suffix="min"
              type="number"
              variant="outlined"
            />
          </v-col>

          <v-col cols="3" md="2.5" sm="1.5">
            <v-text-field
              v-model="maxDuration"
              density="compact"
              hide-details
              placeholder="Max dur."
              suffix="min"
              type="number"
              variant="outlined"
            />
          </v-col>
        </v-row>
      </template>

      <!-- Property Name Column -->
      <template #[`item.propertyName`]="{ item }">
        <div class="d-flex align-center ga-2">
          <div
            class="property-color-dot"
            :style="{ background: (item.color as string) || '#9E9E9E' }"
          />

          <div style="min-width:0">
            <div class="text-body-2 font-weight-medium text-truncate">
              {{ item.propertyName }}
            </div>

            <div class="text-caption text-medium-emphasis text-truncate">
              {{ item.fullAddress }}
            </div>
          </div>
        </div>
      </template>

      <!-- Owner Column -->
      <template #[`item.ownerName`]="{ item }">
        <span class="text-body-2">{{ item.ownerName }}</span>
      </template>

      <!-- Tier Column (chip) -->
      <template #[`item.pricing_tier`]="{ item }">
        <v-chip
          class="text-capitalize"
          :color="getTierColor(item.pricing_tier as PricingTier)"
          size="small"
          variant="outlined"
        >
          {{ item.pricing_tier }}
        </v-chip>
      </template>

      <!-- Status Column (chip) -->
      <template #[`item.status`]="{ item }">
        <v-chip
          :color="item.active ? 'success' : 'error'"
          size="small"
          variant="flat"
        >
          {{ item.active ? 'Active' : 'Inactive' }}
        </v-chip>
      </template>

      <!-- Duration Column -->
      <template #[`item.cleaning_duration`]="{ item }">
        <span class="text-body-2">{{ item.cleaning_duration }}min</span>
      </template>

      <!-- Details Column (beds / baths) -->
      <template #[`item.details`]="{ item }">
        <div class="text-body-2 text-no-wrap">
          <span>{{ item.bedrooms || '-' }}bd / {{ item.bathrooms || '-' }}ba</span>
        </div>
      </template>

      <!-- Actions Column -->
      <template #[`item.actions`]="{ item }">
        <div class="d-flex align-center ga-1">
          <v-tooltip location="top" text="Edit">
            <template #activator="{ props: tooltipProps }">
              <v-btn
                icon="mdi-pencil-outline"
                size="small"
                variant="text"
                v-bind="tooltipProps"
                @click.stop="editProperty(item as unknown as Property)"
              />
            </template>
          </v-tooltip>

          <v-menu>
            <template #activator="{ props: menuProps }">
              <v-btn
                icon="mdi-dots-vertical"
                size="small"
                variant="text"
                v-bind="menuProps"
                @click.stop
              />
            </template>

            <v-list>
              <v-list-item @click="viewBookings(item as unknown as Property)">
                <v-list-item-title>View Bookings</v-list-item-title>
              </v-list-item>

              <v-list-item @click="togglePropertyStatus(item as unknown as Property)">
                <v-list-item-title>
                  {{ (item as unknown as Property).active ? 'Deactivate' : 'Activate' }}
                </v-list-item-title>
              </v-list-item>

              <v-list-item @click="duplicateProperty(item as unknown as Property)">
                <v-list-item-title>Duplicate</v-list-item-title>
              </v-list-item>

              <v-list-item
                class="text-error"
                @click="deleteProperty(item as unknown as Property)"
              >
                <v-list-item-title>Delete</v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>
        </div>
      </template>
    </AppDataTable>

    <!-- Create/Edit Property Dialog -->
    <v-dialog
      v-model="showPropertyDialog"
      max-width="800px"
    >
      <v-card>
        <v-card-title>
          {{ editingProperty ? 'Edit Property' : 'Add New Property' }}
        </v-card-title>

        <v-card-text>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Admin property form would be implemented here with owner selection and full property details
          </p>

          <div class="text-center py-4">
            <v-icon
              color="grey-lighten-1"
              size="48"
            >
              mdi-form-select
            </v-icon>

            <p class="text-caption text-medium-emphasis mt-2">
              Integration with AdminPropertyForm component needed
            </p>
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />

          <v-btn @click="closePropertyDialog">
            Cancel
          </v-btn>

          <v-btn
            color="primary"
            @click="saveProperty"
          >
            {{ editingProperty ? 'Update' : 'Create' }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
  import type { Booking } from '@/types/booking.ts'
  import type { PricingTier, Property } from '@/types/property.ts'
  import { computed, ref } from 'vue'
  import AppDataTable from '@/components/dumb/shared/AppDataTable.vue'
  import { useAdminBookings } from '@/composables/admin/useAdminBookings.ts'
  import { useAdminProperties } from '@/composables/admin/useAdminProperties.ts'
  import { usePropertyStore } from '@/stores/property'
  import { formatPropertyAddress } from '@/types/property'

  // Composables
  const { allProperties, updateProperty } = useAdminProperties()
  const { allBookings } = useAdminBookings()
  const propertyStore = usePropertyStore()

  // Loading state — tracks store's loading ref (set by useSupabaseProperties)
  const tableLoading = computed(() => propertyStore.loading)

  // Reactive state
  const statusFilter = ref('')
  const tierFilter = ref('')
  const ownerFilter = ref('')
  const minDuration = ref('')
  const maxDuration = ref('')
  const selectedSegment = ref('all')

  // Dialog state
  const showPropertyDialog = ref(false)
  const editingProperty = ref<Property | null>(null)

  // Segments
  const segments = [
    { title: 'All', value: 'all' },
    { title: 'Active', value: 'active' },
    { title: 'Inactive', value: 'inactive' },
  ]

  // Filter options
  const statusOptions = [
    { title: 'Active', value: 'active' },
    { title: 'Inactive', value: 'inactive' },
  ]

  const tierOptions = [
    { title: 'Basic', value: 'basic' },
    { title: 'Standard', value: 'standard' },
    { title: 'Premium', value: 'premium' },
    { title: 'Luxury', value: 'luxury' },
  ]

  // Active filter count for badge
  const activeFilterCount = computed(() => {
    let count = 0
    if (statusFilter.value) count++
    if (tierFilter.value) count++
    if (ownerFilter.value) count++
    if (minDuration.value) count++
    if (maxDuration.value) count++
    return count
  })

  // Table headers
  const tableHeaders = computed(() => [
    { title: 'Property', key: 'propertyName', sortable: true },
    { title: 'Owner', key: 'ownerName', sortable: true, width: '140px' },
    { title: 'Tier', key: 'pricing_tier', sortable: true, width: '110px', mobileHidden: true },
    { title: 'Status', key: 'status', sortable: false, width: '110px', mobileHidden: true },
    { title: 'Duration', key: 'cleaning_duration', sortable: true, width: '100px', mobileHidden: true },
    { title: 'Details', key: 'details', sortable: false, width: '110px', mobileHidden: true },
    { title: '', key: 'actions', sortable: false, width: '60px', align: 'end' as const },
  ])

  // Row props: clicking a row opens the detail/edit
  function propertyRowProps ({ item }: { item: Record<string, unknown> }) {
    return {
      onClick: () => openPropertyDetails(item as unknown as Property),
      style: 'cursor: pointer',
    }
  }

  // Computed properties
  const allPropertiesArray = computed<Property[]>(() => allProperties.value)
  const allBookingsArray = computed<Booking[]>(() => allBookings.value)

  const ownerOptions = computed(() => {
    const owners = new Set(allPropertiesArray.value.map(p => p.owner_id))
    return Array.from(owners).map(ownerId => ({
      title: getOwnerName(ownerId),
      value: ownerId,
    }))
  })

  const filteredProperties = computed((): Property[] => {
    let properties = allPropertiesArray.value

    // Segment filter
    if (selectedSegment.value === 'active') {
      properties = properties.filter(p => p.active)
    } else if (selectedSegment.value === 'inactive') {
      properties = properties.filter(p => !p.active)
    }

    // Status filter (from collapsible filters, separate from segment)
    if (statusFilter.value) {
      const isActive = statusFilter.value === 'active'
      properties = properties.filter(property => property.active === isActive)
    }

    // Tier filter
    if (tierFilter.value) {
      properties = properties.filter(property => property.pricing_tier === tierFilter.value)
    }

    // Owner filter
    if (ownerFilter.value) {
      properties = properties.filter(property => property.owner_id === ownerFilter.value)
    }

    // Duration filter
    if (minDuration.value) {
      const min = Number.parseInt(minDuration.value)
      properties = properties.filter(property => property.cleaning_duration >= min)
    }
    if (maxDuration.value) {
      const max = Number.parseInt(maxDuration.value)
      properties = properties.filter(property => property.cleaning_duration <= max)
    }

    // Sort by name
    return properties.toSorted((a, b) => formatPropertyAddress(a, 'short').localeCompare(formatPropertyAddress(b, 'short')))
  })

  // Transform properties into table-friendly items with extra display fields
  const tableItems = computed(() => {
    return filteredProperties.value.map(property => ({
      ...property,
      propertyName: formatPropertyAddress(property, 'short'),
      fullAddress: formatPropertyAddress(property),
      ownerName: getOwnerName(property.owner_id),
      bookingCount: getPropertyBookingCount(property.id),
      turnCount: getPropertyTurnCount(property.id),
    }))
  })

  // Helper methods
  function getOwnerName (ownerId: string): string {
    // In a real app, this would fetch owner data
    return `Owner ${ownerId.slice(-4)}`
  }

  function getTierColor (tier: PricingTier): string {
    const colors: Record<PricingTier, string> = {
      basic: 'grey',
      standard: 'blue',
      premium: 'purple',
      luxury: 'amber',
    }
    return colors[tier]
  }

  function getPropertyBookingCount (propertyId: string): number {
    return allBookingsArray.value.filter(booking => booking.property_id === propertyId).length
  }

  function getPropertyTurnCount (propertyId: string): number {
    return allBookingsArray.value.filter(booking =>
      booking.property_id === propertyId && booking.booking_type === 'turn',
    ).length
  }

  // Dialog methods
  function openCreatePropertyDialog () {
    editingProperty.value = null
    showPropertyDialog.value = true
  }

  function openPropertyDetails (property: Property) {
    console.log('Opening property details:', property.id)
    // Navigate to property details or open details modal
  }

  function editProperty (property: Property) {
    editingProperty.value = property
    showPropertyDialog.value = true
  }

  function closePropertyDialog () {
    showPropertyDialog.value = false
    editingProperty.value = null
  }

  function saveProperty () {
    console.log('Saving property...')
    // Implement property save logic
    closePropertyDialog()
  }

  // Property actions
  function viewBookings (property: Property) {
    console.log('Viewing bookings for property:', property.id)
    // Navigate to bookings page with property filter
  }

  async function togglePropertyStatus (property: Property) {
    try {
      await updateProperty(property.id, { active: !property.active })
      console.log('Property status updated successfully')
    } catch (error) {
      console.error('Failed to update property status:', error)
    }
  }

  function duplicateProperty (property: Property) {
    console.log('Duplicating property:', property.id)
    // Implement property duplication logic
  }

  async function deleteProperty (property: Property) {
    if (confirm(`Are you sure you want to delete "${formatPropertyAddress(property, 'short')}"?`)) {
      console.log('Deleting property:', property.id)
      // Implement property deletion logic
    }
  }
</script>

<style scoped>
.admin-properties-page {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.property-color-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

/* Force fixed-layout table so percentage column widths are respected on mobile */
@media (max-width: 599px) {
  :deep(.v-table table) {
    table-layout: fixed;
    width: 100%;
  }

  :deep(.v-table td),
  :deep(.v-table th) {
    overflow: hidden;
  }
}
</style>
