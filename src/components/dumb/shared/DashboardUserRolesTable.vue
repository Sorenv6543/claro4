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
