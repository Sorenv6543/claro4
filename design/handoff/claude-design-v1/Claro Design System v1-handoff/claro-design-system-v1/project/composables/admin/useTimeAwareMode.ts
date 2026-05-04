import { computed, getCurrentScope, onScopeDispose, ref } from 'vue'

const EVENING_THRESHOLD_HOUR = 16

interface TimeAwareModeOptions {
  thresholdHour?: number
}

export function useTimeAwareMode (options: TimeAwareModeOptions = {}) {
  const thresholdHour = options.thresholdHour ?? EVENING_THRESHOLD_HOUR
  const now = ref(new Date())

  // Update every minute — only start interval if there's an active scope to clean it up
  if (getCurrentScope()) {
    const interval = setInterval(() => {
      now.value = new Date()
    }, 60_000)
    onScopeDispose(() => clearInterval(interval))
  }

  const isEveningMode = computed(() => now.value.getHours() >= thresholdHour)

  const modeLabel = computed(() =>
    isEveningMode.value ? 'Tomorrow\'s Prep' : 'Today\'s Schedule',
  )

  const todayDateString = computed(() => {
    const d = now.value
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  })

  const tomorrowDateString = computed(() => {
    const tomorrow = new Date(now.value)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`
  })

  return {
    isEveningMode,
    modeLabel,
    todayDateString,
    tomorrowDateString,
    now,
  }
}
