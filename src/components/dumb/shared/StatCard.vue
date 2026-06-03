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
