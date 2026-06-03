<template>
  <div class="admin-bookings">
    <AdminBookings />
  </div>
</template>

<script setup lang="ts">
  import AdminBookings from '@/components/smart/admin/AdminBookings.vue'
  defineOptions({
    name: 'AdminBookings',
  })
</script>
