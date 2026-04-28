<template>
  <div class="admin-properties">

  <AdminProperties />
  </div>
</template>

<script setup lang="ts">
  import AdminProperties from '@/components/smart/admin/AdminProperties.vue'
defineOptions({
  name: 'AdminProperties',
})
</script>

<style scoped>
.admin-properties {
  height: 100%;
} 
</style>