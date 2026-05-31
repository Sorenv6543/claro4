<script setup lang="ts">
  import type { BookingListItem } from './OwnerBookingList.vue'
  import { useDisplay } from 'vuetify'
  import { fmt12 } from '@/utils/timelineMath'

  defineProps<{
    item: BookingListItem
  }>()

  const emit = defineEmits<{
    edit: [id: string]
    delete: [id: string]
  }>()

  const { mobile } = useDisplay()

  function formatDate (dateStr: string): string {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
  }

  function priorityColor (priority: string): string {
    switch (priority) {
      case 'urgent': { return 'error'
      }
      case 'high': { return 'warning'
      }
      case 'normal': { return 'primary'
      }
      case 'low': { return 'info'
      }
      default: { return 'default'
      }
    }
  }
</script>

<template>
  <div class="bl-inlay" :style="{ '--row-color': item.propertyColor }">
    <div class="bl-inlay-body" :class="{ 'bl-inlay-body--stacked': mobile }">
      <!-- Left: booking details -->
      <div class="bl-inlay-left">
        <div class="bl-col-label">Booking details</div>

        <table class="bl-stats-table">
          <tbody>
            <tr>
              <td><span class="bl-td-inner"><v-icon color="primary" size="14">mdi-login</v-icon> Check-in</span></td>
              <td>{{ formatDate(item.checkinDate) }}<template v-if="item.checkinTime"> · {{ fmt12(item.checkinTime) }}</template></td>
            </tr>

            <tr>
              <td><span class="bl-td-inner"><v-icon color="primary" size="14">mdi-logout</v-icon> Check-out</span></td>
              <td>{{ formatDate(item.checkoutDate) }}<template v-if="item.checkoutTime"> · {{ fmt12(item.checkoutTime) }}</template></td>
            </tr>

            <tr v-if="item.guestCount">
              <td><span class="bl-td-inner"><v-icon color="primary" size="14">mdi-account-group-outline</v-icon> Guests</span></td>
              <td>{{ item.guestCount }}</td>
            </tr>

            <tr v-if="item.priority">
              <td><span class="bl-td-inner"><v-icon color="primary" size="14">mdi-flag-outline</v-icon> Priority</span></td>

              <td>
                <v-chip :color="priorityColor(item.priority)" size="x-small" variant="tonal">
                  {{ item.priority }}
                </v-chip>
              </td>
            </tr>

            <tr v-if="item.createdAt">
              <td><span class="bl-td-inner"><v-icon color="primary" size="14">mdi-clock-outline</v-icon> Created</span></td>
              <td>{{ formatDate(item.createdAt) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Right: notes -->
      <div class="bl-inlay-right">
        <div class="bl-col-label">Notes</div>
        <p class="bl-notes">{{ item.notes || 'No notes for this booking.' }}</p>
      </div>
    </div>

    <!-- Action bar -->
    <div class="bl-actions" :class="{ 'bl-actions--mobile': mobile }" @click.stop>
      <div class="bl-actions-group">
        <v-btn
          color="primary"
          :prepend-icon="mobile ? undefined : 'mdi-pencil-outline'"
          size="small"
          variant="tonal"
          @click="emit('edit', item.id)"
        >
          <v-icon v-if="mobile" size="16" start>mdi-pencil-outline</v-icon>
          Edit
        </v-btn>
      </div>

      <div class="bl-actions-group">
        <v-btn
          color="error"
          size="small"
          variant="text"
          @click="emit('delete', item.id)"
        >
          <v-icon size="16" start>mdi-delete-outline</v-icon>
          Delete
        </v-btn>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bl-inlay {
  border-top: 1px solid var(--claro-border);
  background: color-mix(in srgb, var(--row-color, #7367F0) 8%, transparent);
}

.bl-inlay-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

.bl-inlay-left {
  padding: 12px 20px 12px 20px;
}

.bl-inlay-right {
  padding: 12px 20px;
  border-left: 1px solid rgba(var(--v-theme-primary), 0.1);
  background: rgba(var(--v-theme-primary), 0.02);
}

.bl-col-label {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--claro-fg2);
  margin: 0 0 8px;
}

.bl-stats-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.bl-stats-table tr {
  border-bottom: 1px solid rgba(var(--v-theme-primary), 0.07);
}

.bl-stats-table tr:last-child {
  border-bottom: none;
}

.bl-stats-table td {
  padding: 4px 6px;
  vertical-align: middle;
}

.bl-stats-table td:first-child {
  color: var(--claro-fg3);
  font-weight: 500;
  width: 40%;
  white-space: nowrap;
}

.bl-td-inner {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  vertical-align: middle;
}

.bl-stats-table td:last-child {
  color: var(--claro-fg1);
  font-weight: 500;
}

.bl-notes {
  font-size: 12px;
  color: var(--claro-fg2);
  line-height: var(--claro-lh-normal);
  margin: 0;
}

.bl-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 16px 10px;
  border-top: 1px solid rgba(var(--v-theme-primary), 0.1);
  background: rgba(var(--v-theme-primary), 0.05);
}

.bl-actions-group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.bl-inlay-body--stacked {
  grid-template-columns: 1fr;
}

.bl-inlay-body--stacked .bl-inlay-right {
  border-left: none;
  border-top: 1px solid var(--claro-surface-variant);
  padding: 14px 16px;
}

.bl-inlay-body--stacked .bl-inlay-left {
  padding: 14px 16px;
}

.bl-actions--mobile {
  flex-wrap: wrap;
  row-gap: 6px;
}

.bl-actions--mobile .bl-actions-group:first-child {
  flex: 1 1 100%;
}

.bl-actions--mobile .bl-actions-group:last-child {
  margin-left: auto;
}
</style>
