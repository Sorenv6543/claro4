<template>
  <v-card class="stat-card" :elevation="0">
    <div class="stat-card__body">
      <div class="stat-card__info">
        <span class="stat-card__value">{{ value }}</span>
        <span class="stat-card__label">{{ label }}</span>

        <span
          v-if="trend && trendValue"
          class="stat-card__trend"
          :class="`stat-card__trend--${trend}`"
        >
          <v-icon
            :icon="trendIcon"
            size="14"
          />
          {{ trendValue }}
        </span>
      </div>

      <div
        class="stat-card__icon-circle"
        :style="iconCircleStyle"
      >
        <v-icon
          :color="color"
          :icon="icon"
          size="24"
        />
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{
    value: string | number
    label: string
    icon: string
    trend?: 'up' | 'down' | 'flat'
    trendValue?: string
    color?: string
  }>()

  const trendIcon = computed(() => {
    if (props.trend === 'up') return 'mdi-trending-up'
    if (props.trend === 'down') return 'mdi-trending-down'
    return 'mdi-trending-neutral'
  })

  const iconCircleStyle = computed(() => ({
    backgroundColor: `rgba(var(--v-theme-${props.color ?? 'primary'}), 0.12)`,
  }))
</script>

<style scoped>
.stat-card {
  padding: var(--claro-space-lg, 24px);
}

.stat-card__body {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: var(--claro-space-md, 20px);
}

.stat-card__info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.stat-card__value {
  font-size: 1.75rem;
  font-weight: var(--claro-font-weight-semibold, 600);
  line-height: 1;
  color: rgb(var(--v-theme-on-surface));
}

.stat-card__label {
  font-size: 0.85rem;
  opacity: 0.7;
  color: rgb(var(--v-theme-on-surface));
  line-height: 1.3;
}

.stat-card__trend {
  display: inline-flex;
  flex-direction: row;
  align-items: center;
  gap: var(--claro-space-xs, 4px);
  font-size: 0.8rem;
  font-weight: 500;
  margin-top: 2px;
}

.stat-card__trend--up {
  color: var(--claro-success, rgb(var(--v-theme-success)));
}

.stat-card__trend--down {
  color: var(--claro-error, rgb(var(--v-theme-error)));
}

.stat-card__trend--flat {
  color: rgb(var(--v-theme-on-surface));
  opacity: 0.5;
}

.stat-card__icon-circle {
  flex-shrink: 0;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
