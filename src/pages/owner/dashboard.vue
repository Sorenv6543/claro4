<template>
  <div class="owner-dashboard">
    <HomeOwner />
  </div>
</template>

<script setup lang="ts">
  import HomeOwner from '@/components/smart/owner/HomeOwner.vue'

  // Meta information for this page
  // link a mermaid diagram to this file
  // https://mermaid.live/edit/#pako:
  defineOptions({
    name: 'OwnerDashboard',
  })
</script>
<style scoped>
.owner-dashboard {
  height: 100%;
}
</style>
