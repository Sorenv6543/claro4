<template>
  <v-snackbar
    v-model="isVisible"
    :class="toastClasses"
    :color="toastColor"
    elevation="8"
    :location="location"
    :timeout="computedTimeout"
    :vertical="isVertical"
    @after-leave="handleAfterLeave"
  >
    <div class="toast-content">
      <!-- Icon Section -->
      <div class="toast-icon-section">
        <v-icon
          :class="iconClasses"
          :icon="toastIcon"
          :size="iconSize"
        />
      </div>

      <!-- Content Section -->
      <div class="toast-message-section">
        <div
          v-if="notification.title"
          class="toast-title"
        >
          {{ notification.title }}
        </div>

        <div class="toast-message">
          {{ notification.message }}
        </div>

        <!-- Progress Indicators -->
        <div
          v-if="notification.showProgress"
          class="toast-progress"
        >
          <v-progress-linear
            :color="progressColor"
            height="2"
            :model-value="progressValue"
            rounded
          />
        </div>

        <!-- Additional Details -->
        <div
          v-if="notification.details"
          class="toast-details"
        >
          <v-expansion-panels
            class="details-panel"
            variant="accordion"
          >
            <v-expansion-panel
              elevation="0"
              title="Show Details"
            >
              <v-expansion-panel-text>
                {{ notification.details }}
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </div>
      </div>

      <!-- Action Section -->
      <div
        v-if="hasActions"
        class="toast-actions"
      >
        <div class="action-buttons">
          <v-btn
            v-for="action in notification.actions"
            :key="action.id"
            class="action-btn"
            :color="action.color || 'white'"
            :loading="action.loading"
            size="small"
            :variant="action.variant || 'text'"
            @click="handleActionClick(action)"
          >
            <v-icon
              v-if="action.icon"
              class="mr-1"
              :icon="action.icon"
              size="small"
            />
            {{ action.label }}
          </v-btn>
        </div>
      </div>

      <!-- Close Button -->
      <v-btn
        v-if="notification.closable !== false"
        class="toast-close-btn"
        icon="mdi-close"
        size="small"
        variant="text"
        @click="closeToast"
      />
    </div>

    <!-- Background Pattern for Urgent Notifications -->
    <div
      v-if="notification.priority === 'critical'"
      class="toast-background-pattern"
    />
  </v-snackbar>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'

  export interface ToastAction {
    id: string
    label: string
    icon?: string
    color?: string
    variant?: 'text' | 'outlined' | 'flat' | 'elevated' | 'tonal' | 'plain'
    loading?: boolean
    action?: () => void | Promise<void>
  }

  export interface ToastNotification {
    id: string
    title?: string
    message: string
    type: 'success' | 'warning' | 'error' | 'info'
    priority?: 'low' | 'normal' | 'high' | 'critical'
    timeout?: number
    persistent?: boolean
    closable?: boolean
    actions?: ToastAction[]
    details?: string
    showProgress?: boolean
    progressValue?: number
    metadata?: Record<string, any>
  }

  interface Props {
    notification: ToastNotification
    location?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  }

  interface Emits {
    (e: 'close' | 'timeout', id: string): void
    (e: 'action-click', action: ToastAction, notification: ToastNotification): void
  }

  const props = withDefaults(defineProps<Props>(), {
    location: 'bottom',
  })

  const emit = defineEmits<Emits>()

  const isVisible = ref(true)
  const progressValue = ref(props.notification.progressValue || 0)

  // Computed properties for styling
  const toastColor = computed(() => {
    const typeColors = {
      success: 'success',
      warning: 'warning',
      error: 'error',
      info: 'info',
    }
    return typeColors[props.notification.type]
  })

  const toastIcon = computed(() => {
    const typeIcons = {
      success: 'mdi-check-circle',
      warning: 'mdi-alert',
      error: 'mdi-alert-circle',
      info: 'mdi-information',
    }
    return typeIcons[props.notification.type]
  })

  const iconSize = computed(() => {
    return props.notification.priority === 'critical' ? 'large' : 'default'
  })

  const iconClasses = computed(() => ({
    'critical-icon': props.notification.priority === 'critical',
    'pulse-icon': props.notification.priority === 'critical',
  }))

  const progressColor = computed(() => {
    return props.notification.type === 'error' ? 'white' : 'primary'
  })

  const computedTimeout = computed(() => {
    if (props.notification.persistent) return -1
    if (props.notification.timeout) return props.notification.timeout

    // Priority-based timeouts
    const priorityTimeouts = {
      low: 3000,
      normal: 5000,
      high: 8000,
      critical: -1, // Persistent for critical
    }

    return priorityTimeouts[props.notification.priority || 'normal']
  })

  const toastClasses = computed(() => ({
    'toast-enhanced': true,
    [`toast-${props.notification.type}`]: true,
    [`toast-priority-${props.notification.priority || 'normal'}`]: true,
    'toast-has-actions': hasActions.value,
    'toast-critical': props.notification.priority === 'critical',
  }))

  const isVertical = computed(() => {
    return hasActions.value && props.notification.actions!.length > 2
  })

  const hasActions = computed(() => {
    return props.notification.actions && props.notification.actions.length > 0
  })

  // Action handlers
  async function handleActionClick (action: ToastAction) {
    try {
      if (action.action) {
        const result = action.action()
        if (result instanceof Promise) {
          action.loading = true
          await result
          action.loading = false
        }
      }
      emit('action-click', action, props.notification)
    } catch (error) {
      action.loading = false
      console.error('Toast action failed:', error)
    }
  }

  function closeToast () {
    isVisible.value = false
  }

  function handleAfterLeave () {
    emit('close', props.notification.id)
  }

  // Auto-update progress value
  watch(
    () => props.notification.progressValue,
    newValue => {
      if (newValue !== undefined) {
        progressValue.value = newValue
      }
    },
  )

  // Critical notification audio alert
  function playAudioAlert () {
    if (props.notification.priority === 'critical') {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1)

      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)

      oscillator.start(audioContext.currentTime)
      oscillator.stop(audioContext.currentTime + 0.2)
    }
  }

  onMounted(() => {
    playAudioAlert()
  })
</script>
