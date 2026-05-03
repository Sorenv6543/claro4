<template>
  <v-card class="earn-card" rounded="sm" :elevation="0">
    <h3 class="earn-card__title">Total Earning</h3>

    <div class="earn-card__amount-row">
      <span class="earn-card__amount">$24,895</span>
      <v-icon color="success" icon="mdi-arrow-up" size="18" />
      <span class="earn-card__pct">10%</span>
    </div>

    <span class="earn-card__compare">Compared to $84,325 last year</span>

    <div class="earn-card__list">
      <div
        v-for="item in earnings"
        :key="item.name"
        class="earn-item"
      >
        <div
          class="earn-item__avatar"
          :style="{ backgroundColor: item.avatarBg }"
        >
          <span :style="{ color: item.avatarColor }">{{ item.initial }}</span>
        </div>
        <div class="earn-item__info">
          <span class="earn-item__name">{{ item.name }}</span>
          <span class="earn-item__sub">{{ item.sub }}</span>
        </div>
        <span class="earn-item__amt">{{ item.amount }}</span>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
  defineOptions({ name: 'DashboardEarningsCard' })

  const earnings = [
    {
      initial: 'Z',
      avatarBg: 'color-mix(in srgb, var(--claro-primary) 15%, transparent)',
      avatarColor: 'var(--claro-primary)',
      name: 'Zipcar',
      sub: 'Vuejs, React & HTML',
      amount: '$24,895.65',
    },
    {
      initial: 'B',
      avatarBg: 'color-mix(in srgb, var(--claro-info) 15%, transparent)',
      avatarColor: 'var(--claro-info)',
      name: 'Bitbank',
      sub: 'Sketch, Figma & XD',
      amount: '$8,650.20',
    },
  ]
</script>

<style scoped>
.earn-card {
  width: 400px;
  flex-shrink: 0;
  padding: var(--claro-space-lg);
  box-shadow: var(--claro-shadow-sm);
  display: flex;
  flex-direction: column;
  gap: var(--claro-space-md);
}

.earn-card__title {
  font-size: 18px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
  margin: 0;
}

.earn-card__amount-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.earn-card__amount {
  font-size: 24px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
}

.earn-card__pct {
  font-size: 14px;
  color: var(--claro-success);
}

.earn-card__compare {
  font-size: 14px;
  color: var(--claro-fg3);
}

.earn-card__list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.earn-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.earn-item__avatar {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: var(--claro-font-weight-semibold);
}

.earn-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.earn-item__name {
  font-size: 14px;
  font-weight: var(--claro-font-weight-medium);
  color: var(--claro-fg1);
}

.earn-item__sub {
  font-size: 12px;
  color: var(--claro-fg3);
}

.earn-item__amt {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
}

@media (max-width: 959px) {
  .earn-card {
    width: 100%;
  }
}
</style>
