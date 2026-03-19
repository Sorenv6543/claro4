<template>
  <div class="property-view-page">
    <v-container fluid>
      <!-- Header -->
      <v-row>
        <v-col cols="12">
          <div class="d-flex align-center justify-space-between mb-4">
            <div class="d-flex align-center">
              <v-btn
                icon="mdi-arrow-left"
                variant="text"
                @click="goBack"
              />
              <h1 class="text-h4 ml-4">
                {{ property ? formatPropertyAddress(property, 'short') : 'Property Details' }}
              </h1>
              <v-chip
                v-if="property"
                class="ml-3"
                :color="property.active ? 'success' : 'grey'"
                size="small"
              >
                {{ property.active ? 'Active' : 'Inactive' }}
              </v-chip>
            </div>
            <div
              v-if="property"
              class="d-flex gap-2"
            >
              <v-btn
                color="primary"
                prepend-icon="mdi-pencil"
                @click="handleEdit"
              >
                Edit
              </v-btn>
              <v-btn
                color="error"
                prepend-icon="mdi-delete"
                variant="outlined"
                @click="handleDelete"
              >
                Delete
              </v-btn>
            </div>
          </div>
        </v-col>
      </v-row>

      <!-- Loading state -->
      <v-row v-if="loading && !property">
        <v-col cols="12">
          <v-card>
            <v-card-text class="text-center py-8">
              <v-progress-circular
                color="primary"
                indeterminate
              />
              <div class="mt-4">
                Loading property...
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Main content -->
      <v-row v-else-if="property">
        <!-- Left column -->
        <v-col
          cols="12"
          md="8"
        >
          <!-- Property Info -->
          <v-card class="mb-4">
            <v-card-title>
              <v-icon
                class="mr-2"
                color="primary"
              >
                mdi-home
              </v-icon>
              Property Information
            </v-card-title>
            <v-card-text>
              <v-row>
                <v-col cols="12">
                  <div class="property-detail">
                    <strong>Address:</strong>
                    <div>{{ formatPropertyAddress(property) }}</div>
                  </div>
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                >
                  <div class="property-detail">
                    <strong>Type:</strong>
                    <div>{{ property.property_type || 'Not specified' }}</div>
                  </div>
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                >
                  <div class="property-detail">
                    <strong>Bedrooms:</strong>
                    <div>{{ property.bedrooms || 'Not specified' }}</div>
                  </div>
                </v-col>
                <v-col
                  cols="12"
                  sm="6"
                >
                  <div class="property-detail">
                    <strong>Bathrooms:</strong>
                    <div>{{ property.bathrooms || 'Not specified' }}</div>
                  </div>
                </v-col>
                <v-col
                  v-if="property.special_instructions"
                  cols="12"
                >
                  <div class="property-detail">
                    <strong>Special Instructions:</strong>
                    <div>{{ property.special_instructions }}</div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>

          <!-- Upcoming Arrivals -->
          <v-card class="mb-4">
            <v-card-title>
              <v-icon
                class="mr-2"
                color="warning"
              >
                mdi-calendar-account
              </v-icon>
              Upcoming Arrivals
            </v-card-title>
            <v-card-text>
              <div
                v-if="upcomingSchedule.length === 0"
                class="text-center py-4"
              >
                <v-icon
                  color="grey"
                  size="48"
                >
                  mdi-calendar-blank-outline
                </v-icon>
                <div class="text-body-1 text-medium-emphasis mt-2">
                  No upcoming bookings
                </div>
              </div>
              <v-list
                v-else
                density="compact"
              >
                <v-list-item
                  v-for="booking in upcomingSchedule"
                  :key="booking.id"
                >
                  <v-list-item-title>{{ formatDateRange(booking.checkin_date, booking.checkout_date) }}</v-list-item-title>
                  <v-list-item-subtitle>Cleaning window: {{ property.cleaning_duration }} min</v-list-item-subtitle>
                  <template #append>
                    <v-chip
                      :color="booking.booking_type === 'turn' ? 'warning' : 'primary'"
                      size="x-small"
                    >
                      {{ booking.booking_type === 'turn' ? 'Turn' : 'Standard' }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>

          <!-- Recent Bookings -->
          <v-card>
            <v-card-title>
              <v-icon
                class="mr-2"
                color="info"
              >
                mdi-calendar-multiple
              </v-icon>
              Recent Bookings
            </v-card-title>
            <v-card-text>
              <div
                v-if="propertyBookings.length === 0"
                class="text-center py-4"
              >
                <v-icon
                  color="grey"
                  size="48"
                >
                  mdi-calendar-outline
                </v-icon>
                <div class="text-body-1 text-medium-emphasis mt-2">
                  No bookings yet
                </div>
              </div>
              <v-list
                v-else
                density="compact"
              >
                <v-list-item
                  v-for="booking in propertyBookings"
                  :key="booking.id"
                >
                  <v-list-item-title>{{ formatBookingTitle(booking) }}</v-list-item-title>
                  <v-list-item-subtitle>{{ formatDateRange(booking.checkin_date, booking.checkout_date) }}</v-list-item-subtitle>
                  <template #append>
                    <v-chip
                      :color="getBookingStatusColor(booking.status)"
                      size="small"
                    >
                      {{ booking.status }}
                    </v-chip>
                  </template>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- Right column -->
        <v-col
          cols="12"
          md="4"
        >
          <!-- Stats -->
          <v-card class="mb-4">
            <v-card-title>
              <v-icon
                class="mr-2"
                color="success"
              >
                mdi-chart-line
              </v-icon>
              Statistics
            </v-card-title>
            <v-card-text>
              <div class="stat-item">
                <div class="stat-value">
                  {{ totalBookings }}
                </div>
                <div class="stat-label">
                  Total Bookings
                </div>
              </div>
              <div class="stat-item">
                <div class="stat-value">
                  {{ upcomingCount }}
                </div>
                <div class="stat-label">
                  Upcoming Bookings
                </div>
              </div>
              <div class="stat-item">
                <v-chip
                  :color="property.active ? 'success' : 'grey'"
                  size="small"
                >
                  {{ property.active ? 'Active' : 'Inactive' }}
                </v-chip>
                <div class="stat-label mt-1">
                  Status
                </div>
              </div>
            </v-card-text>
          </v-card>

          <!-- Details -->
          <v-card>
            <v-card-title>
              <v-icon
                class="mr-2"
                color="info"
              >
                mdi-information
              </v-icon>
              Details
            </v-card-title>
            <v-card-text class="text-body-2">
              <p><strong>Pricing Tier:</strong> {{ property.pricing_tier }}</p>
              <p><strong>Cleaning Duration:</strong> {{ property.cleaning_duration }} min</p>
              <p v-if="property.created_at">
                <strong>Created:</strong> {{ formatDate(property.created_at) }}
              </p>
              <p v-if="property.updated_at">
                <strong>Last Updated:</strong> {{ formatDate(property.updated_at) }}
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Error or not-found state -->
      <v-row v-else>
        <v-col cols="12">
          <v-card>
            <v-card-text class="text-center py-8">
              <v-icon
                class="mb-4"
                color="grey"
                size="64"
              >
                mdi-home-alert-outline
              </v-icon>
              <div class="text-h6 mb-2">
                Property not found
              </div>
              <div class="text-body-2 text-medium-emphasis mb-4">
                {{ loadError || 'This property could not be loaded.' }}
              </div>
              <v-btn
                color="primary"
                @click="goBack"
              >
                Back to Properties
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Save error alert -->
    <v-alert
      v-if="saveError"
      class="mt-4 mx-4"
      closable
      type="error"
      variant="tonal"
      @click:close="saveError = null"
    >
      {{ saveError }}
    </v-alert>

    <!-- Delete error alert -->
    <v-alert
      v-if="deleteError"
      class="mt-4 mx-4"
      closable
      type="error"
      variant="tonal"
      @click:close="deleteError = null"
    >
      {{ deleteError }}
    </v-alert>

    <!-- Edit Modal -->
    <PropertyModal
      mode="edit"
      :open="editModalOpen"
      :property="property ?? undefined"
      @close="editModalOpen = false"
      @save="handleEditSave"
    />

    <!-- Delete Confirmation -->
    <ConfirmationDialog
      cancel-text="Cancel"
      confirm-text="Delete"
      :dangerous="true"
      :message="`Are you sure you want to delete &quot;${property ? formatPropertyAddress(property, 'short') : ''}&quot;? This cannot be undone.`"
      :open="deleteDialogOpen"
      title="Delete Property"
      @cancel="deleteDialogOpen = false"
      @close="deleteDialogOpen = false"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup lang="ts">
  import type { Booking, PropertyFormData } from '@/types'
  import { formatPropertyAddress } from '@/types/property'
  import { computed, onMounted, ref } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import PropertyModal from '@/components/dumb/shared/PropertyModal.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'

  defineOptions({ name: 'OwnerPropertyViewComponent' })

  const router = useRouter()
  const route = useRoute()
  const propertyId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id

  const {
    myProperties,
    loading,
    error,
    fetchMyProperties,
    updateMyProperty,
    deleteMyProperty,
  } = useOwnerProperties()

  const { myBookings, fetchMyBookings } = useOwnerBookings()

  const editModalOpen = ref(false)
  const deleteDialogOpen = ref(false)
  const loadError = ref<string | null>(null)

  const property = computed(() => myProperties.value.find(p => p.id === propertyId) ?? null)

  const propertyBookings = computed(() =>
    myBookings.value
      .filter(b => b.property_id === propertyId)
      .sort((a, b) => new Date(b.checkin_date).getTime() - new Date(a.checkin_date).getTime())
      .slice(0, 10),
  )

  const upcomingSchedule = computed(() => {
    const today = new Date()
    return myBookings.value
      .filter(b => b.property_id === propertyId && new Date(b.checkin_date) >= today)
      .sort((a, b) => new Date(a.checkin_date).getTime() - new Date(b.checkin_date).getTime())
      .slice(0, 10)
  })

  const totalBookings = computed(() =>
    myBookings.value.filter(b => b.property_id === propertyId).length,
  )

  const upcomingCount = computed(() => {
    const today = new Date()
    return myBookings.value.filter(
      b => b.property_id === propertyId && new Date(b.checkin_date) >= today,
    ).length
  })

  onMounted(async () => {
    try {
      await Promise.all([fetchMyProperties(), fetchMyBookings()])
      if (!property.value) router.push('/owner/properties')
    } catch (error_) {
      console.error('[OwnerPropertyView] Failed to load property data:', error_)
      loadError.value = 'Unable to load property details. Please refresh or go back.'
    }
  })

  const goBack = () => router.push('/owner/properties')
  function handleEdit () {
    editModalOpen.value = true
  }
  function handleDelete () {
    deleteDialogOpen.value = true
  }

  const saveError = ref<string | null>(null)
  const deleteError = ref<string | null>(null)

  async function handleEditSave (data: PropertyFormData) {
    saveError.value = null
    const ok = await updateMyProperty(propertyId, data)
    if (ok) {
      editModalOpen.value = false
    } else {
      saveError.value = error.value ?? 'Failed to save property. Please try again.'
    }
  }

  async function confirmDelete () {
    deleteError.value = null
    const ok = await deleteMyProperty(propertyId)
    if (ok) {
      router.push('/owner/properties')
    } else {
      deleteError.value = error.value ?? 'Failed to delete property. Please try again.'
    }
  }

  function formatDate (dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  function formatDateRange (checkin: string, checkout: string) {
    const ci = new Date(checkin).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const co = new Date(checkout).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    return `${ci} — ${co}`
  }

  function formatBookingTitle (booking: Booking) {
    return booking.booking_type === 'turn' ? 'Turn Booking' : 'Standard Booking'
  }

  function getBookingStatusColor (status: string) {
    switch (status) {
      case 'scheduled': { return 'info'
      }
      case 'in_progress': { return 'warning'
      }
      case 'completed': { return 'success'
      }
      case 'pending': { return 'secondary'
      }
      case 'cancelled': { return 'error'
      }
      default: { return 'primary'
      }
    }
  }
</script>

<style scoped>
.property-view-page {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}

.property-detail {
  margin-bottom: 16px;
}

.property-detail strong {
  color: rgb(var(--v-theme-primary));
  font-weight: 600;
}

.property-detail div {
  margin-top: 4px;
  font-size: 0.95rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 16px 0;
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.stat-item:last-child {
  border-bottom: none;
}

.stat-value {
  font-size: 2rem;
  font-weight: 600;
  color: rgb(var(--v-theme-primary));
}

.stat-label {
  font-size: 0.875rem;
  color: rgb(var(--v-theme-on-surface-variant));
  margin-top: 4px;
}

.gap-2 {
  gap: 8px;
}
</style>
