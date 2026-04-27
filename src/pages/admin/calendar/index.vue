<template>
  <v-skeleton-loader
    v-if="appStatus && !appStatus.isReady.value"
    type="list-item-three-line@5"
  />
  <template v-else>
    <AdminCalendar />
  </template>
</template>

<script setup lang="ts">
  import { inject } from 'vue'
  import type { Ref } from 'vue'
  import AdminCalendar from '@/components/smart/admin/AdminCalendar.vue'

  const appStatus = inject<{ isReady: Ref<boolean>, initError: Ref<Error | null> }>('appStatus')
  defineOptions({
    name: 'AdminCalendar',
  })
</script>

<style scoped>
.admin-calendar-page {
  height: 100vh;
  width: 100%;
}
</style>
