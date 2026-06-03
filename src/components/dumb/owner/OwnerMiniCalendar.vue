<template>
  <DashboardCard icon="mdi-calendar-month" :title="monthLabel">
    <!-- Day-of-week headers -->
    <div class="calendar-grid mb-1">
      <div
        v-for="dayName in dayNames"
        :key="dayName"
        class="day-header text-caption text-medium-emphasis text-center font-weight-medium"
      >
        {{ dayName }}
      </div>
    </div>

    <!-- Day cells -->
    <div class="calendar-grid">
      <!-- Leading empty cells -->
      <div v-for="n in startOffset" :key="'empty-' + n" class="day-cell" />

      <!-- Actual days -->
      <div
        v-for="day in daysInMonth"
        :key="day"
        class="day-cell d-flex flex-column align-center justify-center"
        :class="{ 'today-cell': isToday(day) }"
      >
        <span class="text-body-2" :class="{ 'font-weight-bold': isToday(day) }">
          {{ day }}
        </span>
        <!-- Booking dots -->
        <div class="dot-row d-flex ga-1 mt-0">
          <div
            v-for="(dot, dotIndex) in getDayDots(day)"
            :key="dotIndex"
            class="booking-dot"
            :style="{ background: dot.color }"
          />
        </div>
      </div>
    </div>
  </DashboardCard>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import DashboardCard from '@/components/dumb/shared/DashboardCard.vue'

  interface BookingDate {
    date: string
    color: string
    type: string
  }

  const props = defineProps<{
    currentMonth: Date
    bookingDates: BookingDate[]
  }>()

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const monthLabel = computed(() => {
    return props.currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  })

  const daysInMonth = computed(() => {
    const year = props.currentMonth.getFullYear()
    const month = props.currentMonth.getMonth()
    return new Date(year, month + 1, 0).getDate()
  })

  const startOffset = computed(() => {
    const year = props.currentMonth.getFullYear()
    const month = props.currentMonth.getMonth()
    return new Date(year, month, 1).getDay()
  })

  function isToday (day: number): boolean {
    const now = new Date()
    return (
      day === now.getDate()
      && props.currentMonth.getMonth() === now.getMonth()
      && props.currentMonth.getFullYear() === now.getFullYear()
    )
  }

  function getDayDots (day: number): Array<{ color: string }> {
    const year = props.currentMonth.getFullYear()
    const month = String(props.currentMonth.getMonth() + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    const dateKey = `${year}-${month}-${dayStr}`

    // Deduplicate by color to avoid showing multiple dots for the same property
    const seen = new Set<string>()
    const dots: Array<{ color: string }> = []
    for (const bd of props.bookingDates) {
      if (bd.date === dateKey && !seen.has(bd.color)) {
        seen.add(bd.color)
        dots.push({ color: bd.color })
        if (dots.length >= 3) break // Max 3 dots per day
      }
    }
    return dots
  }
</script>
