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

<style scoped>
.calendar-nav-pill {
  position: fixed;
  left: 50%;
  bottom: calc(var(--claro-space-md) + env(safe-area-inset-bottom));
  transform: translateX(-50%);
  z-index: 4;

  display: inline-flex;
  align-items: center;
  gap: var(--claro-space-sm);
  padding: var(--claro-space-xs) var(--claro-space-sm);
  border-radius: var(--claro-radius-pill);

  background: rgba(var(--v-theme-background), 0.72);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: var(--claro-shadow-md);
}

.calendar-nav-pill__btn {
  box-shadow: none !important;
}

.calendar-nav-pill__label {
  font-size: 14px;
  font-weight: var(--claro-font-weight-semibold);
  color: rgb(var(--v-theme-on-surface));
  min-width: 110px;
  text-align: center;
  user-select: none;
}
</style>
