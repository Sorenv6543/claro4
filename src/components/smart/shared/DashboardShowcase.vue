<template>
  <DashboardShell>
    <!-- Row 1: Award + Transactions -->
    <div class="dash-row">
      <DashboardAwardCard />
      <DashboardTransactionsCard />
    </div>

    <!-- Row 2: Weekly + Earnings + Mini Stats -->
    <div class="dash-row">
      <DashboardWeeklyOverview />
      <DashboardEarningsCard />
      <div class="dash-mini-grid">
        <DashboardStatMiniCard
          icon="mdi-hexagon-multiple-outline"
          icon-bg="var(--claro-primary)"
          title="Total Profit"
          value="$25.6k"
          change="+42%"
          change-type="up"
          subtitle="Weekly Profit"
        />
        <DashboardStatMiniCard
          icon="mdi-cart-outline"
          icon-bg="var(--claro-success)"
          title="New Project"
          value="862"
          change="-18%"
          change-type="down"
          subtitle="Last Week"
        />
        <DashboardStatMiniCard
          variant="bars"
          title="Profit"
          value="624k"
          :bars="profitBars"
        />
        <DashboardStatMiniCard
          variant="bars"
          title="Sessions"
          value="2,845"
          :bars="sessionBars"
        />
      </div>
    </div>

    <!-- Row 3: Sales + Deposit/Withdraw -->
    <div class="dash-row">
      <DashboardSalesCard />
      <DashboardDepositWithdrawCard />
    </div>

    <!-- Row 4: User Roles Table -->
    <DashboardUserRolesTable />
  </DashboardShell>
</template>

<script setup lang="ts">
  import DashboardShell from '@/components/dumb/shared/DashboardShell.vue'
  import DashboardAwardCard from '@/components/dumb/shared/DashboardAwardCard.vue'
  import DashboardTransactionsCard from '@/components/dumb/shared/DashboardTransactionsCard.vue'
  import DashboardWeeklyOverview from '@/components/dumb/shared/DashboardWeeklyOverview.vue'
  import DashboardEarningsCard from '@/components/dumb/shared/DashboardEarningsCard.vue'
  import DashboardStatMiniCard from '@/components/dumb/shared/DashboardStatMiniCard.vue'
  import DashboardSalesCard from '@/components/dumb/shared/DashboardSalesCard.vue'
  import DashboardDepositWithdrawCard from '@/components/dumb/shared/DashboardDepositWithdrawCard.vue'
  import DashboardUserRolesTable from '@/components/dumb/shared/DashboardUserRolesTable.vue'

  defineOptions({ name: 'DashboardShowcase' })

  const profitBars = [
    { height: 20, color: 'var(--claro-primary)' },
    { height: 30, color: 'var(--claro-primary)' },
    { height: 15, color: 'var(--claro-primary)' },
    { height: 35, color: 'var(--claro-primary)' },
    { height: 25, color: 'var(--claro-primary)' },
    { height: 18, color: 'var(--claro-warning)' },
    { height: 28, color: 'var(--claro-primary)' },
  ]

  const sessionBars = [
    { height: 28, color: 'var(--claro-info)' },
    { height: 18, color: 'var(--claro-info)' },
    { height: 32, color: 'var(--claro-info)' },
    { height: 12, color: 'var(--claro-info)' },
    { height: 22, color: 'var(--claro-info)' },
    { height: 35, color: 'var(--claro-warning)' },
    { height: 15, color: 'var(--claro-info)' },
  ]
</script>

<style scoped>
.dash-row {
  display: flex;
  gap: var(--claro-section-gap);
  align-items: stretch;
}

.dash-mini-grid {
  flex: 1;
  min-width: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--claro-space-lg);
}

@media (max-width: 1279px) {
  .dash-row {
    flex-wrap: wrap;
  }
}

@media (max-width: 959px) {
  .dash-row {
    flex-direction: column;
  }

  .dash-mini-grid {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 599px) {
  .dash-mini-grid {
    grid-template-columns: 1fr;
  }
}
</style>
