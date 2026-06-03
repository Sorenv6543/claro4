<template>
  <v-card class="award-card" :elevation="0" rounded="sm">
    <h3 class="award-card__title">Congratulations John! 🎉</h3>
    <span class="award-card__sub">Best seller of the month</span>
    <span class="award-card__amount">$42.8k</span>
    <span class="award-card__target">78% of target 🚀</span>
    <v-btn class="mt-1" color="primary" rounded="pill" size="small">View Sales</v-btn>
  </v-card>
</template>

<script setup lang="ts">
  defineOptions({ name: 'DashboardAwardCard' })
</script>
