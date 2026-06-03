<template>
  <v-alert
    :class="[
      'urgent-turn-indicator',
      `role-${userRole}`,
      {
        'urgent-turn-indicator--animated': animated,
        'urgent-turn-indicator--striped': striped
      }
    ]"
    :closable="closable"
    :color="getAlertColor()"
    :icon="getAlertIcon()"
    :variant="variant"
    @click:close="emit('close')"
  >
    <template #title>
      <div class="d-flex align-center">
        <span class="alert-title">{{ getAlertTitle() }}</span>
        <v-spacer />

        <TurnPriorityBadge
          v-if="showPriorityBadge"
          :animated="animated"
          :priority="priority"
          size="small"
          :user-role="userRole"
        />
      </div>
    </template>

    <div class="alert-content">
      <!-- Main Message -->
      <div class="main-message mb-3">
        {{ getMainMessage() }}
      </div>

      <!-- Booking Details -->
      <div
        v-if="showDetails"
        class="booking-details"
      >
        <v-row density="comfortable">
          <v-col
            cols="12"
            md="6"
          >
            <div class="detail-item">
              <v-icon
                class="mr-2"
                icon="mdi-home"
                size="small"
              />

              <strong>Property:</strong> {{ propertyName || 'Unknown Property' }}
            </div>
          </v-col>

          <v-col
            cols="12"
            md="6"
          >
            <div class="detail-item">
              <v-icon
                class="mr-2"
                icon="mdi-timer-outline"
                size="small"
              />

              <strong>Time Remaining:</strong>
              <span :class="getTimeRemainingClass()">{{ formatTimeRemaining() }}</span>
            </div>
          </v-col>
        </v-row>

        <v-row density="comfortable">
          <v-col
            cols="12"
            md="6"
          >
            <div class="detail-item">
              <v-icon
                class="mr-2"
                icon="mdi-logout"
                size="small"
              />

              <strong>Checkout:</strong> {{ formatDateTime(checkoutDate) }}
            </div>
          </v-col>

          <v-col
            cols="12"
            md="6"
          >
            <div class="detail-item">
              <v-icon
                class="mr-2"
                icon="mdi-login"
                size="small"
              />

              <strong>Check-in:</strong> {{ formatDateTime(checkinDate) }}
            </div>
          </v-col>
        </v-row>

        <div
          v-if="cleaningWindow"
          class="cleaning-window mt-2"
        >
          <v-icon
            class="mr-2"
            icon="mdi-clock-fast"
            size="small"
          />

          <strong>Cleaning Window:</strong>
          {{ cleaningWindow.duration }} minutes
          ({{ formatTime(cleaningWindow.start) }} - {{ formatTime(cleaningWindow.end) }})
        </div>
      </div>

      <!-- Action Buttons -->
      <div
        v-if="showActions"
        class="action-buttons mt-3"
      >
        <v-btn
          class="mr-2"
          :color="getActionColor()"
          prepend-icon="mdi-eye"
          size="small"
          variant="flat"
          @click="emit('view')"
        >
          View Details
        </v-btn>

        <v-btn
          v-if="userRole === 'admin'"
          class="mr-2"
          color="success"
          prepend-icon="mdi-account-check"
          size="small"
          variant="flat"
          @click="emit('assign')"
        >
          Assign Cleaner
        </v-btn>

        <v-btn
          color="primary"
          prepend-icon="mdi-calendar-edit"
          size="small"
          variant="outlined"
          @click="emit('reschedule')"
        >
          {{ userRole === 'admin' ? 'Manage' : 'Reschedule' }}
        </v-btn>
      </div>

      <!-- Real-time countdown -->
      <div
        v-if="showCountdown && timeRemaining !== undefined"
        class="countdown-timer mt-2"
      >
        <v-progress-linear
          class="mb-1"
          :color="getProgressColor()"
          height="6"
          :model-value="getProgressValue()"
          striped
        />

        <div class="countdown-text">
          <v-icon
            class="mr-1"
            icon="mdi-timer-sand"
            size="x-small"
          />

          <span class="text-caption">{{ getCountdownText() }}</span>
        </div>
      </div>
    </div>
  </v-alert>
</template>

<script setup lang="ts">

  import TurnPriorityBadge from './TurnPriorityBadge.vue'

  type BookingPriority = 'low' | 'normal' | 'high' | 'urgent'

  interface CleaningWindow {
    start: string
    end: string
    duration: number // minutes
  }

  interface Props {
    priority: BookingPriority
    userRole?: 'owner' | 'admin' | 'cleaner'
    propertyName?: string
    checkoutDate: string
    checkinDate: string
    cleaningWindow?: CleaningWindow
    timeRemaining?: number // minutes until checkout
    animated?: boolean
    striped?: boolean
    closable?: boolean
    showDetails?: boolean
    showActions?: boolean
    showPriorityBadge?: boolean
    showCountdown?: boolean
    variant?: 'flat' | 'tonal' | 'outlined' | 'text'
  }

  interface Emits {
    (e: 'close' | 'view' | 'assign' | 'reschedule'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    userRole: 'owner',
    animated: true,
    striped: true,
    closable: true,
    showDetails: true,
    showActions: true,
    showPriorityBadge: true,
    showCountdown: true,
    variant: 'tonal',
  })

  const emit = defineEmits<Emits>()

  // Get role-based alert styling
  function getAlertColor (): string {
    const isOwner = props.userRole === 'owner'

    switch (props.priority) {
      case 'urgent': {
        return isOwner ? 'warning' : 'error'
      }
      case 'high': {
        return 'warning'
      }
      case 'normal': {
        return 'primary'
      }
      case 'low': {
        return 'info'
      }
      default: {
        return 'warning'
      }
    }
  }

  function getAlertIcon (): string {
    switch (props.priority) {
      case 'urgent': {
        return 'mdi-alert-circle'
      }
      case 'high': {
        return 'mdi-clock-alert'
      }
      case 'normal': {
        return 'mdi-information'
      }
      case 'low': {
        return 'mdi-information-outline'
      }
      default: {
        return 'mdi-alert'
      }
    }
  }

  // Role-based messaging
  function getAlertTitle (): string {
    const isOwner = props.userRole === 'owner'

    switch (props.priority) {
      case 'urgent': {
        return isOwner ? 'Urgent Cleaning Required' : 'CRITICAL TURN BOOKING'
      }
      case 'high': {
        return isOwner ? 'High Priority Cleaning' : 'HIGH PRIORITY TURN'
      }
      case 'normal': {
        return isOwner ? 'Scheduled Cleaning' : 'SCHEDULED TURN'
      }
      case 'low': {
        return isOwner ? 'Upcoming Cleaning' : 'LOW PRIORITY TURN'
      }
      default: {
        return 'Turn Booking Alert'
      }
    }
  }

  function getMainMessage (): string {
    const isOwner = props.userRole === 'owner'
    const isUrgent = props.priority === 'urgent'

    if (isOwner) {
      return isUrgent ? 'Your property needs immediate attention for the upcoming guest check-in. Please ensure cleaning is scheduled as soon as possible.' : 'A cleaning has been scheduled for your property to prepare for the next guest arrival.'
    } else {
      return isUrgent ? 'IMMEDIATE ACTION REQUIRED: Critical turn booking with minimal cleaning time. Assign cleaner immediately to prevent guest impact.' : 'Turn booking requires attention. Review cleaning assignment and timeline to ensure timely completion.'
    }
  }

  // Styling helpers
  function getActionColor (): string {
    return props.priority === 'urgent' ? getAlertColor() : 'primary'
  }

  function getTimeRemainingClass (): string {
    if (props.timeRemaining === undefined) return ''

    if (props.timeRemaining <= 30) {
      return 'text-error font-weight-bold'
    } else if (props.timeRemaining <= 60) {
      return 'text-warning font-weight-medium'
    } else {
      return 'text-success'
    }
  }

  function getProgressColor (): string {
    if (props.timeRemaining === undefined) return 'primary'

    if (props.timeRemaining <= 30) {
      return 'error'
    } else if (props.timeRemaining <= 60) {
      return 'warning'
    } else {
      return 'success'
    }
  }

  function getProgressValue (): number {
    if (props.timeRemaining === undefined || !props.cleaningWindow) return 0

    const totalTime = props.cleaningWindow.duration
    const remaining = props.timeRemaining

    return Math.max(0, Math.min(100, ((totalTime - remaining) / totalTime) * 100))
  }

  // Time formatting functions
  function formatDateTime (dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function formatTime (dateString: string): string {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  function formatTimeRemaining (): string {
    if (props.timeRemaining === undefined) return 'Unknown'

    const hours = Math.floor(props.timeRemaining / 60)
    const minutes = props.timeRemaining % 60

    if (props.timeRemaining <= 0) {
      return 'Overdue!'
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`
    } else {
      return `${minutes}m`
    }
  }

  function getCountdownText (): string {
    if (props.timeRemaining === undefined) return ''

    if (props.timeRemaining <= 0) {
      return 'OVERDUE - Immediate action required'
    } else if (props.timeRemaining <= 30) {
      return 'CRITICAL - Less than 30 minutes remaining'
    } else if (props.timeRemaining <= 60) {
      return 'URGENT - Less than 1 hour remaining'
    } else {
      return `${formatTimeRemaining()} until checkout`
    }
  }
</script>
