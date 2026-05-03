<template>
  <v-card class="weekly-card" :elevation="0" rounded="sm">
    <h3 class="weekly-card__title">Weekly Overview</h3>

    <div class="weekly-card__chart">
      <div
        v-for="(bar, i) in bars"
        :key="i"
        class="weekly-card__bar"
        :style="{ height: bar.height + 'px', backgroundColor: bar.color }"
      />
    </div>

    <div class="weekly-card__perf">
      <span class="weekly-card__pct">45%</span>
      <span class="weekly-card__desc">Your sales performance is 45% 😎 better compared to last month</span>
    </div>

    <v-btn block color="primary" rounded="pill">Details</v-btn>
  </v-card>
</template>

<script setup lang="ts">
  defineOptions({ name: 'DashboardWeeklyOverview' })

  const bars = [
    { height: 50, color: 'var(--claro-surface-variant)' },
    { height: 80, color: 'var(--claro-surface-variant)' },
    { height: 60, color: 'var(--claro-surface-variant)' },
    { height: 110, color: 'var(--claro-primary)' },
    { height: 75, color: 'var(--claro-surface-variant)' },
    { height: 55, color: 'var(--claro-surface-variant)' },
    { height: 90, color: 'var(--claro-surface-variant)' },
  ]
</script>

<style scoped>
.weekly-card {
  width: 400px;
  flex-shrink: 0;
  padding: var(--claro-space-lg);
  box-shadow: var(--claro-shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--claro-space-md);
}

.weekly-card__title {
  font-size: 18px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
  margin: 0;
}

.weekly-card__chart {
  display: flex;
  align-items: flex-end;
  gap: 12px;
  height: 140px;
  padding: 16px 8px;
}

.weekly-card__bar {
  flex: 1;
  border-radius: 2px;
  min-width: 0;
}

.weekly-card__perf {
  display: flex;
  align-items: center;
  gap: 12px;
}

.weekly-card__pct {
  flex-shrink: 0;
  font-size: 24px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
}

.weekly-card__desc {
  font-size: 13px;
  color: var(--claro-fg3);
  line-height: 1.4;
}

@media (max-width: 959px) {
  .weekly-card {
    width: 100%;
  }
}
</style>
