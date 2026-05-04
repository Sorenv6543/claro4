<template>
  <v-card class="booking-stats-card">
    <div class="booking-stats-card__header">
      <v-avatar
        :color="iconColor"
        rounded
        size="40"
      >
        <v-icon color="white" :icon="icon" size="20" />
      </v-avatar>
      <v-btn
        density="compact"
        icon="mdi-dots-vertical"
        size="small"
        variant="text"
        @click="$emit('click:more')"
      />
    </div>

    <span class="booking-stats-card__title">{{ title }}</span>

    <div class="booking-stats-card__stats">
      <span class="booking-stats-card__value">{{ value }}</span>
      <span
        v-if="trendValue"
        class="booking-stats-card__trend"
        :class="`booking-stats-card__trend--${trend}`"
      >
        {{ trendValue }}
      </span>
    </div>

    <span v-if="subtitle" class="booking-stats-card__subtitle">
      {{ subtitle }}
    </span>
  </v-card>
</template>

<script setup lang="ts">
  defineProps<{
    title: string
    value: string | number
    icon: string
    iconColor?: string
    trend?: 'up' | 'down'
    trendValue?: string
    subtitle?: string
  }>()

  defineEmits<{
    'click:more': []
  }>()
</script>

<style scoped>
.booking-stats-card {
  display: flex;
  flex-direction: column;
  padding: var(--claro-card-padding);
  gap: var(--claro-space-sm);
}

.booking-stats-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.booking-stats-card__title {
  font-size: 0.875rem;
  font-weight: var(--claro-font-weight-medium);
  color: rgb(var(--v-theme-on-surface));
}

.booking-stats-card__stats {
  display: flex;
  align-items: center;
  gap: var(--claro-space-xs);
}

.booking-stats-card__value {
  font-size: 1.25rem;
  font-weight: var(--claro-font-weight-semibold);
  color: rgb(var(--v-theme-on-surface));
}

.booking-stats-card__trend {
  font-size: 0.8125rem;
}

.booking-stats-card__trend--up {
  color: rgb(var(--v-theme-success));
}

.booking-stats-card__trend--down {
  color: rgb(var(--v-theme-error));
}

.booking-stats-card__subtitle {
  font-size: 0.75rem;
  color: var(--claro-text-secondary);
}
</style>
