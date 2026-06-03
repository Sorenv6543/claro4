<template>
  <v-card
    class="admin-quick-actions"
    :elevation="elevation"
    :variant="variant"
  >
    <v-card-title class="text-h6 pb-2 d-flex align-center">
      <v-icon class="mr-2">
        mdi-cog
      </v-icon>
      Admin Actions
      <v-spacer />

      <v-chip
        v-if="urgentCount > 0"
        color="error"
        size="small"
        variant="elevated"
      >
        <v-icon
          size="small"
          start
        >
          mdi-alert
        </v-icon>
        {{ urgentCount }} Urgent
      </v-chip>
    </v-card-title>

    <v-divider />

    <v-card-text class="pa-3">
      <v-container
        class="pa-0"
        fluid
      >
        <!-- Critical Actions Row -->
        <v-row class="mb-2">
          <v-col
            cols="6"
            lg="6"
            md="12"
            sm="6"
          >
            <v-btn
              block
              color="error"
              :disabled="disabled"
              :loading="loading"
              size="large"
              variant="elevated"
              @click="handleAction('manage-urgent-turns')"
            >
              <v-icon class="mr-2">
                mdi-clock-alert
              </v-icon>

              <span class="d-none d-sm-inline">Urgent</span>
              Turns
              <v-badge
                v-if="urgentCount > 0"
                class="ml-1"
                color="white"
                :content="urgentCount"
                inline
                text-color="error"
              />
            </v-btn>
          </v-col>

          <v-col
            cols="6"
            lg="6"
            md="12"
            sm="6"
          >
            <v-btn
              block
              color="primary"
              :disabled="disabled"
              :loading="loading"
              size="large"
              variant="elevated"
              @click="handleAction('assign-cleaners')"
            >
              <v-icon class="mr-2">
                mdi-account-hard-hat
              </v-icon>

              <span class="d-none d-sm-inline">Assign</span>
              Cleaners
            </v-btn>
          </v-col>
        </v-row>

        <!-- Primary Management Actions Row -->
        <v-row class="mb-2">
          <v-col
            cols="6"
            lg="6"
            md="12"
            sm="6"
          >
            <v-btn
              block
              color="secondary"
              :disabled="disabled"
              :loading="loading"
              variant="tonal"
              @click="handleAction('master-calendar')"
            >
              <v-icon class="mr-2">
                mdi-calendar-multiple
              </v-icon>

              <span class="d-none d-sm-inline">Master</span>
              Calendar
            </v-btn>
          </v-col>

          <v-col
            cols="6"
            lg="6"
            md="12"
            sm="6"
          >
            <v-btn
              block
              color="info"
              :disabled="disabled"
              :loading="loading"
              variant="tonal"
              @click="handleAction('create-booking')"
            >
              <v-icon class="mr-2">
                mdi-calendar-plus
              </v-icon>

              <span class="d-none d-sm-inline">New</span>
              Booking
            </v-btn>
          </v-col>
        </v-row>

        <!-- Bulk Operations (Collapsible) -->
        <v-expand-transition>
          <div v-if="showBulkActions">
            <v-divider class="my-3" />

            <v-row class="mb-2">
              <v-col cols="12">
                <div class="text-subtitle-2 text-medium-emphasis mb-2">
                  <v-icon
                    class="mr-1"
                    size="small"
                  >
                    mdi-format-list-bulleted-square
                  </v-icon>
                  Bulk Operations
                </div>
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="6"
                lg="6"
                md="12"
                sm="6"
              >
                <v-btn
                  block
                  color="warning"
                  :disabled="disabled"
                  :loading="loading"
                  variant="outlined"
                  @click="handleAction('bulk-assign')"
                >
                  <v-icon class="mr-2">
                    mdi-account-multiple
                  </v-icon>

                  <span class="d-none d-sm-inline">Bulk</span>
                  Assign
                </v-btn>
              </v-col>

              <v-col
                cols="6"
                lg="6"
                md="12"
                sm="6"
              >
                <v-btn
                  block
                  color="orange"
                  :disabled="disabled"
                  :loading="loading"
                  variant="outlined"
                  @click="handleAction('bulk-reschedule')"
                >
                  <v-icon class="mr-2">
                    mdi-calendar-sync
                  </v-icon>

                  <span class="d-none d-sm-inline">Bulk</span>
                  Reschedule
                </v-btn>
              </v-col>
            </v-row>
          </div>
        </v-expand-transition>

        <!-- Management Actions (Collapsible) -->
        <v-expand-transition>
          <div v-if="showManagementActions">
            <v-divider class="my-3" />

            <v-row class="mb-2">
              <v-col cols="12">
                <div class="text-subtitle-2 text-medium-emphasis mb-2">
                  <v-icon
                    class="mr-1"
                    size="small"
                  >
                    mdi-cog-outline
                  </v-icon>
                  Business Management
                </div>
              </v-col>
            </v-row>

            <v-row>
              <v-col
                cols="6"
                lg="6"
                md="12"
                sm="6"
              >
                <v-btn
                  block
                  color="success"
                  :disabled="disabled"
                  :loading="loading"
                  variant="outlined"
                  @click="handleAction('manage-cleaners')"
                >
                  <v-icon class="mr-2">
                    mdi-account-group
                  </v-icon>

                  <span class="d-none d-sm-inline">Manage</span>
                  Cleaners
                </v-btn>
              </v-col>

              <v-col
                cols="6"
                lg="6"
                md="12"
                sm="6"
              >
                <v-btn
                  block
                  color="purple"
                  :disabled="disabled"
                  :loading="loading"
                  variant="outlined"
                  @click="handleAction('view-reports')"
                >
                  <v-icon class="mr-2">
                    mdi-chart-line
                  </v-icon>

                  <span class="d-none d-sm-inline">Business</span>
                  Reports
                </v-btn>
              </v-col>
            </v-row>

            <v-row class="mt-2">
              <v-col
                cols="6"
                lg="6"
                md="12"
                sm="6"
              >
                <v-btn
                  block
                  color="indigo"
                  :disabled="disabled"
                  :loading="loading"
                  variant="outlined"
                  @click="handleAction('manage-properties')"
                >
                  <v-icon class="mr-2">
                    mdi-home-group
                  </v-icon>

                  <span class="d-none d-sm-inline">All</span>
                  Properties
                </v-btn>
              </v-col>

              <v-col
                cols="6"
                lg="6"
                md="12"
                sm="6"
              >
                <v-btn
                  block
                  color="teal"
                  :disabled="disabled"
                  :loading="loading"
                  variant="outlined"
                  @click="handleAction('system-settings')"
                >
                  <v-icon class="mr-2">
                    mdi-cog-box
                  </v-icon>

                  <span class="d-none d-sm-inline">System</span>
                  Settings
                </v-btn>
              </v-col>
            </v-row>
          </div>
        </v-expand-transition>

        <!-- Action Toggles -->
        <v-row class="mt-2">
          <v-col cols="6">
            <v-btn
              block
              size="small"
              variant="text"
              @click="showBulkActions = !showBulkActions"
            >
              <v-icon class="mr-1">
                {{ showBulkActions ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
              </v-icon>
              {{ showBulkActions ? 'Hide' : 'Bulk' }} Actions
            </v-btn>
          </v-col>

          <v-col cols="6">
            <v-btn
              block
              size="small"
              variant="text"
              @click="showManagementActions = !showManagementActions"
            >
              <v-icon class="mr-1">
                {{ showManagementActions ? 'mdi-chevron-up' : 'mdi-chevron-down' }}
              </v-icon>
              {{ showManagementActions ? 'Hide' : 'More' }} Tools
            </v-btn>
          </v-col>
        </v-row>

        <!-- Quick Stats (Optional) -->
        <v-expand-transition>
          <div v-if="showStats">
            <v-divider class="my-3" />

            <v-row>
              <v-col cols="12">
                <div class="text-subtitle-2 text-medium-emphasis mb-2">
                  <v-icon
                    class="mr-1"
                    size="small"
                  >
                    mdi-chart-box
                  </v-icon>
                  Quick Stats
                </div>
              </v-col>
            </v-row>

            <v-row>
              <v-col cols="4">
                <div class="text-center">
                  <div class="text-h6 text-primary">
                    {{ todayBookings }}
                  </div>

                  <div class="text-caption text-medium-emphasis">
                    Today
                  </div>
                </div>
              </v-col>

              <v-col cols="4">
                <div class="text-center">
                  <div class="text-h6 text-warning">
                    {{ unassignedCount }}
                  </div>

                  <div class="text-caption text-medium-emphasis">
                    Unassigned
                  </div>
                </div>
              </v-col>

              <v-col cols="4">
                <div class="text-center">
                  <div class="text-h6 text-success">
                    {{ completedToday }}
                  </div>

                  <div class="text-caption text-medium-emphasis">
                    Completed
                  </div>
                </div>
              </v-col>
            </v-row>
          </div>
        </v-expand-transition>

        <!-- Stats Toggle -->
        <v-row class="mt-1">
          <v-col cols="12">
            <v-btn
              block
              size="x-small"
              variant="text"
              @click="showStats = !showStats"
            >
              <v-icon
                class="mr-1"
                size="small"
              >
                {{ showStats ? 'mdi-chevron-up' : 'mdi-chart-box-outline' }}
              </v-icon>
              {{ showStats ? 'Hide Stats' : 'Show Stats' }}
            </v-btn>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  // Props
  interface Props {
    loading?: boolean
    disabled?: boolean
    elevation?: number
    variant?: 'elevated' | 'flat' | 'tonal' | 'outlined' | 'text' | 'plain'
    urgentCount?: number
    todayBookings?: number
    unassignedCount?: number
    completedToday?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
    disabled: false,
    elevation: 2,
    variant: 'elevated',
    urgentCount: 0,
    todayBookings: 0,
    unassignedCount: 0,
    completedToday: 0,
  })

  // Emits
  interface Emits {
    (e: 'action', actionType: AdminActionType): void
  }

  const emit = defineEmits<Emits>()

  // Types
  type AdminActionType
    = | 'manage-urgent-turns'
      | 'assign-cleaners'
      | 'master-calendar'
      | 'create-booking'
      | 'bulk-assign'
      | 'bulk-reschedule'
      | 'manage-cleaners'
      | 'view-reports'
      | 'manage-properties'
      | 'system-settings'

  // Local state
  const showBulkActions = ref(false)
  const showManagementActions = ref(false)
  const showStats = ref(false)

  // Methods
  function handleAction (actionType: AdminActionType) {
    if (props.loading || props.disabled) return

    emit('action', actionType)
  }

// Computed (removed unused hasUrgentItems to fix linter warning)
</script>
