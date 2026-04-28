<template>
  <div class="admin-cleaners">
  <AdminCleaners />
  </div>
</template>

<script setup lang="ts">
  import AdminCleaners from '@/components/smart/admin/AdminCleaners.vue'
defineOptions({
  name: 'AdminCleaners',
})    
</script>
<style scoped>  
.admin-cleaners {
  height: 100%;
} 
</style>
