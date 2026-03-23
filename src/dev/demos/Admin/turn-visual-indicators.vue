<template>
  <v-container
    class="turn-visual-indicators-demo"
    fluid
  >
    <v-row>
      <v-col cols="12">
        <div class="demo-header mb-6">
          <h1 class="text-h3 font-weight-bold mb-2">
            <v-icon
              class="mr-3"
              color="warning"
              icon="mdi-alert-decagram"
            />
            Turn Booking Visual Indicators Demo
          </h1>
          <p class="text-h6 text-medium-emphasis">
            <strong>TASK-039</strong> - Enhanced visual indicators for urgent turn bookings with role-based styling
          </p>
        </div>
      </v-col>
    </v-row>

    <!-- Role Toggle -->
    <v-row>
      <v-col cols="12">
        <v-card
          class="mb-6"
          variant="outlined"
        >
          <v-card-title>
            <v-icon
              class="mr-2"
              icon="mdi-account-switch"
            />
            Role-Based Styling Demo
          </v-card-title>
          <v-card-text>
            <v-btn-toggle
              v-model="currentRole"
              class="mb-4"
              mandatory
              variant="outlined"
            >
              <v-btn value="owner">
                <v-icon
                  class="mr-2"
                  icon="mdi-home-account"
                />
                Property Owner
              </v-btn>
              <v-btn value="admin">
                <v-icon
                  class="mr-2"
                  icon="mdi-shield-account"
                />
                Admin
              </v-btn>
            </v-btn-toggle>
            <div class="text-caption text-medium-emphasis">
              <strong>Current Interface:</strong> {{ currentRole === 'owner' ? 'Property Owner (softer colors)' : 'Admin (urgent colors)' }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Priority Badges Demo -->
    <v-row>
      <v-col cols="12">
        <v-card
          class="mb-6"
          variant="outlined"
        >
          <v-card-title>
            <v-icon
              class="mr-2"
              icon="mdi-label"
            />
            Priority Badges (TurnPriorityBadge Component)
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col
                v-for="priority in priorities"
                :key="priority"
                cols="12"
                md="3"
                sm="6"
              >
                <div class="demo-section">
                  <h4 class="text-h6 mb-3 text-capitalize">
                    {{ priority }} Priority
                  </h4>

                  <!-- Basic Badge -->
                  <div class="mb-3">
                    <TurnPriorityBadge
                      :animated="true"
                      :priority="priority"
                      :user-role="currentRole"
                    />
                  </div>

                  <!-- Badge with Time Remaining -->
                  <div class="mb-3">
                    <TurnPriorityBadge
                      :animated="true"
                      :clickable="true"
                      :priority="priority"
                      :show-time-remaining="true"
                      :time-remaining="getTimeRemainingForPriority(priority)"
                      :user-role="currentRole"
                      @click="showToast(`Clicked ${priority} priority badge`)"
                    />
                  </div>

                  <!-- Different Sizes -->
                  <div class="d-flex flex-wrap gap-2">
                    <TurnPriorityBadge
                      :priority="priority"
                      size="x-small"
                      :user-role="currentRole"
                    />
                    <TurnPriorityBadge
                      :priority="priority"
                      size="small"
                      :user-role="currentRole"
                    />
                    <TurnPriorityBadge
                      :priority="priority"
                      size="default"
                      :user-role="currentRole"
                    />
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Urgent Turn Indicators Demo -->
    <v-row>
      <v-col cols="12">
        <v-card
          class="mb-6"
          variant="outlined"
        >
          <v-card-title>
            <v-icon
              class="mr-2"
              icon="mdi-alert-circle"
            />
            Urgent Turn Indicators (UrgentTurnIndicator Component)
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col
                v-for="alert in alertExamples"
                :key="alert.id"
                cols="12"
                lg="6"
              >
                <UrgentTurnIndicator
                  :animated="true"
                  :checkin-date="alert.checkinDate"
                  :checkout-date="alert.checkoutDate"
                  class="mb-4"
                  :cleaning-window="alert.cleaningWindow"
                  :priority="alert.priority"
                  :property-name="alert.propertyName"
                  :striped="alert.priority === 'urgent'"
                  :time-remaining="alert.timeRemaining"
                  :user-role="currentRole"
                  @assign="showToast(`Assign cleaner for ${alert.propertyName}`)"
                  @close="showToast(`Closed alert for ${alert.propertyName}`)"
                  @reschedule="showToast(`Reschedule ${alert.propertyName}`)"
                  @view="showToast(`View details for ${alert.propertyName}`)"
                />
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Legacy Alert Styles Demo -->
    <v-row>
      <v-col cols="12">
        <v-card
          class="mb-6"
          variant="outlined"
        >
          <v-card-title>
            <v-icon
              class="mr-2"
              icon="mdi-format-paint"
            />
            Enhanced CSS Classes Demo
          </v-card-title>
          <v-card-text>
            <v-row>
              <!-- Priority Styling Demo -->
              <v-col
                cols="12"
                md="6"
              >
                <h4 class="text-h6 mb-3">
                  Priority Styling
                </h4>
                <div
                  v-for="priority in priorities"
                  :key="`css-${priority}`"
                  :class="[
                    `${priority}-priority`,
                    'pa-4',
                    'mb-3',
                    'rounded-lg',
                    'elevation-2',
                    {
                      'owner-interface': currentRole === 'owner',
                      'admin-interface': currentRole === 'admin'
                    }
                  ]"
                >
                  <strong class="text-capitalize">{{ priority }} Priority Item</strong>
                  <div class="text-caption mt-1">
                    Enhanced border, background gradient, and {{ priority === 'urgent' ? 'animated effects' : 'subtle styling' }}
                  </div>
                </div>
              </v-col>

              <!-- Booking Type Styling Demo -->
              <v-col
                cols="12"
                md="6"
              >
                <h4 class="text-h6 mb-3">
                  Booking Type Styling
                </h4>
                <div
                  :class="[
                    'turn-booking',
                    'urgent-priority',
                    'pa-4',
                    'mb-3',
                    'rounded-lg',
                    'elevation-2',
                    'position-relative',
                    {
                      'owner-interface': currentRole === 'owner',
                      'admin-interface': currentRole === 'admin'
                    }
                  ]"
                >
                  <strong>Turn Booking</strong>
                  <div class="text-caption mt-1">
                    Enhanced turn booking with emoji badge, animations, and role-based colors
                  </div>
                </div>

                <div
                  :class="[
                    'standard-booking',
                    'normal-priority',
                    'pa-4',
                    'mb-3',
                    'rounded-lg',
                    'elevation-2',
                    'position-relative'
                  ]"
                >
                  <strong>Standard Booking</strong>
                  <div class="text-caption mt-1">
                    Standard booking with subtle styling and emoji indicator
                  </div>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Animation Showcase -->
    <v-row>
      <v-col cols="12">
        <v-card
          class="mb-6"
          variant="outlined"
        >
          <v-card-title>
            <v-icon
              class="mr-2"
              icon="mdi-animation"
            />
            Animation Showcase
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col
                cols="12"
                md="4"
              >
                <h4 class="text-h6 mb-3">
                  Urgent Pulse Animation
                </h4>
                <div
                  class="urgent-priority pa-4 rounded-lg elevation-2 mb-3"
                  style="min-height: 80px; display: flex; align-items: center; justify-content: center;"
                >
                  <strong>Urgent Priority with Pulse</strong>
                </div>
              </v-col>

              <v-col
                cols="12"
                md="4"
              >
                <h4 class="text-h6 mb-3">
                  Striped Animation
                </h4>
                <div
                  class="urgent-priority turn-booking pa-4 rounded-lg elevation-2 mb-3 position-relative"
                  style="min-height: 80px; display: flex; align-items: center; justify-content: center;"
                >
                  <strong>Turn Booking Stripes</strong>
                </div>
              </v-col>

              <v-col
                cols="12"
                md="4"
              >
                <h4 class="text-h6 mb-3">
                  Hover Effects
                </h4>
                <div
                  class="urgent-priority pa-4 rounded-lg elevation-2 mb-3 cursor-pointer"
                  style="min-height: 80px; display: flex; align-items: center; justify-content: center;"
                  @mouseover="showToast('Hover effect triggered!')"
                >
                  <strong>Hover for Glow + Shake</strong>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Interactive Controls -->
    <v-row>
      <v-col cols="12">
        <v-card variant="outlined">
          <v-card-title>
            <v-icon
              class="mr-2"
              icon="mdi-tune"
            />
            Interactive Controls
          </v-card-title>
          <v-card-text>
            <v-row>
              <v-col
                cols="12"
                md="6"
              >
                <v-switch
                  v-model="animationsEnabled"
                  class="mb-3"
                  color="primary"
                  hide-details
                  label="Enable Animations"
                />
                <v-switch
                  v-model="stripedEnabled"
                  class="mb-3"
                  color="primary"
                  hide-details
                  label="Enable Striped Backgrounds"
                />
                <v-switch
                  v-model="darkMode"
                  color="primary"
                  hide-details
                  label="Dark Mode"
                  @change="toggleDarkMode"
                />
              </v-col>

              <v-col
                cols="12"
                md="6"
              >
                <v-btn
                  class="mr-2 mb-2"
                  color="warning"
                  prepend-icon="mdi-test-tube"
                  variant="outlined"
                  @click="triggerTestAlert"
                >
                  Test Urgent Alert
                </v-btn>
                <v-btn
                  class="mr-2 mb-2"
                  color="primary"
                  prepend-icon="mdi-refresh"
                  variant="outlined"
                  @click="refreshData"
                >
                  Refresh Demo Data
                </v-btn>
                <v-btn
                  class="mb-2"
                  color="info"
                  prepend-icon="mdi-information"
                  variant="outlined"
                  @click="showImplementationInfo"
                >
                  Implementation Details
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Toast Notifications -->
    <v-snackbar
      v-model="toast.show"
      :color="toast.color"
      :timeout="3000"
    >
      {{ toast.message }}
    </v-snackbar>
  </v-container>
</template>

<script setup lang="ts">
  import { onMounted, ref, watch } from 'vue'
  import { useTheme } from 'vuetify'
  import TurnPriorityBadge from '@/components/dumb/shared/TurnPriorityBadge.vue'
  import UrgentTurnIndicator from '@/components/dumb/shared/UrgentTurnIndicator.vue'

  type Priority = 'low' | 'normal' | 'high' | 'urgent'

  // Component state
  const currentRole = ref<'owner' | 'admin'>('owner')
  const animationsEnabled = ref(true)
  const stripedEnabled = ref(true)
  const darkMode = ref(false)
  const theme = useTheme()

  // Toast notification system
  const toast = ref({
    show: false,
    message: '',
    color: 'info',
  })

  // Demo data
  const priorities: Priority[] = ['low', 'normal', 'high', 'urgent']

  const alertExamples = ref([
    {
      id: '1',
      priority: 'urgent' as Priority,
      propertyName: 'Oceanview Villa #205',
      checkoutDate: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 minutes from now
      checkinDate: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours from now
      cleaningWindow: {
        start: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(),
        duration: 165, // 2h 45m
      },
      timeRemaining: 25, // 25 minutes until checkout
    },
    {
      id: '2',
      priority: 'high' as Priority,
      propertyName: 'Downtown Loft #12B',
      checkoutDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
      checkinDate: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
      cleaningWindow: {
        start: new Date(Date.now() + 2.5 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString(),
        duration: 180, // 3 hours
      },
      timeRemaining: 115, // 1h 55m until checkout
    },
    {
      id: '3',
      priority: 'normal' as Priority,
      propertyName: 'Suburban House #45',
      checkoutDate: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
      checkinDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // tomorrow
      cleaningWindow: {
        start: new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString(),
        end: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        duration: 180, // 3 hours
      },
      timeRemaining: 480, // 8 hours until checkout
    },
  ])

  // Helper functions
  function getTimeRemainingForPriority (priority: Priority): number {
    switch (priority) {
      case 'urgent': { return 15
      }
      case 'high': { return 75
      }
      case 'normal': { return 240
      }
      case 'low': { return 720
      }
      default: { return 120
      }
    }
  }

  function showToast (message: string, color = 'info') {
    toast.value = {
      show: true,
      message,
      color,
    }
  }

  function toggleDarkMode () {
    theme.global.name.value = darkMode.value ? 'dark' : 'light'
  }

  function triggerTestAlert () {
    showToast('🚨 Test urgent alert triggered! Check the visual indicators.', 'warning')
  }

  function refreshData () {
    // Refresh time remaining values
    alertExamples.value[0].timeRemaining = Math.max(5, Math.floor(Math.random() * 60))
    alertExamples.value[1].timeRemaining = Math.max(30, Math.floor(Math.random() * 180))
    alertExamples.value[2].timeRemaining = Math.max(120, Math.floor(Math.random() * 480))

    showToast('Demo data refreshed with new time values!', 'success')
  }

  function showImplementationInfo () {
    showToast('TASK-039: Enhanced visual indicators with role-based styling, animations, and priority badges', 'info')
  }

  // Add dynamic CSS class to body for role-based styling
  function updateBodyClass () {
    document.body.classList.remove('owner-interface', 'admin-interface')
    document.body.classList.add(`${currentRole.value}-interface`)
  }

  // Watch for role changes
  watch(currentRole, updateBodyClass)

  onMounted(() => {
    updateBodyClass()
  })
</script>

<style scoped>
.turn-visual-indicators-demo {
  max-width: 1400px;
  margin: 0 auto;
}

.demo-header {
  text-align: center;
  background: linear-gradient(135deg, rgba(var(--v-theme-primary), 0.1) 0%, rgba(var(--v-theme-secondary), 0.1) 100%);
  padding: 2rem;
  border-radius: 12px;
  margin-bottom: 2rem;
}

.demo-section {
  padding: 1rem;
  border: 1px solid rgba(var(--v-theme-outline), 0.2);
  border-radius: 8px;
  background: rgba(var(--v-theme-surface), 0.5);
}

.cursor-pointer {
  cursor: pointer;
}

/* Ensure animations work properly */
.urgent-priority {
  transition: all 0.3s ease;
}

.urgent-priority:hover {
  transform: translateY(-2px);
}

/* Gap utility for older browsers */
.gap-2 > * + * {
  margin-left: 8px;
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .demo-header {
    padding: 1rem;
  }

  .demo-header h1 {
    font-size: 1.5rem !important;
  }

  .demo-header p {
    font-size: 1rem !important;
  }
}
</style>
