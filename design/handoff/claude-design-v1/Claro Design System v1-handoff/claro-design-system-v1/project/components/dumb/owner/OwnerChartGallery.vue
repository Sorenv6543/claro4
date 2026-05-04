<template>
  <v-row>
    <v-col
      v-for="(chart, index) in charts"
      :key="index"
      cols="12"
      :md="chart.colsMd ?? 6"
    >
      <OwnerChart
        :type="chart.type"
        :title="chart.title"
        :data="chart.data"
        :options="chart.options"
        :height="chart.height"
        :horizontal="chart.horizontal"
      >
        <template v-if="$slots[`chart-${index}-actions`]" #header-actions>
          <slot :name="`chart-${index}-actions`" />
        </template>
      </OwnerChart>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
  import type { ChartData, ChartOptions } from 'chart.js'
  import type { ChartType } from './OwnerChart.vue'
  import OwnerChart from './OwnerChart.vue'

  export interface ChartItem {
    type: ChartType
    title: string
    data: ChartData<any>
    options?: ChartOptions<any>
    /** Column span on md+ breakpoint. Defaults to 6 (half width). Use 12 for full width. */
    colsMd?: number
    height?: number
    /** Only applies when type is 'bar'. */
    horizontal?: boolean
  }

  defineProps<{
    charts: ChartItem[]
  }>()
</script>
