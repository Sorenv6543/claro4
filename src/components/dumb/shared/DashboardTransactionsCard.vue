<template>
  <v-card class="tx-card" :elevation="0" rounded="sm">
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
