<template>
  <PropertySectionCard
    icon="mdi-camera"
    icon-color="info"
    readonly
    title="Photos"
  >
    <div class="text-center py-4">
      <v-icon color="grey" size="48">mdi-camera-plus-outline</v-icon>
      <div class="text-body-2 text-medium-emphasis mt-2">
        Photo management coming soon
      </div>
    </div>
  </PropertySectionCard>
</template>

<script setup lang="ts">
  import PropertySectionCard from '@/components/dumb/owner/PropertySectionCard.vue'
</script>
