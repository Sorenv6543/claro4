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

<style scoped>
.mini-card {
  flex: 1;
  min-width: 0;
  padding: 20px;
  box-shadow: var(--claro-shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Bar variant */
.mini-card__value {
  font-size: 22px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
}

.mini-card__bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 40px;
}

.mini-card__bar {
  flex: 1;
  border-radius: 2px;
  min-width: 0;
}

.mini-card__label {
  font-size: 14px;
  font-weight: var(--claro-font-weight-medium);
  color: var(--claro-fg3);
  text-align: center;
}

/* Icon variant */
.mini-card__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.mini-card__icon-circle {
  width: 40px;
  height: 40px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mini-card__more {
  font-size: 18px;
  color: var(--claro-fg3);
  cursor: pointer;
  letter-spacing: 1px;
}

.mini-card__title {
  font-size: 14px;
  font-weight: var(--claro-font-weight-medium);
  color: var(--claro-fg1);
}

.mini-card__stats-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.mini-card__stat-value {
  font-size: 20px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
}

.mini-card__change {
  font-size: 13px;
}

.mini-card__subtitle {
  font-size: 12px;
  color: var(--claro-fg3);
}
</style>
