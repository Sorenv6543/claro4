<template>
  <v-card class="roles-table" :elevation="0" rounded="sm">
    <div class="roles-table__header">
      <span
        v-for="col in columns"
        :key="col"
        class="roles-table__th"
      >{{ col }}</span>
    </div>

    <template
      v-for="(row, i) in rows"
      :key="row.name"
    >
      <div class="roles-table__row">
        <div class="roles-table__cell roles-table__user">
          <div
            class="roles-table__avatar"
            :style="{ backgroundColor: row.avatarBg }"
          >
            <span :style="{ color: row.avatarColor }">{{ row.initials }}</span>
          </div>

          <div class="roles-table__name-col">
            <span class="roles-table__name">{{ row.name }}</span>
            <span class="roles-table__handle">{{ row.handle }}</span>
          </div>
        </div>

        <span class="roles-table__cell roles-table__email">{{ row.email }}</span>

        <div class="roles-table__cell roles-table__role">
          <v-icon
            :color="row.roleColor"
            :icon="row.roleIcon"
            size="18"
          />

          <span>{{ row.roleLabel }}</span>
        </div>

        <div class="roles-table__cell roles-table__status">
          <span
            class="roles-table__chip"
            :style="{ backgroundColor: row.chipBg, color: row.chipColor }"
          >{{ row.chipLabel }}</span>
        </div>
      </div>

      <div
        v-if="i < rows.length - 1"
        class="roles-table__sep"
      />
    </template>
  </v-card>
</template>

<script setup lang="ts">
  defineOptions({ name: 'DashboardUserRolesTable' })

  const columns = ['USER', 'EMAIL', 'ROLE', 'STATUS']

  const rows = [
    {
      name: 'Galasasen Slixby',
      handle: '@gslixby0',
      initials: 'GS',
      avatarBg: 'color-mix(in srgb, var(--claro-primary) 15%, transparent)',
      avatarColor: 'var(--claro-primary)',
      email: 'gslixby0@abc.net.au',
      roleIcon: 'mdi-pencil-outline',
      roleColor: 'var(--claro-warning)',
      roleLabel: 'Editor',
      chipLabel: 'Inactive',
      chipBg: 'color-mix(in srgb, var(--claro-fg3) 15%, transparent)',
      chipColor: 'var(--claro-fg3)',
    },
    {
      name: 'Halsey Redmore',
      handle: '@hredmore1',
      initials: 'HR',
      avatarBg: 'color-mix(in srgb, var(--claro-error) 15%, transparent)',
      avatarColor: 'var(--claro-error)',
      email: 'hredmore1@imgur.com',
      roleIcon: 'mdi-monitor',
      roleColor: 'var(--claro-error)',
      roleLabel: 'Author',
      chipLabel: 'Pending',
      chipBg: 'color-mix(in srgb, var(--claro-warning) 15%, transparent)',
      chipColor: 'var(--claro-warning)',
    },
    {
      name: 'Marjory Sicely',
      handle: '@msicely2',
      initials: 'MS',
      avatarBg: 'color-mix(in srgb, var(--claro-info) 15%, transparent)',
      avatarColor: 'var(--claro-info)',
      email: 'msicely2@who.int',
      roleIcon: 'mdi-chart-pie',
      roleColor: 'var(--claro-info)',
      roleLabel: 'Maintainer',
      chipLabel: 'Active',
      chipBg: 'color-mix(in srgb, var(--claro-success) 15%, transparent)',
      chipColor: 'var(--claro-success)',
    },
  ]
</script>

<style scoped>
.roles-table {
  box-shadow: var(--claro-shadow-sm);
  overflow: hidden;
}

.roles-table__header {
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 var(--claro-space-lg);
  background: var(--claro-surface-variant);
}

.roles-table__th {
  flex: 1;
  font-size: 12px;
  font-weight: var(--claro-font-weight-semibold);
  color: var(--claro-fg3);
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

.roles-table__row {
  display: flex;
  align-items: center;
  height: 56px;
  padding: 0 var(--claro-space-lg);
}

.roles-table__cell {
  flex: 1;
  min-width: 0;
}

.roles-table__user {
  display: flex;
  align-items: center;
  gap: 10px;
}

.roles-table__avatar {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 17px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: var(--claro-font-weight-medium);
}

.roles-table__name-col {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.roles-table__name {
  font-size: 14px;
  font-weight: var(--claro-font-weight-medium);
  color: var(--claro-fg1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.roles-table__handle {
  font-size: 12px;
  color: var(--claro-fg3);
}

.roles-table__email {
  font-size: 14px;
  color: var(--claro-fg3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.roles-table__role {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--claro-fg1);
}

.roles-table__status {
  display: flex;
}

.roles-table__chip {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: var(--claro-font-weight-medium);
}

.roles-table__sep {
  height: 1px;
  background: var(--claro-divider);
  margin: 0;
}

@media (max-width: 959px) {
  .roles-table__header,
  .roles-table__row {
    padding: 0 var(--claro-space-md);
  }

  .roles-table__email {
    display: none;
  }

  .roles-table__header .roles-table__th:nth-child(2) {
    display: none;
  }
}
</style>
