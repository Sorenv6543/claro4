<template>
  <div class="owner-profile">
    <OwnerDetailCard />
  </div>
</template>

<script setup lang="ts">
  import OwnerDetailCard from '@/components/dumb/owner/OwnerDetailCard.vue'

  defineOptions({
    name: 'OwnerProfile',
  })
</script>

<style scoped>
.owner-profile {
    height: 100vh;
}
</style>
