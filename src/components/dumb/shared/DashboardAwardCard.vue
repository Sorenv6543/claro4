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

<style scoped>
.award-card {
  width: 380px;
  flex-shrink: 0;
  padding: var(--claro-space-lg);
  box-shadow: var(--claro-shadow-sm);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.award-card__title {
  font-size: 18px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
  margin: 0;
}

.award-card__sub {
  font-size: 14px;
  color: var(--claro-fg3);
}

.award-card__amount {
  font-size: 28px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-primary);
}

.award-card__target {
  font-size: 14px;
  color: var(--claro-fg3);
}

@media (max-width: 959px) {
  .award-card {
    width: 100%;
  }
}
</style>
