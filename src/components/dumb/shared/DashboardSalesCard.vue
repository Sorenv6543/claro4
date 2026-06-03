<template>
  <v-card class="sales-card" :elevation="0" rounded="sm">
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
