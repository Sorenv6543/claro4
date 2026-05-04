<template>
  <div class="owner-dashboard">
    <HomeOwner />
  </div>
</template>

<script setup lang="ts">
  import HomeOwner from '@/components/smart/owner/HomeOwner.vue'

  defineOptions({
    name: 'OwnerDashboard',
  })
</script>

<style scoped>
.owner-dashboard {
  height: 100%;
}
</style>
