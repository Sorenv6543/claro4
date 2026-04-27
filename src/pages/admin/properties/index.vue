<template>
  <v-skeleton-loader
    v-if="appStatus && !appStatus.isReady.value"
    type="table-tbody"
  />
  <template v-else>
    <AdminProperties />
  </template>
</template>

<script setup lang="ts">
  import { inject } from 'vue'
  import type { Ref } from 'vue'
  import AdminProperties from '@/components/smart/admin/AdminProperties.vue'

  const appStatus = inject<{ isReady: Ref<boolean>, initError: Ref<Error | null> }>('appStatus')
  defineOptions({
    name: 'AdminProperties',
  })
</script>
