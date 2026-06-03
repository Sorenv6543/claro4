<template>
  <div class="admin-users-page">
    <AdminUsers />
  </div>
</template>

<script setup lang="ts">
  import AdminUsers from '@/components/smart/admin/AdminUsers.vue'

  // Meta information for this page
  defineOptions({
    name: 'AdminUsersPage',
  })
</script>
