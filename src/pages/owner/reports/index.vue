<template>
  <div class="reports-page">

    <Reports />
  </div>
</template>

<script setup lang="ts">

  import Reports from '@/components/smart/shared/Reports.vue'

  // Meta information for this page
  defineOptions({
    name: 'Reports',
  })
</script>
