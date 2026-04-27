<template>
  <v-skeleton-loader
    v-if="appStatus && !appStatus.isReady.value"
    type="list-item-three-line@5"
  />
  <template v-else>
    <OwnerCalendar :bookings="[]" :properties="[]" />
  </template>
</template>

<script setup lang="ts">
  import { inject } from 'vue'
  import type { Ref } from 'vue'
  import OwnerCalendar from '@/components/smart/owner/OwnerCalendar.vue'

  const appStatus = inject<{ isReady: Ref<boolean>, initError: Ref<Error | null> }>('appStatus')
  defineOptions({ name: 'OwnerCalendar' })
</script>
