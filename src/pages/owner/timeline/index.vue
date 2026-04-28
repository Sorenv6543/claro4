<template>
  <div class="property-timeline">
    <OwnerPropertyTimeline />
  </div>
</template>

<script setup lang="ts">

  import OwnerPropertyTimeline from '@/components/smart/owner/OwnerPropertyTimeline.vue'

  defineOptions({
    name: 'OwnerPropertyTimeline',
  })

</script>

<style scoped>
.property-timeline {
  height: 100vh;
}
</style>
