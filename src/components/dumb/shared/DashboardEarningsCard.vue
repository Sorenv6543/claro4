<template>
  <v-card class="earn-card" :elevation="0" rounded="sm">
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
