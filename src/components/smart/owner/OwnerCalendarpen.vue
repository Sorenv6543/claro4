<template>
  <v-app>
    <v-main style="background:#F5F5F9;">
      <v-container class="pa-6" fluid>
        <v-card elevation="0" rounded="sm" style="box-shadow:0 2px 10px rgba(0,0,0,0.05);overflow:hidden;">

          <!-- Header -->
          <div
            class="d-flex align-center justify-space-between px-6"
            style="height:56px;border-bottom:1px solid #E8E8E8;"
          >
            <div class="d-flex align-center ga-3">
              <v-btn
                density="comfortable"
                icon="mdi-chevron-left"
                rounded="sm"
                size="small"
                style="border-color:#E8E8E8;"
                variant="outlined"
              />

              <v-btn
                density="comfortable"
                icon="mdi-chevron-right"
                rounded="sm"
                size="small"
                style="border-color:#E8E8E8;"
                variant="outlined"
              />

              <span style="font-size:20px;font-weight:600;color:#2E263D;">March 2026</span>
            </div>

            <v-btn-toggle
              v-model="view"
              color="primary"
              density="comfortable"
              mandatory
              rounded="sm"
            >
              <v-btn size="small" value="month">Month</v-btn>
              <v-btn size="small" value="week">Week</v-btn>
              <v-btn size="small" value="day">Day</v-btn>
              <v-btn size="small" value="list">List</v-btn>
            </v-btn-toggle>
          </div>

          <!-- Day headers — .fc-col-header-cell: background: var(--claro-surface-variant) -->
          <div class="d-flex" style="background:#F5F5F9;border-bottom:1px solid #E8E8E8;height:36px;">
            <div
              v-for="d in DAY_NAMES"
              :key="d"
              class="d-flex align-center justify-center flex-fill"
              style="font-size:12px;font-weight:600;color:#2E263D80;"
            >{{ d }}</div>
          </div>

          <!-- Grid -->
          <div>
            <div
              v-for="(week, wi) in weeks"
              :key="wi"
              class="d-flex"
              :style="wi < weeks.length - 1 ? 'border-bottom:1px solid #F0F0F0;' : ''"
            >
              <div
                v-for="(day, di) in week"
                :key="day.d + '-' + di"
                class="d-flex flex-column ga-1 pa-1 flex-fill"
                style="min-height:110px;"
                :style="di < 6 ? 'border-right:1px solid #F0F0F0;' : ''"
              >

                <!-- Date number — .fc-daygrid-day-number: font-weight:500 -->
                <div class="d-flex justify-end">
                  <div
                    v-if="day.isToday"
                    class="d-flex align-center justify-center rounded-circle bg-primary"
                    style="width:22px;height:22px;font-size:11px;font-weight:600;color:#fff;"
                  >{{
                    day.d }}</div>

                  <span
                    v-else
                    style="font-size:12px;font-weight:500;"
                    :style="{ color: day.other ? '#2E263D40' : '#2E263D80' }"
                  >{{ day.d }}</span>
                </div>

                <!-- Events -->
                <div
                  v-for="ev in day.events"
                  :key="ev.id"
                  class="px-2 rounded-sm d-flex align-center"
                  style="min-height:16px;font-size:9px;line-height:1.3;width:100%;"
                  :style="ev.style"
                >
                  {{ ev.title }}</div>

                <div v-if="day.more" class="px-1" style="font-size:9px;color:#2E263D60;">+{{ day.more }}
                  more</div>
              </div>
            </div>
          </div>
        </v-card>

        <!-- Token legend -->
        <div class="d-flex ga-4 mt-4 flex-wrap">
          <div class="d-flex align-center ga-2">
            <div
              style="width:14px;height:14px;border-radius:2px;background:#F5F5F9;border:1px solid #E8E8E8;"
            />

            <code style="font-size:10px;">--claro-surface-variant</code>
            <span style="font-size:10px;color:#2E263D80;">.fc-col-header-cell bg</span>
          </div>

          <div class="d-flex align-center ga-2">
            <div
              style="width:14px;height:14px;border-radius:2px;background:#FF9F4320;border:3px solid #FF9F43;"
            />

            <code style="font-size:10px;">--claro-turn-standard</code>
            <span style="font-size:10px;color:#2E263D80;">.booking-turn 3px border fw:600</span>
          </div>

          <div class="d-flex align-center ga-2">
            <div
              style="width:14px;height:14px;border-radius:2px;background:#EA545520;border:3px solid #EA5455;"
            />

            <code style="font-size:10px;">--claro-turn-urgent</code>
            <span style="font-size:10px;color:#2E263D80;">.priority-urgent 3px border fw:600</span>
          </div>
        </div>
      </v-container>
    </v-main>
  </v-app>
</template>

<script setup>
  import { ref } from 'vue'

  const view = ref('month')
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const std = (c, t) => ({ background: t, color: c, borderRadius: '2px' })
  const turn = (c, t) => ({ background: t, color: c, border: `3px solid ${c}`, fontWeight: 600, borderRadius: '2px' })
  const urgent = () => ({ background: '#EA545520', color: '#EA5455', border: '3px solid #EA5455', fontWeight: 600, borderRadius: '2px', boxShadow: '0 0 0 3px #EA545508' })

  const EVENTS = {
    18: [{ id: 'e1', title: 'Dart Game?', style: std('#7367F0', '#7367F020') },
         { id: 'e2', title: 'Dinner', style: turn('#FF9F43', '#FF9F4320') }],
    20: [{ id: 'e3', title: 'Doctor\'s Appt', style: urgent() },
         { id: 'e4', title: 'Meeting', style: std('#7367F0', '#7367F020') }],
    22: [{ id: 'e5', title: 'Family Trip', style: std('#28C76F', '#28C76F20') }],
    29: [{ id: 'e6', title: '74572 W Sonrair', style: std('#28C76F', '#28C76F20') }],
  }

  function buildCalendar () {
    const firstDow = new Date(2026, 2, 1).getDay() // Saturday=6
    const cells = []
    for (let i = firstDow - 1; i >= 0; i--) cells.push({ d: 28 - i, other: true, isToday: false, events: [] })
    for (let d = 1; d <= 31; d++) cells.push({ d, other: false, isToday: d === 29, events: EVENTS[d] || [] })
    let nd = 1
    while (cells.length % 7) cells.push({
      d: nd++, other: true, isToday: false,
      events: nd === 2 ? [{ id: 'e7', title: 'Monthly Meeting', style: std('#7367F0', '#7367F020') }] : [],
    })
    const ws = []
    for (let i = 0; i < cells.length; i += 7) ws.push(cells.slice(i, i + 7))
    return ws
  }
  const weeks = buildCalendar()
</script>
