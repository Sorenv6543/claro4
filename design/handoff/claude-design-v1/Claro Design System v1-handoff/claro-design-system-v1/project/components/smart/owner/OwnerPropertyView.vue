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
          <PropertyInfoSection
            ref="infoRef"
            :error="sectionState.info.error"
            :loading="sectionState.info.loading"
            :property="property"
            @save="(data) => handleSectionSave('info', data)"
          />
          <PropertyCleaningSection
            ref="cleaningRef"
            :error="sectionState.cleaning.error"
            :loading="sectionState.cleaning.loading"
            :property="property"
            @save="(data) => handleSectionSave('cleaning', data)"
          />
          <PropertyAccessSection
            ref="accessRef"
            :error="sectionState.access.error"
            :loading="sectionState.access.loading"
            :property="property"
            @save="(data) => handleSectionSave('access', data)"
          />
          <PropertyContactSection
            ref="contactRef"
            :error="sectionState.contact.error"
            :loading="sectionState.contact.loading"
            :property="property"
            @save="(data) => handleSectionSave('contact', data)"
          />
        </v-col>

        <!-- Right column -->
        <v-col
          cols="12"
          md="4"
        >
          <PropertyPhotosSection :property="property" />

          <!-- Statistics & Bookings (combined read-only card) -->
          <v-card class="mt-4">
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

            <v-divider />

            <v-card-title class="pt-4">
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

            <v-divider />

            <v-card-title class="pt-4">
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

            <v-divider />

            <v-card-title class="pt-4">
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
  import type { Booking, Property } from '@/types'
  import { computed, onMounted, reactive, ref } from 'vue'
  import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
  import PropertyAccessSection from '@/components/dumb/owner/PropertyAccessSection.vue'
  import PropertyCleaningSection from '@/components/dumb/owner/PropertyCleaningSection.vue'
  import PropertyContactSection from '@/components/dumb/owner/PropertyContactSection.vue'
  import PropertyInfoSection from '@/components/dumb/owner/PropertyInfoSection.vue'
  import PropertyPhotosSection from '@/components/dumb/owner/PropertyPhotosSection.vue'
  import ConfirmationDialog from '@/components/dumb/shared/ConfirmationDialog.vue'
  import { useOwnerBookings } from '@/composables/owner/useOwnerBookings'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { formatPropertyAddress } from '@/types/property'

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

  const deleteDialogOpen = ref(false)
  const loadError = ref<string | null>(null)
  const deleteError = ref<string | null>(null)

  const property = computed(() => myProperties.value.find(p => p.id === propertyId) ?? null)

  const propertyBookings = computed(() =>
    myBookings.value
      .filter(b => b.property_id === propertyId)
      .toSorted((a, b) => new Date(b.checkin_date).getTime() - new Date(a.checkin_date).getTime())
      .slice(0, 10),
  )

  const upcomingSchedule = computed(() => {
    const today = new Date()
    return myBookings.value
      .filter(b => b.property_id === propertyId && new Date(b.checkin_date) >= today)
      .toSorted((a, b) => new Date(a.checkin_date).getTime() - new Date(b.checkin_date).getTime())
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

  // Section refs
  const infoRef = ref()
  const cleaningRef = ref()
  const accessRef = ref()
  const contactRef = ref()

  // Per-section state
  const sectionState = reactive<Record<string, { loading: boolean, error: string | null }>>({
    info: { loading: false, error: null },
    cleaning: { loading: false, error: null },
    access: { loading: false, error: null },
    contact: { loading: false, error: null },
  })

  const sectionRefs: Record<string, any> = { info: infoRef, cleaning: cleaningRef, access: accessRef, contact: contactRef }

  async function handleSectionSave (section: string, data: Partial<Property>) {
    const state = sectionState[section]
    state.loading = true
    state.error = null
    const ok = await updateMyProperty(propertyId, data)
    state.loading = false
    if (ok) {
      sectionRefs[section]?.value?.closeEdit()
    } else {
      state.error = error.value ?? 'Failed to save. Please try again.'
    }
  }

  // Navigation guard — warn about unsaved section edits
  onBeforeRouteLeave(() => {
    const dirtySections = [infoRef, cleaningRef, accessRef, contactRef]
      .filter(r => r.value?.editing && r.value?.isDirty)
    if (dirtySections.length > 0) {
      const leave = window.confirm('You have unsaved changes. Discard?')
      if (!leave) return false
    }
  })

  const goBack = () => router.push('/owner/properties')

  function handleDelete () {
    deleteDialogOpen.value = true
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
  background: rgb(var(--v-theme-background));
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
