<template>
  <div class="owner-overview">
    <OwnerOverview />
  </div>
</template>

<script setup lang="ts">
  import OwnerOverview from '@/components/smart/owner/OwnerOverview.vue'

  defineOptions({
    name: 'OwnerOverviewPage',
  })
</script>

<style scoped>
.owner-overview {
  height: 100vh;
}
</style>
