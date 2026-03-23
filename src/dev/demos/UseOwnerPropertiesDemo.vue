<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <v-card>
          <v-card-title class="d-flex align-center">
            <v-icon class="mr-2">
              mdi-home-group
            </v-icon>
            useOwnerProperties Composable Demo
            <v-spacer />
            <v-chip
              color="primary"
              variant="outlined"
            >
              Owner Role Testing
            </v-chip>
          </v-card-title>

          <v-card-text>
            <v-alert
              class="mb-4"
              type="info"
            >
              This demo tests the owner-specific property composable that filters all operations to the current owner's properties only.
            </v-alert>

            <!-- Current User Info -->
            <v-card
              class="mb-4"
              variant="outlined"
            >
              <v-card-title class="text-h6">
                Current User Context
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="6">
                    <strong>User ID:</strong> {{ currentUserId || 'Not logged in' }}
                  </v-col>
                  <v-col cols="6">
                    <strong>Role:</strong> {{ authStore.user?.role || 'Unknown' }}
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- Owner Property Metrics -->
            <v-card
              class="mb-4"
              variant="outlined"
            >
              <v-card-title class="text-h6">
                My Property Metrics
              </v-card-title>
              <v-card-text>
                <v-row>
                  <v-col cols="3">
                    <v-card
                      color="primary"
                      variant="tonal"
                    >
                      <v-card-text class="text-center">
                        <div class="text-h4">
                          {{ myPropertyMetrics.totalProperties }}
                        </div>
                        <div class="text-caption">
                          Total Properties
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="3">
                    <v-card
                      color="success"
                      variant="tonal"
                    >
                      <v-card-text class="text-center">
                        <div class="text-h4">
                          {{ myPropertyMetrics.activeProperties }}
                        </div>
                        <div class="text-caption">
                          Active Properties
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="3">
                    <v-card
                      color="info"
                      variant="tonal"
                    >
                      <v-card-text class="text-center">
                        <div class="text-h4">
                          {{ Math.round(myPropertyMetrics.averageUtilization * 100) }}%
                        </div>
                        <div class="text-caption">
                          Avg Utilization
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                  <v-col cols="3">
                    <v-card
                      color="warning"
                      variant="tonal"
                    >
                      <v-card-text class="text-center">
                        <div class="text-h4">
                          ${{ Math.round(myPropertyMetrics.totalRevenue) }}
                        </div>
                        <div class="text-caption">
                          Total Revenue
                        </div>
                      </v-card-text>
                    </v-card>
                  </v-col>
                </v-row>
              </v-card-text>
            </v-card>

            <!-- My Properties List -->
            <v-card
              class="mb-4"
              variant="outlined"
            >
              <v-card-title class="text-h6 d-flex align-center">
                My Properties ({{ myProperties.length }})
                <v-spacer />
                <v-btn
                  color="primary"
                  :loading="loading"
                  size="small"
                  variant="outlined"
                  @click="fetchMyProperties"
                >
                  <v-icon start>
                    mdi-refresh
                  </v-icon>
                  Refresh
                </v-btn>
              </v-card-title>
              <v-card-text>
                <v-row v-if="myProperties.length > 0">
                  <v-col
                    v-for="property in myProperties"
                    :key="property.id"
                    cols="12"
                    lg="4"
                    md="6"
                  >
                    <v-card
                      :color="property.active ? 'success' : 'warning'"
                      variant="outlined"
                    >
                      <v-card-title class="text-subtitle-1">
                        {{ property.name }}
                        <v-spacer />
                        <v-chip
                          :color="property.active ? 'success' : 'warning'"
                          size="small"
                          variant="tonal"
                        >
                          {{ property.active ? 'Active' : 'Inactive' }}
                        </v-chip>
                      </v-card-title>
                      <v-card-text>
                        <div><strong>Address:</strong> {{ property.address }}</div>
                        <div><strong>Pricing:</strong> {{ property.pricing_tier }}</div>
                        <div><strong>Duration:</strong> {{ property.cleaning_duration }}min</div>
                        <div><strong>Owner ID:</strong> {{ property.owner_id }}</div>
                      </v-card-text>
                      <v-card-actions>
                        <v-btn
                          size="small"
                          variant="outlined"
                          @click="viewPropertyMetrics(property.id)"
                        >
                          Metrics
                        </v-btn>
                        <v-btn
                          :loading="loading"
                          size="small"
                          variant="outlined"
                          @click="togglePropertyStatus(property.id, !property.active)"
                        >
                          {{ property.active ? 'Deactivate' : 'Activate' }}
                        </v-btn>
                      </v-card-actions>
                    </v-card>
                  </v-col>
                </v-row>
                <v-alert
                  v-else
                  type="info"
                >
                  No properties found for the current owner.
                </v-alert>
              </v-card-text>
            </v-card>

            <!-- Property Recommendations -->
            <v-card
              v-if="recommendations.length > 0"
              class="mb-4"
              variant="outlined"
            >
              <v-card-title class="text-h6">
                Property Recommendations
              </v-card-title>
              <v-card-text>
                <v-list>
                  <v-list-item
                    v-for="(recommendation, index) in recommendations"
                    :key="index"
                  >
                    <template #prepend>
                      <v-icon color="info">
                        mdi-lightbulb-outline
                      </v-icon>
                    </template>
                    <v-list-item-title>{{ recommendation }}</v-list-item-title>
                  </v-list-item>
                </v-list>
              </v-card-text>
            </v-card>

            <!-- Create Property Form -->
            <v-card
              class="mb-4"
              variant="outlined"
            >
              <v-card-title class="text-h6">
                Create New Property
              </v-card-title>
              <v-card-text>
                <v-form @submit.prevent="createProperty">
                  <v-row>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="newProperty.name"
                        label="Property Name"
                        required
                        variant="outlined"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="6"
                    >
                      <v-text-field
                        v-model="newProperty.address"
                        label="Address"
                        required
                        variant="outlined"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-select
                        v-model="newProperty.pricing_tier"
                        :items="pricingTiers"
                        label="Pricing Tier"
                        required
                        variant="outlined"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-text-field
                        v-model.number="newProperty.cleaning_duration"
                        label="Cleaning Duration (minutes)"
                        :max="480"
                        :min="30"
                        type="number"
                        variant="outlined"
                      />
                    </v-col>
                    <v-col
                      cols="12"
                      md="4"
                    >
                      <v-switch
                        v-model="newProperty.active"
                        color="success"
                        label="Active"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-textarea
                        v-model="newProperty.special_instructions"
                        label="Special Instructions"
                        rows="2"
                        variant="outlined"
                      />
                    </v-col>
                  </v-row>
                  <v-btn
                    color="primary"
                    :disabled="!newProperty.name || !newProperty.address"
                    :loading="loading"
                    type="submit"
                  >
                    Create Property
                  </v-btn>
                </v-form>
              </v-card-text>
            </v-card>

            <!-- Status Messages -->
            <v-alert
              v-if="error"
              class="mb-4"
              closable
              type="error"
              @click:close="clearError"
            >
              {{ error }}
            </v-alert>
            <v-alert
              v-if="success"
              class="mb-4"
              closable
              type="success"
              @click:close="clearSuccess"
            >
              {{ success }}
            </v-alert>

            <!-- Property Metrics Modal -->
            <v-dialog
              v-model="metricsDialog"
              max-width="600"
            >
              <v-card v-if="selectedPropertyMetrics">
                <v-card-title>Property Metrics</v-card-title>
                <v-card-text>
                  <v-row>
                    <v-col cols="6">
                      <v-card
                        color="info"
                        variant="tonal"
                      >
                        <v-card-text class="text-center">
                          <div class="text-h5">
                            {{ Math.round(selectedPropertyMetrics.utilizationRate * 100) }}%
                          </div>
                          <div class="text-caption">
                            Utilization Rate
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="6">
                      <v-card
                        color="success"
                        variant="tonal"
                      >
                        <v-card-text class="text-center">
                          <div class="text-h5">
                            ${{ Math.round(selectedPropertyMetrics.revenueProjection) }}
                          </div>
                          <div class="text-caption">
                            Revenue Projection
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="6">
                      <v-card
                        color="warning"
                        variant="tonal"
                      >
                        <v-card-text class="text-center">
                          <div class="text-h5">
                            {{ Math.round(selectedPropertyMetrics.averageGapBetweenBookings) }}
                          </div>
                          <div class="text-caption">
                            Avg Gap (days)
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                    <v-col cols="6">
                      <v-card
                        color="primary"
                        variant="tonal"
                      >
                        <v-card-text class="text-center">
                          <div class="text-h5">
                            {{ Math.round(selectedPropertyMetrics.turnPercentage * 100) }}%
                          </div>
                          <div class="text-caption">
                            Turn Percentage
                          </div>
                        </v-card-text>
                      </v-card>
                    </v-col>
                  </v-row>
                  <v-alert
                    class="mt-4"
                    :type="selectedPropertyMetrics.cleaningLoad === 'heavy' ? 'warning' : 'info'"
                  >
                    <strong>Cleaning Load:</strong> {{ selectedPropertyMetrics.cleaningLoad }}
                  </v-alert>
                </v-card-text>
                <v-card-actions>
                  <v-spacer />
                  <v-btn @click="metricsDialog = false">
                    Close
                  </v-btn>
                </v-card-actions>
              </v-card>
            </v-dialog>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
  import type { PricingTier } from '@/types'
  import { computed, onMounted, ref } from 'vue'
  import { useOwnerProperties } from '@/composables/owner/useOwnerProperties'
  import { useAuthStore } from '@/stores/auth'

  // Composables
  const ownerProperties = useOwnerProperties()
  const authStore = useAuthStore()

  // Destructure composable
  const {
    loading,
    error,
    success,
    myProperties,
    myPropertyMetrics,
    fetchMyProperties,
    createMyProperty,
    toggleMyPropertyStatus,
    getMyPropertyMetrics,
    getMyPropertyRecommendations,
  } = ownerProperties

  // Local state
  const metricsDialog = ref(false)
  const selectedPropertyMetrics = ref<any>(null)

  // Form data
  const newProperty = ref({
    name: '',
    address: '',
    pricing_tier: 'basic' as PricingTier,
    cleaning_duration: 120,
    active: true,
    special_instructions: '',
  })

  // Constants
  const pricingTiers = [
    { title: 'Basic', value: 'basic' },
    { title: 'Standard', value: 'standard' },
    { title: 'Premium', value: 'premium' },
    { title: 'Luxury', value: 'luxury' },
  ]

  // Computed
  const currentUserId = computed(() => authStore.user?.id)
  const recommendations = computed(() => getMyPropertyRecommendations())

  // Methods
  async function createProperty () {
    const propertyId = await createMyProperty(newProperty.value)
    if (propertyId) {
      // Reset form
      newProperty.value = {
        name: '',
        address: '',
        pricing_tier: 'basic',
        cleaning_duration: 120,
        active: true,
        special_instructions: '',
      }
    }
  }

  async function togglePropertyStatus (id: string, active: boolean) {
    await toggleMyPropertyStatus(id, active)
  }

  function viewPropertyMetrics (id: string) {
    const metrics = getMyPropertyMetrics(id)
    if (metrics) {
      selectedPropertyMetrics.value = metrics
      metricsDialog.value = true
    }
  }

  function clearError () {
    error.value = null
  }

  function clearSuccess () {
    success.value = null
  }

  // Lifecycle
  onMounted(() => {
    fetchMyProperties()
  })
</script>

<style scoped>
.v-card {
  transition: all 0.3s ease;
}

.v-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0,0,0,0.12);
}
</style>
