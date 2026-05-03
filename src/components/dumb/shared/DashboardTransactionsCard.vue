<template>
  <v-card class="tx-card" rounded="sm" :elevation="0">
    <div class="tx-card__header">
      <h3 class="tx-card__title">Transactions</h3>
      <span class="tx-card__sub">Total 48.5% Growth 😎 this month</span>
    </div>

    <div class="tx-card__stats">
      <div
        v-for="stat in stats"
        :key="stat.label"
        class="tx-stat"
      >
        <div
          class="tx-stat__icon"
          :style="{ backgroundColor: stat.bg }"
        >
          <v-icon
            color="white"
            :icon="stat.icon"
            size="20"
          />
        </div>
        <div class="tx-stat__info">
          <span class="tx-stat__label">{{ stat.label }}</span>
          <span class="tx-stat__value">{{ stat.value }}</span>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
  defineOptions({ name: 'DashboardTransactionsCard' })

  const stats = [
    { icon: 'mdi-chart-pie', bg: 'var(--claro-primary)', label: 'Sales', value: '245k' },
    { icon: 'mdi-account-group-outline', bg: 'var(--claro-success)', label: 'Customers', value: '12.5k' },
    { icon: 'mdi-laptop', bg: 'var(--claro-warning)', label: 'Product', value: '1.54k' },
    { icon: 'mdi-currency-usd', bg: 'var(--claro-info)', label: 'Revenue', value: '$88k' },
  ]
</script>

<style scoped>
.tx-card {
  flex: 1;
  min-width: 0;
  padding: var(--claro-space-lg);
  box-shadow: var(--claro-shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--claro-space-md);
}

.tx-card__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tx-card__title {
  font-size: 18px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
  margin: 0;
}

.tx-card__sub {
  font-size: 14px;
  color: var(--claro-fg3);
}

.tx-card__stats {
  display: flex;
  gap: 20px;
}

.tx-stat {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
}

.tx-stat__icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tx-stat__info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tx-stat__label {
  font-size: 14px;
  color: var(--claro-fg3);
}

.tx-stat__value {
  font-size: 18px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
}

@media (max-width: 959px) {
  .tx-card__stats {
    flex-wrap: wrap;
  }

  .tx-stat {
    flex: 0 0 calc(50% - 10px);
  }
}
</style>
