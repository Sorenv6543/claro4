<template>
  <v-card class="app-data-table" :elevation="elevation">
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
    <div v-if="searchable || $slots.filters" class="px-4 pb-3">
      <!-- Search row with filter toggle -->
      <div class="d-flex align-center ga-2">
        <v-text-field
          v-if="searchable"
          v-model="searchQuery"
          clearable
          density="compact"
          hide-details
          placeholder="Search..."
          prepend-inner-icon="mdi-magnify"
          single-line
          variant="outlined"
        />

        <v-badge
          v-if="$slots.filters && filtersCollapsible"
          color="primary"
          :content="activeFilterCount"
          floating
          :model-value="activeFilterCount > 0"
        >
          <v-btn
            :color="activeFilterCount > 0 ? 'primary' : undefined"
            density="comfortable"
            :icon="showFilters ? 'mdi-tune-variant' : 'mdi-tune'"
            size="small"
            :variant="activeFilterCount > 0 ? 'tonal' : 'outlined'"
            @click="showFilters = !showFilters"
          />
        </v-badge>
      </div>

      <!-- Segment tabs slot -->
      <div v-if="$slots.segments" class="mt-2">
        <slot name="segments" />
      </div>

      <!-- Collapsible filters -->
      <v-expand-transition>
        <div v-if="$slots.filters && (!filtersCollapsible || showFilters)" class="mt-3">
          <slot name="filters" />
        </div>
      </v-expand-transition>
    </div>

    <!-- Data Table -->
    <v-data-table
      v-model:expanded="expandedRows"
      class="app-table"
      :expand-on-click="expandable"
      :headers="visibleHeaders"
      item-value="id"
      :items="filteredItems"
      :items-per-page="itemsPerPageLocal"
      :loading="loading"
      :row-props="rowProps"
    >
      <!-- Pass through all slots from parent -->
      <template v-for="(_, name) in $slots" :key="name" #[name]="slotData">
        <slot :name="name" v-bind="slotData ?? {}" />
      </template>

      <!-- Default expanded row slot -->
      <template v-if="expandable && !$slots['expanded-row']" #expanded-row="{ columns, item }">
        <tr>
          <td class="expanded-row-content" :colspan="columns.length">
            <div class="expand-animate pa-4">
              <slot :item="item" name="expand-content" />
            </div>
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
  import { useDisplay } from 'vuetify'

  export interface DataTableHeader {
    title: string
    key: string
    sortable?: boolean
    align?: 'start' | 'center' | 'end'
    width?: string | number
    mobileHidden?: boolean
  }

  const props = withDefaults(defineProps<{
    title?: string
    subtitle?: string
    headers: DataTableHeader[]
    items: any[]
    loading?: boolean
    searchable?: boolean
    expandable?: boolean
    filtersCollapsible?: boolean
    searchKeys?: string[]
    itemsPerPage?: number
    elevation?: number | string
    rowProps?: Record<string, unknown> | ((data: { item: Record<string, unknown>, index: number }) => Record<string, unknown>)
    activeFilterCount?: number
  }>(), {
    title: '',
    subtitle: '',
    loading: false,
    searchable: true,
    expandable: false,
    filtersCollapsible: true,
    searchKeys: () => [],
    itemsPerPage: 10,
    elevation: 0,
    rowProps: undefined,
    activeFilterCount: 0,
  })

  const { mobile } = useDisplay()

  const searchQuery = ref('')
  const expandedRows = ref<string[]>([])
  const itemsPerPageLocal = ref(props.itemsPerPage)
  const showFilters = ref(false)

  watch(() => props.itemsPerPage, val => {
    itemsPerPageLocal.value = val
  })

  const visibleHeaders = computed(() => {
    if (!mobile.value) return props.headers
    return props.headers.filter(h => !h.mobileHidden)
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
.app-data-table {
  overflow: hidden;
}

.app-table :deep(.v-data-table-header) {
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.app-table :deep(.v-data-table-header th) {
  font-size: 0.75rem !important;
  font-weight: 600 !important;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  color: rgba(var(--v-theme-on-surface), 0.6) !important;
  white-space: nowrap;
  border-bottom: thin solid rgba(var(--v-theme-on-surface), 0.08) !important;
}

.app-table :deep(td) {
  font-size: 0.875rem;
  border-bottom: thin solid rgba(var(--v-theme-on-surface), 0.06) !important;
}

.app-table :deep(tr:hover td) {
  background: rgba(var(--v-theme-primary), 0.02);
}

.expanded-row-content {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border-bottom: thin solid rgba(var(--v-theme-on-surface), 0.08);
  padding: 0 !important;
}

.expand-animate {
  animation: expandRow 0.25s ease-out;
}

@keyframes expandRow {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.app-table :deep(.v-data-table__tr--expanded td) {
  border-bottom: none !important;
}
</style>
