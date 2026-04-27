<template>
  <div class="properties-page">
    <!-- ✅ Thin wrapper - delegates to smart component -->
    <!-- ✅ Maintains single source of truth through shared composables -->
    <v-skeleton-loader
      v-if="appStatus && !appStatus.isReady.value"
      type="table-tbody"
    />
    <template v-else>
      <OwnerProperties />
    </template>
  </div>
</template>

<script setup lang="ts">
  import { inject } from 'vue'
  import type { Ref } from 'vue'
  import OwnerProperties from '@/components/smart/owner/OwnerProperties.vue'

  const appStatus = inject<{ isReady: Ref<boolean>, initError: Ref<Error | null> }>('appStatus')
  // Meta information for this page
  defineOptions({
    name: 'OwnerProperties',
  })
</script>

<style scoped>
.properties-page {
  height: 100vh;
}
</style>
