<template>
  <v-card class="mini-card" :elevation="0" rounded="sm">
    <!-- Bar-chart variant (Profit / Sessions) -->
    <template v-if="variant === 'bars'">
      <span class="mini-card__value">{{ value }}</span>

      <div class="mini-card__bars">
        <div
          v-for="(bar, i) in bars"
          :key="i"
          class="mini-card__bar"
          :style="{ height: bar.height + 'px', backgroundColor: bar.color }"
        />
      </div>

      <span class="mini-card__label">{{ title }}</span>
    </template>

    <!-- Icon-stat variant (Total Profit / New Project) -->
    <template v-else>
      <div class="mini-card__top">
        <div
          class="mini-card__icon-circle"
          :style="{ backgroundColor: iconBg }"
        >
          <v-icon
            color="white"
            :icon="icon"
            size="20"
          />
        </div>

        <span class="mini-card__more">···</span>
      </div>

      <span class="mini-card__title">{{ title }}</span>

      <div class="mini-card__stats-row">
        <span class="mini-card__stat-value">{{ value }}</span>

        <span
          v-if="change"
          class="mini-card__change"
          :style="{ color: changeType === 'up' ? 'var(--claro-success)' : changeType === 'down' ? 'var(--claro-error)' : 'inherit' }"
        >{{ change }}</span>
      </div>

      <span
        v-if="subtitle"
        class="mini-card__subtitle"
      >{{ subtitle }}</span>
    </template>
  </v-card>
</template>

<script setup lang="ts">
  defineOptions({ name: 'DashboardStatMiniCard' })

  export interface BarData {
    height: number
    color: string
  }

  type BarsVariantProps = {
    variant: 'bars'
    bars: BarData[]
    title: string
    value: string
    icon?: never
    iconBg?: never
    change?: never
    changeType?: never
    subtitle?: never
  }

  type IconVariantProps = {
    variant?: 'icon'
    title: string
    value: string
    icon: string
    iconBg: string
    change?: string
    changeType?: 'up' | 'down'
    subtitle?: string
    bars?: never
  }

  defineProps<BarsVariantProps | IconVariantProps>()
</script>
