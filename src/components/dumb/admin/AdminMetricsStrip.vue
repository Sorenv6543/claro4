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
    props.unassignedCount > 0 ? `${props.unassignedCount} unassigned` : 'All assigned',
  )
  const unassignedIcon = computed(() =>
    props.unassignedCount > 0 ? 'mdi-alert-circle-outline' : 'mdi-check-circle-outline',
  )
</script>

<template>
  <v-row align="center" class="metrics-strip mb-4" density="compact">
    <v-col class="d-flex flex-wrap ga-2" cols="auto">
      <v-chip color="info" prepend-icon="mdi-clipboard-text-outline" size="small" variant="tonal">
        {{ totalCleanings }} cleanings {{ label || 'today' }}
      </v-chip>

      <v-chip :color="unassignedColor" :prepend-icon="unassignedIcon" size="small" variant="tonal">
        {{ unassignedText }}
      </v-chip>

      <v-chip color="warning" prepend-icon="mdi-swap-horizontal" size="small" variant="tonal">
        {{ turnCount }} turns
      </v-chip>

      <v-chip color="success" prepend-icon="mdi-account-group-outline" size="small" variant="tonal">
        {{ activeCleaners }} cleaners active
      </v-chip>
    </v-col>
  </v-row>
</template>
