<template>
  <div aria-label="Calendar navigation" class="calendar-nav-pill" role="toolbar">
    <v-btn
      aria-label="Previous period"
      class="calendar-nav-pill__btn"
      density="comfortable"
      icon="mdi-chevron-left"
      size="small"
      variant="text"
      @click="emit('prev')"
    />

    <span class="calendar-nav-pill__label">{{ label }}</span>

    <v-btn
      aria-label="Next period"
      class="calendar-nav-pill__btn"
      density="comfortable"
      icon="mdi-chevron-right"
      size="small"
      variant="text"
      @click="emit('next')"
    />
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'CalendarNavPill' })

  defineProps<{
    label: string
  }>()

  const emit = defineEmits<{
    prev: []
    next: []
  }>()
</script>
