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
          change="+42%"
          change-type="up"
          icon="mdi-hexagon-multiple-outline"
          icon-bg="var(--claro-primary)"
          subtitle="Weekly Profit"
          title="Total Profit"
          value="$25.6k"
        />

        <DashboardStatMiniCard
          change="-18%"
          change-type="down"
          icon="mdi-cart-outline"
          icon-bg="var(--claro-success)"
          subtitle="Last Week"
          title="New Project"
          value="862"
        />

        <DashboardStatMiniCard
          :bars="profitBars"
          title="Profit"
          value="624k"
          variant="bars"
        />

        <DashboardStatMiniCard
          :bars="sessionBars"
          title="Sessions"
          value="2,845"
          variant="bars"
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
  import DashboardAwardCard from '@/components/dumb/shared/DashboardAwardCard.vue'
  import DashboardDepositWithdrawCard from '@/components/dumb/shared/DashboardDepositWithdrawCard.vue'
  import DashboardEarningsCard from '@/components/dumb/shared/DashboardEarningsCard.vue'
  import DashboardSalesCard from '@/components/dumb/shared/DashboardSalesCard.vue'
  import DashboardShell from '@/components/dumb/shared/DashboardShell.vue'
  import DashboardStatMiniCard from '@/components/dumb/shared/DashboardStatMiniCard.vue'
  import DashboardTransactionsCard from '@/components/dumb/shared/DashboardTransactionsCard.vue'
  import DashboardUserRolesTable from '@/components/dumb/shared/DashboardUserRolesTable.vue'
  import DashboardWeeklyOverview from '@/components/dumb/shared/DashboardWeeklyOverview.vue'

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
