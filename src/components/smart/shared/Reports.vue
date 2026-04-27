<template>
    <v-container fluid>
        <OwnerChartGallery :charts="charts" />
    </v-container>
</template>

<script setup lang="ts">
import type { ChartItem } from '@/components/dumb/owner/OwnerChartGallery.vue'
import OwnerChartGallery from '@/components/dumb/owner/OwnerChartGallery.vue'

const CHART_COLORS = { primary: '#1976D2', warning: '#FB8C00', info: '#00ACC1', success: '#43A047', error: '#E53935' }
const withAlpha = (color: string, alpha: number) => color.replace(')', `, ${alpha})`)

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const charts: ChartItem[] = [
    {
        type: 'line',
        title: 'Booking Trends',
        colsMd: 12,
        height: 350,
        data: {
            labels: months,
            datasets: [
                {
                    label: 'This Year',
                    data: [28, 35, 42, 38, 52, 61, 58, 65, 48, 42, 35, 30],
                    borderColor: CHART_COLORS.primary,
                    backgroundColor: withAlpha(CHART_COLORS.primary, 0.1),
                    fill: true,
                },
                {
                    label: 'Last Year',
                    data: [22, 28, 35, 30, 45, 52, 50, 55, 40, 35, 28, 24],
                    borderColor: CHART_COLORS.warning,
                    backgroundColor: 'transparent',
                },
                {
                    label: 'Forecast',
                    data: [null, null, null, null, null, null, null, null, null, 45, 38, 32],
                    borderColor: CHART_COLORS.info,
                    borderDash: [5, 5],
                    backgroundColor: 'transparent',
                },
            ],
        },
    },
    {
        type: 'radar',
        title: 'Property Comparison',
        height: 300,
        data: {
            labels: ['Occupancy', 'Revenue', 'Reviews', 'Turnovers', 'Bookings', 'Repeat Guests'],
            datasets: [
                {
                    label: 'Beach House',
                    data: [85, 90, 78, 65, 80, 72],
                    borderColor: CHART_COLORS.primary,
                    backgroundColor: withAlpha(CHART_COLORS.primary, 0.15),
                },
                {
                    label: 'Mountain Cabin',
                    data: [70, 65, 90, 80, 55, 85],
                    borderColor: CHART_COLORS.error,
                    backgroundColor: withAlpha(CHART_COLORS.error, 0.15),
                },
            ],
        },
    },
    {
        type: 'polarArea',
        title: 'Revenue by Type',
        height: 300,
        data: {
            labels: ['Standard', 'Turn', 'Long-term', 'Weekend', 'Holiday'],
            datasets: [
                {
                    data: [42, 18, 25, 10, 5],
                    backgroundColor: [
                        withAlpha(CHART_COLORS.primary, 0.7),
                        withAlpha(CHART_COLORS.warning, 0.7),
                        withAlpha(CHART_COLORS.success, 0.7),
                        withAlpha(CHART_COLORS.info, 0.7),
                        withAlpha(CHART_COLORS.error, 0.7),
                    ],
                },
            ],
        },
    },
    {
        type: 'scatter',
        title: 'Occupancy vs Revenue',
        colsMd: 12,
        height: 300,
        data: {
            datasets: [
                {
                    label: 'Beach House',
                    data: [
                        { x: 72, y: 3200 }, { x: 85, y: 4100 }, { x: 90, y: 4500 },
                        { x: 60, y: 2800 }, { x: 78, y: 3600 }, { x: 95, y: 4800 },
                    ],
                    backgroundColor: CHART_COLORS.primary,
                },
                {
                    label: 'Mountain Cabin',
                    data: [
                        { x: 55, y: 2200 }, { x: 68, y: 2900 }, { x: 75, y: 3100 },
                        { x: 45, y: 1800 }, { x: 62, y: 2600 }, { x: 80, y: 3400 },
                    ],
                    backgroundColor: CHART_COLORS.info,
                },
                {
                    label: 'City Apartment',
                    data: [
                        { x: 80, y: 2600 }, { x: 88, y: 3000 }, { x: 70, y: 2200 },
                        { x: 92, y: 3200 }, { x: 65, y: 2000 }, { x: 82, y: 2800 },
                    ],
                    backgroundColor: CHART_COLORS.success,
                },
            ],
        },
    },
    {
        type: 'line',
        title: 'Monthly Revenue',
        colsMd: 12,
        height: 300,
        data: {
            labels: months,
            datasets: [
                {
                    label: 'Revenue',
                    data: [4200, 5100, 6800, 5900, 8200, 9500, 9100, 10_200, 7600, 6400, 5200, 4800],
                    borderColor: CHART_COLORS.info,
                    backgroundColor: withAlpha(CHART_COLORS.info, 0.15),
                    fill: true,
                },
                {
                    label: 'Expenses',
                    data: [1800, 2100, 2400, 2200, 2800, 3100, 3000, 3200, 2600, 2300, 2000, 1900],
                    borderColor: CHART_COLORS.success,
                    backgroundColor: withAlpha(CHART_COLORS.success, 0.15),
                    fill: true,
                },
            ],
        },
    },
    {
        type: 'bar',
        title: 'Bookings by Month',
        height: 300,
        data: {
            labels: ['Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
            datasets: [
                {
                    label: 'Confirmed',
                    data: [18, 22, 15, 12, 10, 14],
                    backgroundColor: CHART_COLORS.warning,
                },
                {
                    label: 'Completed',
                    data: [16, 20, 14, 10, 8, 6],
                    backgroundColor: withAlpha(CHART_COLORS.warning, 0.4),
                },
            ],
        },
    },
    {
        type: 'bar',
        title: 'Property Performance',
        horizontal: true,
        height: 300,
        data: {
            labels: ['Beach House', 'Mountain Cabin', 'City Apartment', 'Lake Cottage', 'Ski Chalet'],
            datasets: [
                {
                    label: 'Occupancy %',
                    data: [88, 72, 91, 65, 58],
                    backgroundColor: CHART_COLORS.info,
                },
                {
                    label: 'Target %',
                    data: [80, 75, 85, 70, 70],
                    backgroundColor: withAlpha(CHART_COLORS.info, 0.3),
                },
            ],
        },
    },
]
</script>
