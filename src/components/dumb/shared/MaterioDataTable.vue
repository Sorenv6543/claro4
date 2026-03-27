<template>
  <v-card class="materio-data-table" :elevation="elevation">
    <!-- Header -->
    <div v-if="title || $slots.header" class="d-flex align-center justify-space-between pa-5 pb-3">
      <div>
        <h3 class="text-h6 font-weight-medium">{{ title }}</h3>
        <p v-if="subtitle" class="text-body-2 text-medium-emphasis mt-1">{{ subtitle }}</p>
      </div>
      <div class="d-flex align-center ga-2">
        <slot name="header-actions" />
      </div>
    </div>

    <!-- Search & Filters -->
    <div v-if="searchable || $slots.filters" class="px-5 pb-3">
      <v-row align="center" dense>
        <v-col v-if="searchable" cols="12" :md="$slots.filters ? 4 : 6">
          <v-text-field
            v-model="searchQuery"
            clearable
            density="compact"
            hide-details
            placeholder="Search..."
            prepend-inner-icon="mdi-magnify"
            rounded="lg"
            single-line
            variant="outlined"
          />
        </v-col>
        <v-col v-if="$slots.filters">
          <slot name="filters" />
        </v-col>
      </v-row>
    </div>

    <!-- Data Table -->
    <v-data-table
      v-model:expanded="expandedRows"
      class="materio-table"
      :headers="headers"
      item-value="id"
      :items="filteredItems"
      :items-per-page="itemsPerPage"
      :loading="loading"
      :show-expand="expandable"
    >
      <!-- Pass through all slots from parent -->
      <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
        <slot :name="name" v-bind="slotData ?? {}" />
      </template>

      <!-- Default expanded row slot -->
      <template v-if="expandable && !$slots['expanded-row']" #expanded-row="{ columns, item }">
        <tr>
          <td class="expanded-row-content pa-4" :colspan="columns.length">
            <slot :item="item" name="expand-content" />
          </td>
        </tr>
      </template>

      <!-- Bottom slot with pagination info -->
      <template #bottom>
        <div class="d-flex align-center justify-end pa-4 pt-2">
          <div class="d-flex align-center ga-4">
            <span class="text-body-2 text-medium-emphasis">Rows per page:</span>
            <v-select
              v-model="itemsPerPageLocal"
              density="compact"
              hide-details
              :items="[5, 10, 15, 25]"
              style="max-width: 80px"
              variant="outlined"
            />
          </div>
        </div>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'

  export interface DataTableHeader {
    title: string
    key: string
    sortable?: boolean
    align?: 'start' | 'center' | 'end'
    width?: string | number
  }

  const props = withDefaults(defineProps<{
    title?: string
    subtitle?: string
    headers: DataTableHeader[]
    items: Record<string, unknown>[]
    loading?: boolean
    searchable?: boolean
    expandable?: boolean
    searchKeys?: string[]
    itemsPerPage?: number
    elevation?: number | string
  }>(), {
    title: '',
    subtitle: '',
    loading: false,
    searchable: true,
    expandable: false,
    searchKeys: () => [],
    itemsPerPage: 10,
    elevation: 0,
  })

  const searchQuery = ref('')
  const expandedRows = ref<string[]>([])
  const itemsPerPageLocal = ref(props.itemsPerPage)

  watch(() => props.itemsPerPage, val => {
    itemsPerPageLocal.value = val
  })

  const filteredItems = computed(() => {
    if (!searchQuery.value) return props.items
    const query = searchQuery.value.toLowerCase()
    const keys = props.searchKeys.length > 0
      ? props.searchKeys
      : props.headers.map(h => h.key).filter(k => k !== 'actions' && k !== 'data-table-expand')
    return props.items.filter(item =>
      keys.some(key => {
        const val = item[key]
        return val != null && String(val).toLowerCase().includes(query)
      }),
    )
  })
</script>

<style scoped>
.materio-data-table {
  border-radius: 8px;
  overflow: hidden;
}

.materio-table :deep(.v-data-table-header) {
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.materio-table :deep(.v-data-table-header th) {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
  white-space: nowrap;
  border-bottom: thin solid rgba(var(--v-theme-on-surface), 0.08) !important;
}

.materio-table :deep(td) {
  font-size: 0.875rem;
  border-bottom: thin solid rgba(var(--v-theme-on-surface), 0.06) !important;
}

.materio-table :deep(tr:hover td) {
  background: rgba(var(--v-theme-primary), 0.02);
}

.expanded-row-content {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-bottom: thin solid rgba(var(--v-theme-on-surface), 0.08);
}

.materio-table :deep(.v-data-table__tr--expanded td) {
  border-bottom: none !important;
}
</style>
