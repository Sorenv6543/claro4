<template>
  <v-card class="dw-card" :elevation="0" rounded="sm">
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
