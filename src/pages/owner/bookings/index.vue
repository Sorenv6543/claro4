<template>
  <v-skeleton-loader
    v-if="appStatus && !appStatus.isReady.value"
    type="table-tbody"
  />
  <template v-else>
    <OwnerBookings />
  </template>
</template>

<script setup lang="ts">
  import { inject } from 'vue'
  import type { Ref } from 'vue'
  import OwnerBookings from '@/components/smart/owner/OwnerBookings.vue'

  const appStatus = inject<{ isReady: Ref<boolean>, initError: Ref<Error | null> }>('appStatus')
  defineOptions({ name: 'OwnerBookings' })
</script>
