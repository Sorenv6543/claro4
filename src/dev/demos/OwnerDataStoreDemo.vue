<!--
🎯 OWNER DATA STORE DEMO
Showcases the enhanced owner data store with caching and performance optimizations
Based on TASK-072 implementation
-->

<template>
  <v-container>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon
              class="mr-3"
              icon="mdi-speedometer"
            />
            Enhanced Owner Data Store Demo
            <v-spacer />
            <v-chip
              :color="ownerData.isCacheValid ? 'success' : 'warning'"
              size="small"
              variant="tonal"
            >
              Cache: {{ ownerData.isCacheValid ? 'Valid' : 'Invalid' }}
            </v-chip>
          </v-card-title>

          <v-card-text>
            <v-alert
              class="mb-4"
              title="TASK-072: Store-Level Role Filtering Architecture"
              type="info"
              variant="tonal"
            >
              <p class="mb-2">
                This demo showcases the enhanced owner data store with performance caching and role-based filtering.
              </p>
              <ul class="ml-4">
                <li><strong>30-second caching</strong> for improved performance</li>
                <li><strong>Role-based data filtering</strong> - owners see only their data</li>
                <li><strong>Computed metrics</strong> for real-time stats</li>
                <li><strong>Automatic cache invalidation</strong> on data changes</li>
              </ul>
            </v-alert>

            <!-- Cache Status -->
            <v-row class="mb-4">
              <v-col
                cols="12"
                md="6"
              >
                <v-card
                  color="surface-variant"
                  variant="tonal"
                >
                  <v-card-title>Cache Status</v-card-title>
                  <v-card-text>
                    <v-chip
                      class="mb-2"
                      :color="ownerData.isCacheValid ? 'success' : 'error'"
                    >
                      {{ ownerData.isCacheValid ? 'Cache Valid' : 'Cache Expired' }}
                    </v-chip>
                    <div class="text-caption">
                      Last cached: {{ formatTimestamp(ownerData.cacheTimestamp) }}
                    </div>
                    <div class="text-caption">
                      Cache TTL: 30 seconds
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-card
                  color="primary"
                  variant="tonal"
                >
                  <v-card-title>Owner Stats</v-card-title>
                  <v-card-text>
                    <v-row dense>
                      <v-col cols="6">
                        <div class="text-h6">
                          {{ ownerData.stats.propertiesCount }}
                        </div>
                        <div class="text-caption">
                          Properties
                        </div>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-h6">
                          {{ ownerData.stats.bookingsCount }}
                        </div>
                        <div class="text-caption">
                          Bookings
                        </div>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-h6">
                          {{ ownerData.stats.urgentTurnsCount }}
                        </div>
                        <div class="text-caption">
                          Urgent Turns
                        </div>
                      </v-col>
                      <v-col cols="6">
                        <div class="text-h6">
                          ${{ ownerData.stats.totalRevenue.toLocaleString() }}
                        </div>
                        <div class="text-caption">
                          Revenue
                        </div>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Owner Properties -->
            <v-row class="mb-4">
              <v-col cols="12">
                <v-card>
                  <v-card-title class="d-flex align-center">
                    <v-icon
                      class="mr-2"
                      icon="mdi-home-group"
                    />
                    My Properties ({{ ownerData.ownerProperties.length }})
                    <v-spacer />
                    <v-btn
                      color="primary"
                      prepend-icon="mdi-plus"
                      variant="tonal"
                      @click="createSampleProperty"
                    >
                      Add Property
                    </v-btn>
                  </v-card-title>

                  <v-card-text>
                    <v-row>
                      <v-col
                        v-for="property in ownerData.ownerProperties"
                        :key="property.id"
                        cols="12"
                        lg="4"
                        md="6"
                      >
                        <v-card variant="outlined">
                          <v-card-title class="d-flex align-center">
                            <v-icon
                              class="mr-2"
                              :color="property.active ? 'success' : 'grey'"
                              :icon="property.active ? 'mdi-home' : 'mdi-home-off'"
                            />
                            {{ property.name }}
                          </v-card-title>
                          <v-card-text>
                            <div class="text-caption mb-2">
                              {{ typeof property.address === 'string' ? property.address : property.address?.city || 'No address' }}
                            </div>
                            <v-chip
                              size="small"
                              variant="tonal"
                            >
                              {{ property.pricing_tier }}
                            </v-chip>
                            <div class="mt-2">
                              <strong>Bookings:</strong> {{ ownerData.getPropertyBookings(property.id).length }}
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col
                        v-if="ownerData.ownerProperties.length === 0"
                        cols="12"
                      >
                        <v-alert
                          type="info"
                          variant="tonal"
                        >
                          No properties found. Add a property to see role-based filtering in action.
                        </v-alert>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Owner Bookings -->
            <v-row class="mb-4">
              <v-col cols="12">
                <v-card>
                  <v-card-title class="d-flex align-center">
                    <v-icon
                      class="mr-2"
                      icon="mdi-calendar-check"
                    />
                    My Bookings ({{ ownerData.ownerBookings.length }})
                    <v-spacer />
                    <v-btn
                      color="secondary"
                      :disabled="ownerData.ownerProperties.length === 0"
                      prepend-icon="mdi-plus"
                      variant="tonal"
                      @click="createSampleBooking"
                    >
                      Add Booking
                    </v-btn>
                  </v-card-title>

                  <v-card-text>
                    <v-row>
                      <v-col
                        cols="12"
                        md="4"
                      >
                        <v-card
                          color="success"
                          variant="tonal"
                        >
                          <v-card-title>Upcoming</v-card-title>
                          <v-card-text>
                            <div class="text-h4">
                              {{ ownerData.upcomingBookings.length }}
                            </div>
                            <div class="text-caption">
                              Confirmed bookings
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col
                        cols="12"
                        md="4"
                      >
                        <v-card
                          color="warning"
                          variant="tonal"
                        >
                          <v-card-title>Urgent Turns</v-card-title>
                          <v-card-text>
                            <div class="text-h4">
                              {{ ownerData.urgentTurns.length }}
                            </div>
                            <div class="text-caption">
                              Within 24 hours
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-col>

                      <v-col
                        cols="12"
                        md="4"
                      >
                        <v-card
                          color="info"
                          variant="tonal"
                        >
                          <v-card-title>Today</v-card-title>
                          <v-card-text>
                            <div class="text-h4">
                              {{ ownerData.todayBookings.length }}
                            </div>
                            <div class="text-caption">
                              Today's activities
                            </div>
                          </v-card-text>
                        </v-card>
                      </v-col>
                    </v-row>

                    <v-divider class="my-4" />

                    <div v-if="ownerData.ownerBookings.length > 0">
                      <v-list>
                        <v-list-item
                          v-for="booking in ownerData.ownerBookings.slice(0, 5)"
                          :key="booking.id"
                        >
                          <template #prepend>
                            <v-avatar
                              :color="getBookingTypeColor(booking.booking_type)"
                              size="40"
                            >
                              <v-icon :icon="getBookingTypeIcon(booking.booking_type)" />
                            </v-avatar>
                          </template>

                          <v-list-item-title>
                            Property: {{ getPropertyName(booking.property_id) }}
                          </v-list-item-title>
                          <v-list-item-subtitle>
                            {{ formatDate(booking.checkout_date) }} → {{ formatDate(booking.checkin_date) }}
                          </v-list-item-subtitle>

                          <template #append>
                            <v-chip
                              :color="getStatusColor(booking.status)"
                              size="small"
                              variant="tonal"
                            >
                              {{ booking.status }}
                            </v-chip>
                          </template>
                        </v-list-item>
                      </v-list>
                    </div>

                    <v-alert
                      v-else
                      type="info"
                      variant="tonal"
                    >
                      No bookings found. Add a booking to see role-based filtering.
                    </v-alert>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Actions -->
            <v-row>
              <v-col cols="12">
                <v-card>
                  <v-card-title>Store Actions</v-card-title>
                  <v-card-text>
                    <div class="d-flex gap-2 flex-wrap">
                      <v-btn
                        color="primary"
                        :loading="loading"
                        prepend-icon="mdi-refresh"
                        @click="refreshData"
                      >
                        Refresh Data
                      </v-btn>

                      <v-btn
                        color="warning"
                        prepend-icon="mdi-delete-sweep"
                        @click="invalidateCache"
                      >
                        Invalidate Cache
                      </v-btn>
                    </div>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>

            <!-- Performance Metrics -->
            <v-expand-transition>
              <v-row
                v-if="showMetrics"
                class="mt-4"
              >
                <v-col cols="12">
                  <v-card color="surface-variant">
                    <v-card-title>Performance Metrics</v-card-title>
                    <v-card-text>
                      <v-row>
                        <v-col
                          cols="12"
                          md="6"
                        >
                          <h4>Revenue Metrics</h4>
                          <div class="mt-2">
                            <div>Total Revenue: <strong>${{ ownerData.stats.totalRevenue.toLocaleString() }}</strong></div>
                            <div>This Month: <strong>${{ ownerData.stats.thisMonthRevenue.toLocaleString() }}</strong></div>
                          </div>
                        </v-col>

                        <v-col
                          cols="12"
                          md="6"
                        >
                          <h4>Property Metrics</h4>
                          <div class="mt-2">
                            <div>Active Properties: <strong>{{ ownerData.stats.activePropertiesCount }}/{{ ownerData.stats.propertiesCount }}</strong></div>
                            <div>Upcoming Bookings: <strong>{{ ownerData.stats.upcomingBookingsCount }}</strong></div>
                          </div>
                        </v-col>
                      </v-row>
                    </v-card-text>
                  </v-card>
                </v-col>
              </v-row>
            </v-expand-transition>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { Booking, Property } from '@/types'
  import { ref } from 'vue'
  import { useOwnerDataStore } from '@/stores/ownerData'

  // Store
  const ownerData = useOwnerDataStore()

  // Local state
  const loading = ref(false)
  const showMetrics = ref(false)

  // Methods
  async function refreshData () {
    loading.value = true
    try {
      await ownerData.refreshOwnerData()
    } finally {
      loading.value = false
    }
  }

  function invalidateCache () {
    ownerData.invalidateCache()
  }

  async function createSampleProperty () {
    const sampleProperty: Partial<Property> = {
      name: `Property ${ownerData.ownerProperties.length + 1}`,
      address: `${Math.floor(Math.random() * 9999)} Demo Street, Demo City`,
      pricing_tier: ['basic', 'premium', 'luxury'][Math.floor(Math.random() * 3)] as any,
      active: true,
      bedrooms: Math.floor(Math.random() * 4) + 1,
      bathrooms: Math.floor(Math.random() * 3) + 1,
      cleaning_duration: 120,
    }

    await ownerData.createOwnerProperty(sampleProperty)
  }

  async function createSampleBooking () {
    if (ownerData.ownerProperties.length === 0) return

    const randomProperty = ownerData.ownerProperties[Math.floor(Math.random() * ownerData.ownerProperties.length)]
    const checkoutDate = new Date()
    checkoutDate.setDate(checkoutDate.getDate() + Math.floor(Math.random() * 30))
    const checkinDate = new Date(checkoutDate)
    checkinDate.setDate(checkinDate.getDate() + Math.floor(Math.random() * 3) + 1)

    const sampleBooking: Partial<Booking> = {
      property_id: randomProperty.id,
      checkout_date: checkoutDate.toISOString().split('T')[0],
      checkin_date: checkinDate.toISOString().split('T')[0],
      booking_type: Math.random() > 0.7 ? 'turn' : 'standard',
      status: ['pending', 'confirmed', 'scheduled'][Math.floor(Math.random() * 3)] as any,
      guest_count: Math.floor(Math.random() * 6) + 1,
      cleaning_scheduled: true,
      total_cost: Math.floor(Math.random() * 500) + 100,
      nightly_rate: Math.floor(Math.random() * 200) + 50,
    }

    await ownerData.createOwnerBooking(sampleBooking)
  }

  function formatTimestamp (timestamp: number): string {
    if (!timestamp) return 'Never'
    return new Date(timestamp).toLocaleTimeString()
  }

  function formatDate (dateString: string): string {
    return new Date(dateString).toLocaleDateString()
  }

  function getPropertyName (propertyId: string): string {
    const property = ownerData.ownerProperties.find(p => p.id === propertyId)
    return property?.name || 'Unknown Property'
  }

  function getBookingTypeColor (type: string): string {
    return type === 'turn' ? 'warning' : 'primary'
  }

  function getBookingTypeIcon (type: string): string {
    return type === 'turn' ? 'mdi-swap-horizontal' : 'mdi-calendar-check'
  }

  function getStatusColor (status: string): string {
    const colors: Record<string, string> = {
      pending: 'warning',
      confirmed: 'success',
      scheduled: 'info',
      completed: 'success',
      cancelled: 'error',
    }
    return colors[status] || 'grey'
  }
</script>

<style scoped>
.v-card {
  height: 100%;
}
</style>
