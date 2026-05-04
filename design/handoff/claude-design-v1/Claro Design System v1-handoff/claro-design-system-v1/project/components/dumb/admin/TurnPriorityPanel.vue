<template>
  <v-card
    class="turn-priority-panel"
    variant="outlined"
  >
    <v-card-title class="text-subtitle-1 py-2 d-flex align-center">
      <v-icon
        class="mr-2"
        color="error"
      >
        mdi-clock-alert
      </v-icon>
      System Turn Priority Queue
      <v-spacer />
      <v-chip
        :color="getTotalUrgencyColor()"
        size="small"
        variant="elevated"
      >
        {{ urgentTurns.length }} Urgent
      </v-chip>
      <v-btn
        :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        size="small"
        variant="text"
        @click="expanded = !expanded"
      />
    </v-card-title>

    <v-divider />

    <v-expand-transition>
      <v-card-text
        v-show="expanded"
        class="pa-0"
      >
        <!-- Summary Stats -->
        <v-container>
          <v-row>
            <v-col
              cols="12"
              md="3"
            >
              <v-card
                color="error"
                variant="tonal"
              >
                <v-card-text class="text-center py-3">
                  <div class="text-h4 font-weight-bold">
                    {{ criticalTurns.length }}
                  </div>
                  <div class="text-body-2">
                    Critical (&lt; 2 hrs)
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col
              cols="12"
              md="3"
            >
              <v-card
                color="warning"
                variant="tonal"
              >
                <v-card-text class="text-center py-3">
                  <div class="text-h4 font-weight-bold">
                    {{ urgentTurns.length }}
                  </div>
                  <div class="text-body-2">
                    Urgent (&lt; 6 hrs)
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col
              cols="12"
              md="3"
            >
              <v-card
                color="info"
                variant="tonal"
              >
                <v-card-text class="text-center py-3">
                  <div class="text-h4 font-weight-bold">
                    {{ unassignedTurns.length }}
                  </div>
                  <div class="text-body-2">
                    Unassigned
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
            <v-col
              cols="12"
              md="3"
            >
              <v-card
                color="success"
                variant="tonal"
              >
                <v-card-text class="text-center py-3">
                  <div class="text-h4 font-weight-bold">
                    ${{ estimatedRevenue.toLocaleString() }}
                  </div>
                  <div class="text-body-2">
                    Revenue at Risk
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>
        </v-container>

        <v-divider />

        <!-- Filters and Controls -->
        <v-container>
          <v-row>
            <v-col
              cols="12"
              md="6"
            >
              <v-select
                v-model="selectedUrgencyFilter"
                clearable
                density="compact"
                :items="urgencyFilterOptions"
                label="Urgency Level"
                variant="outlined"
                @update:model-value="handleFilterChange"
              />
            </v-col>
            <v-col
              cols="12"
              md="6"
            >
              <v-select
                v-model="selectedStatusFilter"
                clearable
                density="compact"
                :items="statusFilterOptions"
                label="Assignment Status"
                variant="outlined"
                @update:model-value="handleFilterChange"
              />
            </v-col>
          </v-row>

          <v-row>
            <v-col cols="12">
              <div class="d-flex gap-2 flex-wrap">
                <v-btn
                  color="primary"
                  size="small"
                  variant="outlined"
                  @click="handleRefresh"
                >
                  <v-icon start>
                    mdi-refresh
                  </v-icon>
                  Refresh
                </v-btn>

                <v-btn
                  color="warning"
                  :disabled="selectedTurns.length === 0"
                  size="small"
                  variant="outlined"
                  @click="handleBulkAssign"
                >
                  <v-icon start>
                    mdi-account-multiple
                  </v-icon>
                  Bulk Assign ({{ selectedTurns.length }})
                </v-btn>

                <v-btn
                  color="error"
                  :disabled="criticalTurns.length === 0"
                  size="small"
                  variant="outlined"
                  @click="handleEscalateAll"
                >
                  <v-icon start>
                    mdi-alert-octagon
                  </v-icon>
                  Escalate Critical
                </v-btn>

                <v-spacer />

                <v-switch
                  v-model="autoRefresh"
                  color="primary"
                  density="compact"
                  hide-details
                  @update:model-value="handleAutoRefreshToggle"
                />
                <span class="text-body-2 ml-2">Auto-refresh</span>
              </div>
            </v-col>
          </v-row>
        </v-container>

        <v-divider />

        <!-- Turn List -->
        <div class="turn-list">
          <v-list
            class="pa-0"
            max-height="500"
            style="overflow-y: auto;"
          >
            <template
              v-for="(turn, index) in filteredTurns"
              :key="turn.id"
            >
              <v-list-item
                :class="getTurnItemClass(turn)"
                @click="toggleTurnSelection(turn.id)"
              >
                <template #prepend>
                  <v-checkbox
                    color="primary"
                    density="compact"
                    hide-details
                    :model-value="selectedTurns.includes(turn.id)"
                    @click.stop="toggleTurnSelection(turn.id)"
                  />
                  <v-avatar
                    class="ml-2"
                    :color="getUrgencyColor(turn)"
                    size="40"
                  >
                    <v-icon>{{ getUrgencyIcon(turn) }}</v-icon>
                  </v-avatar>
                </template>

                <v-list-item-title class="font-weight-medium">
                  {{ getPropertyName(turn.property_id) }}
                  <v-chip
                    class="ml-2"
                    :color="getUrgencyColor(turn)"
                    size="x-small"
                  >
                    {{ getTimeRemaining(turn) }}
                  </v-chip>
                </v-list-item-title>

                <v-list-item-subtitle>
                  <div class="d-flex align-center mb-1">
                    <v-icon
                      class="mr-1"
                      size="small"
                    >
                      mdi-account
                    </v-icon>
                    {{ getPropertyOwnerName(turn.owner_id) }}
                    <v-icon
                      class="mx-2"
                      size="small"
                    >
                      mdi-map-marker
                    </v-icon>
                    {{ getPropertyAddress(turn.property_id) }}
                  </div>
                  <div class="d-flex align-center">
                    <v-icon
                      class="mr-1"
                      size="small"
                    >
                      mdi-calendar-export
                    </v-icon>
                    {{ formatDateTime(turn.checkout_date) }}
                    <v-icon
                      class="mx-2"
                      size="small"
                    >
                      mdi-calendar-import
                    </v-icon>
                    {{ formatDateTime(turn.checkin_date) }}
                  </div>
                </v-list-item-subtitle>

                <template #append>
                  <div class="d-flex flex-column align-end">
                    <!-- Assignment Status -->
                    <div class="mb-2">
                      <v-chip
                        v-if="turn.assigned_cleaner_id"
                        color="success"
                        size="small"
                        variant="tonal"
                      >
                        <v-icon start>
                          mdi-account-check
                        </v-icon>
                        {{ getCleanerName(turn.assigned_cleaner_id) }}
                      </v-chip>
                      <v-chip
                        v-else
                        color="error"
                        size="small"
                        variant="tonal"
                      >
                        <v-icon start>
                          mdi-account-alert
                        </v-icon>
                        Unassigned
                      </v-chip>
                    </div>

                    <!-- Action Buttons -->
                    <div class="d-flex gap-1">
                      <v-btn
                        v-if="!turn.assigned_cleaner_id"
                        color="primary"
                        size="x-small"
                        variant="outlined"
                        @click.stop="handleAssignCleaner(turn.id)"
                      >
                        <v-icon>mdi-account-plus</v-icon>
                      </v-btn>

                      <v-btn
                        color="info"
                        size="x-small"
                        variant="outlined"
                        @click.stop="handleViewDetails(turn.id)"
                      >
                        <v-icon>mdi-eye</v-icon>
                      </v-btn>

                      <v-btn
                        v-if="getUrgencyLevel(turn) === 'critical'"
                        color="error"
                        size="x-small"
                        variant="outlined"
                        @click.stop="handleEscalate(turn.id)"
                      >
                        <v-icon>mdi-alert</v-icon>
                      </v-btn>
                    </div>
                  </div>
                </template>
              </v-list-item>

              <v-divider v-if="index < filteredTurns.length - 1" />
            </template>

            <!-- Empty State -->
            <v-list-item v-if="filteredTurns.length === 0">
              <v-list-item-title class="text-center text-medium-emphasis py-8">
                <v-icon
                  class="mb-4"
                  size="64"
                >
                  mdi-check-circle
                </v-icon>
                <div class="text-h6">
                  No Urgent Turns
                </div>
                <div class="text-body-2">
                  All turn bookings are under control
                </div>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </div>

        <!-- Business Impact Alert -->
        <v-container v-if="showBusinessImpactAlert">
          <v-alert
            class="mb-0"
            :title="businessImpactAlert.title"
            :type="businessImpactAlert.type"
            variant="tonal"
          >
            <p
              v-for="message in businessImpactAlert.messages"
              :key="message"
              class="mb-1"
            >
              {{ message }}
            </p>
          </v-alert>
        </v-container>
      </v-card-text>
    </v-expand-transition>
  </v-card>
</template>

<script setup lang="ts">
  import type { Booking } from '@/types/booking'
  import type { Property } from '@/types/property'
  import type { Cleaner } from '@/types/user'
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import { formatPropertyAddress } from '@/types/property'

  // Props
  interface Props {
    turns: Booking[]
    properties: Property[]
    cleaners: Cleaner[]
    propertyOwners: Array<{ id: string, name: string }>
    loading?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    loading: false,
  })

  // Emits
  interface Emits {
    'assign-cleaner': [turnId: string]
    'view-details': [turnId: string]
    'escalate': [turnId: string]
    'bulk-assign': [turnIds: string[]]
    'escalate-all': [turnIds: string[]]
    'refresh': []
  }

  const emit = defineEmits<Emits>()

  // State
  const expanded = ref(true)
  const selectedTurns = ref<string[]>([])
  const selectedUrgencyFilter = ref<string>('')
  const selectedStatusFilter = ref<string>('')
  const autoRefresh = ref(true)
  const refreshInterval = ref<ReturnType<typeof setInterval> | null>(null)

  // Computed properties
  const urgentTurns = computed(() => {
    return props.turns.filter(turn => {
      const urgency = getUrgencyLevel(turn)
      return urgency === 'urgent' || urgency === 'critical'
    })
  })

  const criticalTurns = computed(() => {
    return props.turns.filter(turn => getUrgencyLevel(turn) === 'critical')
  })

  const unassignedTurns = computed(() => {
    return props.turns.filter(turn => !turn.assigned_cleaner_id)
  })

  const estimatedRevenue = computed(() => {
    // Mock calculation - would be based on property pricing
    return urgentTurns.value.length * 150 // $150 average per turn
  })

  const filteredTurns = computed(() => {
    let filtered = [...props.turns]

    // Filter by urgency
    if (selectedUrgencyFilter.value) {
      filtered = filtered.filter(turn =>
        getUrgencyLevel(turn) === selectedUrgencyFilter.value,
      )
    }

    // Filter by assignment status
    if (selectedStatusFilter.value) {
      if (selectedStatusFilter.value === 'assigned') {
        filtered = filtered.filter(turn => turn.assigned_cleaner_id)
      } else if (selectedStatusFilter.value === 'unassigned') {
        filtered = filtered.filter(turn => !turn.assigned_cleaner_id)
      }
    }

    // Sort by urgency and time remaining
    return filtered.toSorted((a, b) => {
      const aUrgency = getUrgencyLevel(a)
      const bUrgency = getUrgencyLevel(b)

      if (aUrgency === 'critical' && bUrgency !== 'critical') return -1
      if (bUrgency === 'critical' && aUrgency !== 'critical') return 1

      // Sort by checkout time (earliest first)
      return new Date(a.checkout_date).getTime() - new Date(b.checkout_date).getTime()
    })
  })

  const showBusinessImpactAlert = computed(() => {
    return businessImpactAlert.value.messages.length > 0
  })

  const businessImpactAlert = computed(() => {
    const alert = {
      type: 'info' as 'info' | 'warning' | 'error',
      title: '',
      messages: [] as string[],
    }

    if (criticalTurns.value.length > 0) {
      alert.type = 'error'
      alert.title = 'Critical Business Impact'
      alert.messages.push(`${criticalTurns.value.length} critical turns require immediate attention`, 'Client satisfaction and revenue at high risk')
    } else if (unassignedTurns.value.length > 3) {
      alert.type = 'warning'
      alert.title = 'High Unassigned Turn Volume'
      alert.messages.push(`${unassignedTurns.value.length} turns need cleaner assignment`, 'Consider activating additional cleaning staff')
    }

    return alert
  })

  // Filter options
  const urgencyFilterOptions = [
    { title: 'Critical (< 2 hours)', value: 'critical' },
    { title: 'Urgent (< 6 hours)', value: 'urgent' },
    { title: 'Standard', value: 'standard' },
  ]

  const statusFilterOptions = [
    { title: 'Assigned', value: 'assigned' },
    { title: 'Unassigned', value: 'unassigned' },
  ]

  // Methods
  function getUrgencyLevel (turn: Booking): 'critical' | 'urgent' | 'standard' {
    const now = new Date()
    const checkoutTime = new Date(turn.checkout_date)
    const hoursUntil = (checkoutTime.getTime() - now.getTime()) / (1000 * 60 * 60)

    if (hoursUntil <= 2) return 'critical'
    if (hoursUntil <= 6) return 'urgent'
    return 'standard'
  }

  function getUrgencyColor (turn: Booking) {
    const urgency = getUrgencyLevel(turn)
    const colors = {
      critical: 'error',
      urgent: 'warning',
      standard: 'info',
    }
    return colors[urgency]
  }

  function getUrgencyIcon (turn: Booking) {
    const urgency = getUrgencyLevel(turn)
    const icons = {
      critical: 'mdi-alert-octagon',
      urgent: 'mdi-clock-alert',
      standard: 'mdi-clock',
    }
    return icons[urgency]
  }

  function getTotalUrgencyColor () {
    if (criticalTurns.value.length > 0) return 'error'
    if (urgentTurns.value.length > 0) return 'warning'
    return 'success'
  }

  function getTurnItemClass (turn: Booking) {
    const urgency = getUrgencyLevel(turn)
    const classes = ['turn-item']

    if (urgency === 'critical') classes.push('turn-critical')
    else if (urgency === 'urgent') classes.push('turn-urgent')

    if (selectedTurns.value.includes(turn.id)) classes.push('turn-selected')

    return classes.join(' ')
  }

  function getTimeRemaining (turn: Booking) {
    const now = new Date()
    const checkoutTime = new Date(turn.checkout_date)
    const diffMs = checkoutTime.getTime() - now.getTime()

    if (diffMs <= 0) return 'OVERDUE'

    const hours = Math.floor(diffMs / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (hours === 0) return `${minutes}m`
    if (hours < 24) return `${hours}h ${minutes}m`

    const days = Math.floor(hours / 24)
    return `${days}d ${hours % 24}h`
  }

  function formatDateTime (dateTime: string) {
    const date = new Date(dateTime)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
  }

  function getPropertyName (propertyId: string) {
    const property = props.properties.find(p => p.id === propertyId)
    return property ? formatPropertyAddress(property, 'short') : 'Unknown Property'
  }

  function getPropertyAddress (propertyId: string) {
    const property = props.properties.find(p => p.id === propertyId)
    return property ? formatPropertyAddress(property) : 'Unknown Address'
  }

  function getPropertyOwnerName (ownerId: string) {
    const owner = props.propertyOwners.find(o => o.id === ownerId)
    return owner?.name || `Owner ${ownerId.slice(-4)}`
  }

  function getCleanerName (cleanerId: string) {
    const cleaner = props.cleaners.find(c => c.id === cleanerId)
    return cleaner?.name || 'Unknown Cleaner'
  }

  function toggleTurnSelection (turnId: string) {
    const index = selectedTurns.value.indexOf(turnId)
    if (index === -1) {
      selectedTurns.value.push(turnId)
    } else {
      selectedTurns.value.splice(index, 1)
    }
  }

  function handleFilterChange () {
  // Filters are reactive, no additional action needed
  }

  function handleRefresh () {
    emit('refresh')
  }

  function handleAssignCleaner (turnId: string) {
    emit('assign-cleaner', turnId)
  }

  function handleViewDetails (turnId: string) {
    emit('view-details', turnId)
  }

  function handleEscalate (turnId: string) {
    emit('escalate', turnId)
  }

  function handleBulkAssign () {
    if (selectedTurns.value.length > 0) {
      emit('bulk-assign', [...selectedTurns.value])
    }
  }

  function handleEscalateAll () {
    const criticalIds = criticalTurns.value.map(turn => turn.id)
    if (criticalIds.length > 0) {
      emit('escalate-all', criticalIds)
    }
  }

  function handleAutoRefreshToggle (enabled: boolean | null) {
    if (enabled) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  }

  function startAutoRefresh () {
    if (refreshInterval.value) return

    refreshInterval.value = setInterval(() => {
      emit('refresh')
    }, 30_000) // Refresh every 30 seconds
  }

  function stopAutoRefresh () {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
  }

  // Lifecycle
  onMounted(() => {
    if (autoRefresh.value) {
      startAutoRefresh()
    }
  })

  onUnmounted(() => {
    stopAutoRefresh()
  })

  // Watch for auto-refresh changes
  watch(autoRefresh, enabled => {
    if (enabled) {
      startAutoRefresh()
    } else {
      stopAutoRefresh()
    }
  })
</script>

<style scoped>
.turn-priority-panel {
  position: sticky;
  top: 0;
  z-index: 5;
}

.v-card-title {
  background-color: rgb(var(--v-theme-surface-variant));
}

.turn-list {
  max-height: 500px;
  overflow-y: auto;
}

.turn-item {
  transition: all 0.2s ease;
}

.turn-critical {
  border-left: 4px solid rgb(var(--v-theme-error));
  background-color: rgb(var(--v-theme-error), 0.05);
}

.turn-urgent {
  border-left: 4px solid rgb(var(--v-theme-warning));
  background-color: rgb(var(--v-theme-warning), 0.05);
}

.turn-selected {
  background-color: rgb(var(--v-theme-primary), 0.1);
}

.turn-item:hover {
  background-color: rgb(var(--v-theme-surface-variant), 0.5);
}

</style>
