<template>
  <v-row>
    <v-col
      v-for="(chart, index) in charts"
      :key="index"
      cols="12"
      :md="chart.colsMd ?? 6"
    >
      <component
        :is="componentMap[chart.type]"
        v-bind="getChartProps(chart) as any"
      >
        <template v-if="$slots[`chart-${index}-actions`]" #header-actions>
          <slot :name="`chart-${index}-actions`" />
        </template>
      </component>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
  import type { ChartData, ChartOptions } from 'chart.js'
  import OwnerBarChart from './OwnerBarChart.vue'
  import OwnerLineChart from './OwnerLineChart.vue'
  import OwnerPolarAreaChart from './OwnerPolarAreaChart.vue'
  import OwnerRadarChart from './OwnerRadarChart.vue'
  import OwnerScatterChart from './OwnerScatterChart.vue'

  export type ChartType = 'line' | 'bar' | 'radar' | 'polarArea' | 'scatter'

  type AnyChartData
    = | ChartData<'line'>
      | ChartData<'bar'>
      | ChartData<'radar'>
      | ChartData<'polarArea'>
      | ChartData<'scatter'>

  type AnyChartOptions
    = | ChartOptions<'line'>
      | ChartOptions<'bar'>
      | ChartOptions<'radar'>
      | ChartOptions<'polarArea'>
      | ChartOptions<'scatter'>

  export interface ChartItem {
    type: ChartType
    title: string
    data: AnyChartData
    options?: AnyChartOptions
    /** Column span on md+ breakpoint. Defaults to 6 (half width). Use 12 for full width. */
    colsMd?: number
    height?: number
    /** Only applies when type is 'bar'. */
    horizontal?: boolean
  }

  defineProps<{
    charts: ChartItem[]
  }>()

  const componentMap = {
    line: OwnerLineChart,
    bar: OwnerBarChart,
    radar: OwnerRadarChart,
    polarArea: OwnerPolarAreaChart,
    scatter: OwnerScatterChart,
  } as const

  interface BaseChartProps {
    title: string
    data: AnyChartData
    options?: AnyChartOptions
    height?: number
  }

  interface BarChartProps extends BaseChartProps {
    horizontal?: boolean
  }

  function getChartProps (chart: ChartItem): BaseChartProps | BarChartProps {
    const props: BaseChartProps | BarChartProps = {
      title: chart.title,
      data: chart.data,
      options: chart.options,
      height: chart.height,
    }
    if (chart.type === 'bar' && chart.horizontal) {
      (props as BarChartProps).horizontal = true
    }
    return props
  }
</script>
