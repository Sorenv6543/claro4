<template>
  <v-card class="sales-card" rounded="sm" :elevation="0">
    <h3 class="sales-card__title">Sales by Countries</h3>

    <div class="sales-card__list">
      <div
        v-for="item in salesData"
        :key="item.code"
        class="sales-item"
      >
        <div
          class="sales-item__avatar"
          :style="{ backgroundColor: item.tintBg }"
        >
          <span :style="{ color: item.color }">{{ item.code }}</span>
        </div>

        <div class="sales-item__info">
          <div class="sales-item__row">
            <span class="sales-item__amount">{{ item.amount }}</span>
            <v-icon
              :color="item.trendColor"
              :icon="item.trendIcon"
              size="16"
            />
            <span
              class="sales-item__pct"
              :style="{ color: item.trendColor }"
            >{{ item.pct }}</span>
          </div>
          <span class="sales-item__country">{{ item.country }}</span>
        </div>

        <div class="sales-item__sales">
          <span class="sales-item__sales-val">{{ item.salesVal }}</span>
          <span class="sales-item__sales-lbl">Sales</span>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
  defineOptions({ name: 'DashboardSalesCard' })

  const salesData = [
    {
      code: 'US',
      color: 'var(--claro-success)',
      tintBg: 'color-mix(in srgb, var(--claro-success) 15%, transparent)',
      amount: '$8,656k',
      trendIcon: 'mdi-arrow-up',
      trendColor: 'var(--claro-success)',
      pct: '25.8%',
      country: 'United states of america',
      salesVal: '894k',
    },
    {
      code: 'UK',
      color: 'var(--claro-error)',
      tintBg: 'color-mix(in srgb, var(--claro-error) 15%, transparent)',
      amount: '$2,415k',
      trendIcon: 'mdi-arrow-down',
      trendColor: 'var(--claro-error)',
      pct: '6.2%',
      country: 'United kingdom',
      salesVal: '645k',
    },
    {
      code: 'IN',
      color: 'var(--claro-warning)',
      tintBg: 'color-mix(in srgb, var(--claro-warning) 15%, transparent)',
      amount: '$865k',
      trendIcon: 'mdi-arrow-up',
      trendColor: 'var(--claro-success)',
      pct: '12.4%',
      country: 'India',
      salesVal: '148k',
    },
  ]
</script>

<style scoped>
.sales-card {
  width: 400px;
  padding: var(--claro-space-lg);
  box-shadow: var(--claro-shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--claro-space-md);
}

.sales-card__title {
  font-size: 18px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
  margin: 0;
}

.sales-card__list {
  display: flex;
  flex-direction: column;
  gap: var(--claro-space-md);
}

.sales-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.sales-item__avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: var(--claro-font-weight-semibold);
}

.sales-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sales-item__row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.sales-item__amount {
  font-size: 15px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
}

.sales-item__pct {
  font-size: 13px;
}

.sales-item__country {
  font-size: 13px;
  color: var(--claro-fg3);
}

.sales-item__sales {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.sales-item__sales-val {
  font-size: 15px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
}

.sales-item__sales-lbl {
  font-size: 12px;
  color: var(--claro-fg3);
}
</style>
