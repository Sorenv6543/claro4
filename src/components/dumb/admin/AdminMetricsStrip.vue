<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  totalCleanings: number
  unassignedCount: number
  turnCount: number
  activeCleaners: number
  label?: string
}>()

const unassignedColor = computed(() => props.unassignedCount > 0 ? 'error' : 'success')
const unassignedText = computed(() =>
  props.unassignedCount > 0 ? `${props.unassignedCount} unassigned` : 'All assigned'
)
const unassignedIcon = computed(() =>
  props.unassignedCount > 0 ? 'mdi-alert-circle-outline' : 'mdi-check-circle-outline'
)
</script>

<template>
  <v-row class="metrics-strip mb-4" no-gutters align="center">
    <v-col cols="auto" class="d-flex flex-wrap ga-2">
      <v-chip variant="tonal" color="info" size="small" prepend-icon="mdi-clipboard-text-outline">
        {{ totalCleanings }} cleanings {{ label || 'today' }}
      </v-chip>
      <v-chip variant="tonal" :color="unassignedColor" size="small" :prepend-icon="unassignedIcon">
        {{ unassignedText }}
      </v-chip>
      <v-chip variant="tonal" color="warning" size="small" prepend-icon="mdi-swap-horizontal">
        {{ turnCount }} turns
      </v-chip>
      <v-chip variant="tonal" color="success" size="small" prepend-icon="mdi-account-group-outline">
        {{ activeCleaners }} cleaners active
      </v-chip>
    </v-col>
  </v-row>
</template>
