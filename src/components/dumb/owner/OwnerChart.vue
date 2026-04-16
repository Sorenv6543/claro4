<template>
  <v-card>
    <v-card-title class="owner-chart__title">
      <span>{{ title }}</span>
      <v-spacer />
      <slot name="header-actions" />
    </v-card-title>
    <v-card-text class="owner-chart__body">
      <div :style="{ height: `${height}px` }">
        <component :is="chartComponent" :data="data" :options="mergedOptions" />
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
  import type { ChartData, ChartOptions } from 'chart.js'
  import { computed } from 'vue'
  import { Bar, Line, PolarArea, Radar, Scatter } from 'vue-chartjs'
  import { CHART_GRID_COLOR } from '@/plugins/chartjs'

  export type ChartType = 'line' | 'bar' | 'radar' | 'polarArea' | 'scatter'

  interface Props {
    type: ChartType
    title: string
    data: ChartData<any>
    options?: ChartOptions<any>
    height?: number
    horizontal?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    options: undefined,
    height: 300,
    horizontal: false,
  })

  const chartComponent = computed(() => ({
    line: Line,
    bar: Bar,
    radar: Radar,
    polarArea: PolarArea,
    scatter: Scatter,
  }[props.type]))

  const defaultsByType: Record<ChartType, () => ChartOptions<any>> = {
    line: () => ({
      elements: {
        line: { tension: 0.4 },
        point: { radius: 3, hoverRadius: 5 },
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { grid: { color: CHART_GRID_COLOR }, border: { display: false } },
      },
    }),
    bar: () => ({
      indexAxis: props.horizontal ? 'y' as const : 'x' as const,
      elements: {
        bar: { borderRadius: 4 },
      },
      scales: {
        x: { grid: { display: false }, border: { display: false } },
        y: { grid: { color: CHART_GRID_COLOR }, border: { display: false } },
      },
    }),
    radar: () => ({
      scales: {
        r: {
          angleLines: { color: CHART_GRID_COLOR },
          grid: { color: CHART_GRID_COLOR },
          pointLabels: { font: { size: 12 } },
          ticks: { display: false },
        },
      },
    }),
    polarArea: () => ({
      scales: {
        r: {
          grid: { color: CHART_GRID_COLOR },
          ticks: { display: false },
        },
      },
    }),
    scatter: () => ({
      elements: {
        point: { radius: 5, hoverRadius: 7 },
      },
      scales: {
        x: { grid: { color: CHART_GRID_COLOR }, border: { display: false } },
        y: { grid: { color: CHART_GRID_COLOR }, border: { display: false } },
      },
    }),
  }

  const mergedOptions = computed<ChartOptions<any>>(() => ({
    ...defaultsByType[props.type](),
    ...props.options,
  }))
</script>

<style scoped>
.owner-chart__title {
  display: flex;
  align-items: center;
  font-size: 1rem;
  font-weight: var(--claro-font-weight-semibold);
}

.owner-chart__body {
  padding-top: 0 !important;
}
</style>
