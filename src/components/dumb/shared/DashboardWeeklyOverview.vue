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
