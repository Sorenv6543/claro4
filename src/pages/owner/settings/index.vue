<template>
  <div class="owner-settings">
    <OwnerSettings />
  </div>
</template>

    <script setup lang="ts">
  import OwnerSettings from '@/components/smart/owner/OwnerSettings.vue'
  defineOptions({
    name: 'OwnerSettings',
  })

    </script>

<style scoped>
.owner-settings {
  height: 100%;
}
</style>
