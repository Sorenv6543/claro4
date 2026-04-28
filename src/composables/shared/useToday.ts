import { computed, onUnmounted, ref } from 'vue'

function toDateStr (d: Date): string {
  return d.toISOString().split('T')[0]
}

function addDays (d: Date, n: number): Date {
  const r = new Date(d)
  r.setDate(r.getDate() + n)
  return r
}

export function useToday () {
  const now = ref(new Date())

  const timer = setInterval(() => {
    const next = new Date()
    if (next.toDateString() !== now.value.toDateString()) {
      now.value = next
    }
  }, 60_000)

  onUnmounted(() => clearInterval(timer))

  const todayStr = computed(() => toDateStr(now.value))
  const weekAhead = computed(() => toDateStr(addDays(now.value, 7)))
  const fortAhead = computed(() => toDateStr(addDays(now.value, 14)))
  const todayLabel = computed(() =>
    now.value.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
  )

  return { todayStr, weekAhead, fortAhead, todayLabel }
}
