<template>
  <v-card class="dw-card" rounded="sm" :elevation="0">
    <div class="dw-card__col">
      <div class="dw-card__header">
        <h3 class="dw-card__title">Deposit</h3>
        <span class="dw-card__link">View All</span>
      </div>

      <div class="dw-card__list">
        <div
          v-for="item in deposits"
          :key="item.name"
          class="dw-item"
        >
          <div class="dw-item__avatar">
            <span :style="{ color: item.iconColor }">{{ item.initial }}</span>
          </div>
          <div class="dw-item__info">
            <span class="dw-item__name">{{ item.name }}</span>
            <span class="dw-item__sub">{{ item.sub }}</span>
          </div>
          <span class="dw-item__amount dw-item__amount--deposit">{{ item.amount }}</span>
        </div>
      </div>
    </div>

    <div class="dw-card__divider" />

    <div class="dw-card__col">
      <div class="dw-card__header">
        <h3 class="dw-card__title">Withdraw</h3>
        <span class="dw-card__link">View All</span>
      </div>

      <div class="dw-card__list">
        <div
          v-for="item in withdrawals"
          :key="item.name"
          class="dw-item"
        >
          <div class="dw-item__avatar">
            <component
              :is="item.isIcon ? 'v-icon' : 'span'"
              v-bind="item.isIcon ? { icon: item.initial, size: 16, color: item.iconColor } : {}"
              :style="!item.isIcon ? { color: item.iconColor } : undefined"
            >
              <template v-if="!item.isIcon">{{ item.initial }}</template>
            </component>
          </div>
          <div class="dw-item__info">
            <span class="dw-item__name">{{ item.name }}</span>
            <span class="dw-item__sub">{{ item.sub }}</span>
          </div>
          <span class="dw-item__amount dw-item__amount--withdraw">{{ item.amount }}</span>
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
  defineOptions({ name: 'DashboardDepositWithdrawCard' })

  const deposits = [
    { initial: 'G', iconColor: 'var(--claro-primary)', name: 'Gumroad Account', sub: 'Sell UI Kit', amount: '+$4,650' },
    { initial: 'M', iconColor: 'var(--claro-warning)', name: 'Mastercard', sub: 'Wallet deposit', amount: '+$92,705' },
    { initial: 'S', iconColor: 'var(--claro-primary)', name: 'Stripe Account', sub: 'iOS Application', amount: '+$957' },
  ]

  const withdrawals = [
    { initial: 'G', iconColor: 'var(--claro-error)', name: 'Google Adsense', sub: 'PayPal deposit', amount: '-$145', isIcon: false },
    { initial: 'mdi-github', iconColor: 'var(--claro-fg1)', name: 'GitHub Enterprise', sub: 'Security & compliance', amount: '-$1,870', isIcon: true },
    { initial: 'S', iconColor: 'var(--claro-primary)', name: 'Upgrade Slack Plan', sub: 'Debit card deposit', amount: '-$450', isIcon: false },
  ]
</script>

<style scoped>
.dw-card {
  flex: 1;
  box-shadow: var(--claro-shadow-sm);
  display: flex;
  flex-direction: row;
  min-width: 0;
}

.dw-card__col {
  flex: 1;
  padding: var(--claro-space-lg);
  display: flex;
  flex-direction: column;
  gap: var(--claro-space-md);
  min-width: 0;
}

.dw-card__divider {
  width: 1px;
  background: var(--claro-divider);
  align-self: stretch;
}

.dw-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dw-card__title {
  font-size: 18px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg1);
  margin: 0;
}

.dw-card__link {
  font-size: 14px;
  color: var(--claro-primary);
  cursor: pointer;
}

.dw-card__list {
  display: flex;
  flex-direction: column;
  gap: var(--claro-space-md);
}

.dw-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dw-item__avatar {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border-radius: 2px;
  background: var(--claro-surface-variant);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: var(--claro-font-weight-semibold);
}

.dw-item__info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dw-item__name {
  font-size: 14px;
  font-weight: var(--claro-font-weight-medium);
  color: var(--claro-fg1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dw-item__sub {
  font-size: 12px;
  color: var(--claro-fg3);
}

.dw-item__amount {
  flex-shrink: 0;
  font-size: 14px;
  font-weight: var(--claro-font-weight-medium);
}

.dw-item__amount--deposit {
  color: var(--claro-success);
}

.dw-item__amount--withdraw {
  color: var(--claro-error);
}

@media (max-width: 959px) {
  .dw-card {
    flex-direction: column;
  }

  .dw-card__divider {
    width: 100%;
    height: 1px;
  }
}
</style>
