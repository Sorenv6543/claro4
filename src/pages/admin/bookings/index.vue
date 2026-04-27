<template>
  <v-skeleton-loader
    v-if="appStatus && !appStatus.isReady.value"
    type="table-tbody"
  />
  <template v-else>
    <AdminBookings />
  </template>
</template>

<script setup lang="ts">
  import { inject } from 'vue'
  import type { Ref } from 'vue'
  import AdminBookings from '@/components/smart/admin/AdminBookings.vue'

  const appStatus = inject<{ isReady: Ref<boolean>, initError: Ref<Error | null> }>('appStatus')
  defineOptions({ name: 'AdminBookings' })
</script>
