<script setup lang="ts">
  import type { BookingListItem } from './OwnerBookingList.vue'
  import { useDisplay } from 'vuetify'

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
              <td>{{ formatDate(item.checkinDate) }}<template v-if="item.checkinTime"> · {{ item.checkinTime }}</template></td>
            </tr>

            <tr>
              <td><span class="bl-td-inner"><v-icon color="primary" size="14">mdi-logout</v-icon> Check-out</span></td>
              <td>{{ formatDate(item.checkoutDate) }}<template v-if="item.checkoutTime"> · {{ item.checkoutTime }}</template></td>
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
