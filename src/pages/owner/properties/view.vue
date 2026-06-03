<template>
  <div class="property-view">
    <OwnerPropertyView />
  </div>

</template>

<script setup lang="ts">
  import OwnerPropertyView from '@/components/smart/owner/OwnerPropertyView.vue'

  defineOptions({ name: 'OwnerPropertyViewPage' })
</script>
