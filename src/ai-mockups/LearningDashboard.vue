<script setup lang="ts">
import { ref, computed } from 'vue'

const welcomeStats = [
  { icon: 'mdi-clock-outline',       color: 'primary', label: 'Hours Spent',      value: '34h' },
  { icon: 'mdi-chart-bar',           color: 'info',    label: 'Test Results',     value: '82%' },
  { icon: 'mdi-school-outline',      color: 'warning', label: 'Course Completed', value: '14'  },
]

const donutSegs = [
  { value: 23, color: '#5BB420' },
  { value: 35, color: '#67CB24' },
  { value: 10, color: '#72E128' },
  { value: 20, color: '#8EE753' },
  { value: 35, color: '#AAE77E' },
  { value: 23, color: '#C7F3A9' },
]
const CIRC = 2 * Math.PI * 15.9
const segTotal = donutSegs.reduce((s, x) => s + x.value, 0)
const donutArcs = computed(() => {
  let cum = 0
  return donutSegs.map(seg => {
    const startFrac = cum / segTotal
    cum += seg.value
    const len = (seg.value / segTotal) * CIRC
    return { color: seg.color, dasharray: `${len} ${CIRC - len}`, dashoffset: -startFrac * CIRC }
  })
})

const topics = [
  { name: 'UI Design',  percent: 35, color: '#5C6BC0' },
  { name: 'UX Design',  percent: 20, color: '#29B6F6' },
  { name: 'Music',      percent: 14, color: '#66BB6A' },
  { name: 'Animation',  percent: 12, color: '#78909C' },
  { name: 'Vue',        percent: 10, color: '#EF5350' },
  { name: 'SEO',        percent:  9, color: '#FFA726' },
]
const barsDesc = computed(() => [...topics].reverse())

const instructors = [
  { name: 'Jordan Stevenson',   sub: 'Business Intelligence', courses: 33, initials: 'JS', color: 'primary'   },
  { name: 'Bentlee Emblin',     sub: 'Digital Marketing',     courses: 52, initials: 'BE', color: 'secondary' },
  { name: 'Benedetto Rossiter', sub: 'UI/UX Design',          courses: 12, initials: 'BR', color: 'error'     },
  { name: 'Beverlie Krabbe',    sub: 'Vue',                    courses:  8, initials: 'BK', color: 'success'   },
]

const courses = [
  { name: 'Videography Basic Design Course',    views: '1.2k', icon: 'mdi-video-outline',      color: 'secondary' },
  { name: 'Basic Front-end Development Course', views: '834',  icon: 'mdi-code-braces',         color: 'info'      },
  { name: 'Basic Fundamentals of Photography',  views: '3.7k', icon: 'mdi-camera-outline',      color: 'success'   },
  { name: 'Advance Dribble Base Visual Design', views: '2.5k', icon: 'mdi-vector-bezier',       color: 'warning'   },
  { name: 'Your First Singing Lesson',          views: '948',  icon: 'mdi-microphone-outline',  color: 'error'     },
]

const assignments = [
  { name: 'User Experience Design',  tasks: 120, pct: 72, color: '#5C6BC0' },
  { name: 'Basic fundamentals',      tasks:  32, pct: 48, color: '#29B6F6' },
  { name: 'React Native components', tasks: 182, pct: 15, color: '#EF5350' },
  { name: 'Basic of music theory',   tasks:  56, pct: 24, color: '#FFA726' },
]
const C2 = 2 * Math.PI * 14
function arc(pct: number, c: number) {
  const f = (pct / 100) * c
  return `${f} ${c - f}`
}

const tableSearch = ref('')
const tableSelected = ref<string[]>([])
const tableHeaders = [
  { title: 'Course Name', key: 'courseName', sortable: false },
  { title: 'Time',        key: 'time',       sortable: false },
  { title: 'Progress',    key: 'progress',   sortable: false },
  { title: 'Status',      key: 'status',     sortable: false },
]
const tableItems = [
  { courseName: 'Basics of Angular',  instructor: 'Lauretta Coie',       initials: 'LC', iColor: 'error',   time: '17h 34m', pct: 76,  done: 19,  total: 25,  users: 18, screens: 20, docs: 83, icon: 'mdi-angular',        iconColor: 'error'   },
  { courseName: 'UI/UX Design',       instructor: 'Maybelle Zmitrovich', initials: 'MZ', iColor: 'warning', time: '19h 17m', pct: 92,  done: 48,  total: 52,  users: 14, screens: 48, docs: 43, icon: 'mdi-palette-outline', iconColor: 'warning' },
  { courseName: 'React Native',       instructor: 'Gertie Langwade',     initials: 'GL', iColor: 'info',    time: '16h 16m', pct: 87,  done: 87,  total: 100, users: 19, screens: 81, docs: 88, icon: 'mdi-react',           iconColor: 'info'    },
  { courseName: 'Art & Drawing',      instructor: 'Estella Chace',       initials: 'EC', iColor: 'success', time: '15h 49m', pct: 66,  done: 33,  total: 50,  users: 28, screens: 21, docs: 87, icon: 'mdi-pencil-outline',  iconColor: 'success' },
  { courseName: 'Basic Fundamentals', instructor: 'Euell Bownass',       initials: 'EB', iColor: 'primary', time: '12h 42m', pct: 100, done: 100, total: 100, users: 13, screens: 19, docs: 13, icon: 'mdi-book-open-outline', iconColor: 'primary' },
]
</script>

<template>
  <v-container
    fluid
    class="dashboard pa-5 pa-lg-8"
    style="min-height: 100vh; background: rgb(var(--v-theme-surface-variant))"
  >
    <!-- ── Row 1: Welcome + Time Spending ── -->
    <v-card
      rounded="xl"
      elevation="0"
      border
      class="mb-6"
    >
      <v-row no-gutters>
        <v-col
          cols="12"
          md="8"
          class="border-e"
        >
          <div class="pa-7 pa-lg-10">
            <p class="welcome-heading mb-2">
              Welcome back, <strong>Felecia</strong> 👋🏻
            </p>
            <p
              class="welcome-sub text-medium-emphasis mb-8"
              style="max-inline-size: 440px"
            >
              Your progress this week is Awesome. let's keep it up and get a lot of points reward!
            </p>

            <div class="d-flex justify-space-between flex-wrap gap-row flex-column flex-md-row">
              <div
                v-for="stat in welcomeStats"
                :key="stat.label"
                class="d-flex align-center"
              >
                <v-avatar
                  :color="stat.color"
                  variant="tonal"
                  size="62"
                  rounded
                  class="stat-avatar me-4"
                >
                  <v-icon size="34">
                    {{ stat.icon }}
                  </v-icon>
                </v-avatar>
                <div>
                  <p class="stat-label text-medium-emphasis ma-0">
                    {{ stat.label }}
                  </p>
                  <p
                    class="stat-value ma-0"
                    :class="`text-${stat.color}`"
                  >
                    {{ stat.value }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </v-col>

        <v-col
          cols="12"
          md="4"
        >
          <div class="pa-7 pa-lg-10 d-flex justify-space-between align-center h-100">
            <div>
              <p class="section-title mb-1">
                Time Spending
              </p>
              <p class="section-sub text-medium-emphasis mb-6">
                Weekly Report
              </p>
              <p class="time-value mb-3">
                231<span class="time-unit text-medium-emphasis">h</span>
                14<span class="time-unit text-medium-emphasis">m</span>
              </p>
              <v-chip
                color="success"
                variant="tonal"
                size="large"
              >
                +18.4%
              </v-chip>
            </div>

            <div class="donut-wrap position-relative flex-shrink-0">
              <svg
                width="160"
                height="160"
                viewBox="0 0 36 36"
              >
                <circle
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  stroke="rgba(0,0,0,0.06)"
                  stroke-width="2.5"
                />
                <circle
                  v-for="seg in donutArcs"
                  :key="seg.color"
                  cx="18"
                  cy="18"
                  r="15.9"
                  fill="none"
                  :stroke="seg.color"
                  stroke-width="2.5"
                  :stroke-dasharray="seg.dasharray"
                  :stroke-dashoffset="seg.dashoffset"
                  transform="rotate(-90 18 18)"
                />
              </svg>
              <div
                class="position-absolute d-flex flex-column align-center justify-center"
                style="inset: 0"
              >
                <span class="donut-label">231h</span>
                <span class="donut-sub text-medium-emphasis">Total</span>
              </div>
            </div>
          </div>
        </v-col>
      </v-row>
    </v-card>

    <!-- ── Row 2: Topics + Popular Instructors ── -->
    <v-row class="mb-6">
      <v-col
        cols="12"
        md="8"
      >
        <v-card
          rounded="xl"
          elevation="0"
          border
          class="h-100"
        >
          <v-card-text class="pa-6 pa-lg-8">
            <div class="d-flex justify-space-between align-center mb-6">
              <p class="card-title ma-0">
                Topic you are interested in
              </p>
              <v-btn
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
                density="compact"
              />
            </div>
            <v-row no-gutters>
              <v-col
                cols="12"
                sm="6"
                class="pr-sm-8"
              >
                <div
                  v-for="(t, i) in barsDesc"
                  :key="t.name"
                  class="d-flex align-center mb-3"
                >
                  <span
                    class="text-caption text-medium-emphasis mr-2"
                    style="width: 14px; text-align: right"
                  >
                    {{ topics.length - i }}
                  </span>
                  <div class="flex-grow-1">
                    <div
                      class="bar d-flex align-center px-3"
                      :style="`width: ${(t.percent / 35) * 100}%; background: ${t.color}`"
                    >
                      {{ t.name }}
                    </div>
                  </div>
                </div>
                <div class="d-flex justify-space-between mt-2 ml-5">
                  <span
                    v-for="n in [0, 7, 14, 21, 28, 35]"
                    :key="n"
                    class="axis-label"
                  >{{ n }}%</span>
                </div>
              </v-col>
              <v-col
                cols="12"
                sm="6"
                class="mt-4 mt-sm-0"
              >
                <v-row no-gutters>
                  <v-col
                    v-for="t in topics"
                    :key="t.name + '-l'"
                    cols="6"
                    class="mb-4 pr-2"
                  >
                    <div class="d-flex align-center ga-2 mb-1">
                      <span
                        class="legend-dot rounded-circle"
                        :style="`background: ${t.color}`"
                      />
                      <span class="legend-name">{{ t.name }}</span>
                    </div>
                    <p class="legend-pct ma-0 ml-4">
                      {{ t.percent }}%
                    </p>
                  </v-col>
                </v-row>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        md="4"
      >
        <v-card
          rounded="xl"
          elevation="0"
          border
          class="h-100"
        >
          <v-card-text class="pa-6 pa-lg-8">
            <div class="d-flex justify-space-between align-center mb-3">
              <p class="card-title ma-0">
                Popular Instructors
              </p>
              <v-btn
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
                density="compact"
              />
            </div>
            <div class="d-flex justify-space-between px-1 mb-2 col-headers">
              <span>Instructors</span><span>Courses</span>
            </div>
            <v-divider class="mb-2" />
            <div
              v-for="ins in instructors"
              :key="ins.name"
              class="d-flex align-center justify-space-between py-3"
            >
              <div class="d-flex align-center ga-3">
                <v-avatar
                  :color="ins.color"
                  size="40"
                >
                  <span
                    class="text-white font-weight-bold"
                    style="font-size: 13px"
                  >{{ ins.initials }}</span>
                </v-avatar>
                <div>
                  <p class="ins-name ma-0">
                    {{ ins.name }}
                  </p>
                  <p class="ins-sub text-medium-emphasis ma-0">
                    {{ ins.sub }}
                  </p>
                </div>
              </div>
              <span class="ins-count">{{ ins.courses }}</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Row 3: Top Courses + Webinar + Assignment Progress ── -->
    <v-row class="mb-6">
      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-card
          rounded="xl"
          elevation="0"
          border
          class="h-100"
        >
          <v-card-text class="pa-6">
            <div class="d-flex justify-space-between align-center mb-3">
              <p class="card-title ma-0">
                Top Courses
              </p>
              <v-btn
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
                density="compact"
              />
            </div>
            <div
              v-for="c in courses"
              :key="c.name"
              class="d-flex align-center justify-space-between py-3"
            >
              <div
                class="d-flex align-center ga-3 flex-grow-1 mr-2"
                style="min-width: 0"
              >
                <div
                  class="course-icon d-flex align-center justify-center rounded-lg flex-shrink-0"
                  :style="`background: rgba(var(--v-theme-${c.color}), 0.12)`"
                >
                  <v-icon
                    :color="c.color"
                    size="18"
                  >
                    {{ c.icon }}
                  </v-icon>
                </div>
                <p class="course-name ma-0 text-truncate">
                  {{ c.name }}
                </p>
              </div>
              <v-chip
                size="small"
                variant="tonal"
                class="flex-shrink-0"
              >
                {{ c.views }}
              </v-chip>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-card
          rounded="xl"
          elevation="0"
          class="h-100 webinar-card"
        >
          <div class="webinar-banner d-flex align-center justify-center">
            <span style="font-size: 96px; filter: drop-shadow(0 8px 16px rgba(0,0,0,.18))">🧑‍💻</span>
          </div>
          <v-card-text class="pa-6">
            <p class="card-title ma-0">
              Upcoming Webinar
            </p>
            <p class="text-medium-emphasis mt-2 mb-5 webinar-desc">
              Next Generation Frontend Architecture Using Layout Engine And Vue.
            </p>
            <div class="d-flex ga-6 mb-5">
              <div class="d-flex align-center ga-2">
                <v-icon
                  size="18"
                  color="medium-emphasis"
                >
                  mdi-calendar-outline
                </v-icon>
                <div>
                  <p class="webinar-meta-val ma-0">
                    17 Nov 23
                  </p>
                  <p class="webinar-meta-lbl text-medium-emphasis ma-0">
                    Date
                  </p>
                </div>
              </div>
              <div class="d-flex align-center ga-2">
                <v-icon
                  size="18"
                  color="medium-emphasis"
                >
                  mdi-clock-outline
                </v-icon>
                <div>
                  <p class="webinar-meta-val ma-0">
                    32 Minutes
                  </p>
                  <p class="webinar-meta-lbl text-medium-emphasis ma-0">
                    Duration
                  </p>
                </div>
              </div>
            </div>
            <v-btn
              block
              color="primary"
              rounded="lg"
              elevation="0"
              size="large"
            >
              Join The Event
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        sm="6"
        md="4"
      >
        <v-card
          rounded="xl"
          elevation="0"
          border
          class="h-100"
        >
          <v-card-text class="pa-6">
            <div class="d-flex justify-space-between align-center mb-3">
              <p class="card-title ma-0">
                Assignment progress
              </p>
              <v-btn
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
                density="compact"
              />
            </div>
            <div
              v-for="a in assignments"
              :key="a.name"
              class="d-flex align-center justify-space-between py-3"
            >
              <div class="d-flex align-center ga-3">
                <div class="mini-donut position-relative flex-shrink-0">
                  <svg
                    width="52"
                    height="52"
                    viewBox="0 0 36 36"
                  >
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      stroke="rgba(0,0,0,0.07)"
                      stroke-width="3"
                    />
                    <circle
                      cx="18"
                      cy="18"
                      r="14"
                      fill="none"
                      :stroke="a.color"
                      stroke-width="3"
                      stroke-linecap="round"
                      :stroke-dasharray="arc(a.pct, C2)"
                      stroke-dashoffset="0"
                      transform="rotate(-90 18 18)"
                    />
                  </svg>
                  <div
                    class="position-absolute d-flex align-center justify-center"
                    style="inset: 0"
                  >
                    <span class="mini-donut-label">{{ a.pct }}%</span>
                  </div>
                </div>
                <div>
                  <p class="assign-name ma-0">
                    {{ a.name }}
                  </p>
                  <p class="assign-tasks text-medium-emphasis ma-0">
                    {{ a.tasks }} Tasks
                  </p>
                </div>
              </div>
              <v-btn
                icon="mdi-chevron-right"
                variant="outlined"
                size="small"
                rounded="lg"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Row 4: Courses data table ── -->
    <v-card
      rounded="xl"
      elevation="0"
      border
    >
      <v-card-text class="pa-6 pa-lg-8">
        <div class="d-flex justify-space-between align-center flex-wrap ga-4 mb-4">
          <p class="card-title ma-0">
            Courses you are taking
          </p>
          <v-text-field
            v-model="tableSearch"
            placeholder="Search Course"
            variant="outlined"
            density="comfortable"
            prepend-inner-icon="mdi-magnify"
            hide-details
            style="max-width: 240px"
          />
        </div>

        <v-data-table
          v-model="tableSelected"
          :headers="tableHeaders"
          :items="tableItems"
          :search="tableSearch"
          :items-per-page="5"
          item-value="courseName"
          show-select
        >
          <template #[`item.courseName`]="{ item }">
            <div class="d-flex align-center ga-3 py-2">
              <div
                class="tbl-icon d-flex align-center justify-center rounded-lg flex-shrink-0"
                :style="`background: rgba(var(--v-theme-${item.iconColor}), 0.12)`"
              >
                <v-icon
                  :color="item.iconColor"
                  size="20"
                >
                  {{ item.icon }}
                </v-icon>
              </div>
              <div>
                <p class="tbl-course-name ma-0">
                  {{ item.courseName }}
                </p>
                <div class="d-flex align-center ga-1 mt-1">
                  <v-avatar
                    size="18"
                    :color="item.iColor"
                  >
                    <span
                      class="text-white"
                      style="font-size: 8px; font-weight: 700"
                    >{{ item.initials }}</span>
                  </v-avatar>
                  <span class="tbl-instructor text-medium-emphasis">{{ item.instructor }}</span>
                </div>
              </div>
            </div>
          </template>

          <template #[`item.progress`]="{ item }">
            <div
              class="d-flex align-center ga-2"
              style="min-width: 200px"
            >
              <span class="tbl-pct">{{ item.pct }}%</span>
              <v-progress-linear
                :model-value="item.pct"
                color="primary"
                rounded
                height="7"
                class="flex-grow-1"
              />
              <span class="tbl-fraction text-medium-emphasis">{{ item.done }}/{{ item.total }}</span>
            </div>
          </template>

          <template #[`item.status`]="{ item }">
            <div class="d-flex align-center ga-4">
              <div class="d-flex align-center ga-1">
                <v-icon
                  size="16"
                  color="medium-emphasis"
                >
                  mdi-account-multiple-outline
                </v-icon>
                <span class="tbl-status-num">{{ item.users }}</span>
              </div>
              <div class="d-flex align-center ga-1">
                <v-icon
                  size="16"
                  color="medium-emphasis"
                >
                  mdi-monitor-outline
                </v-icon>
                <span class="tbl-status-num">{{ item.screens }}</span>
              </div>
              <div class="d-flex align-center ga-1">
                <v-icon
                  size="16"
                  color="error"
                >
                  mdi-file-document-outline
                </v-icon>
                <span class="tbl-status-num">{{ item.docs }}</span>
              </div>
            </div>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<!-- Font import (global — just adds font to browser, no selector side-effects) -->
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap');
</style>

<style scoped>
/* ── Font application ───────────────────── */
.dashboard :deep(*) {
  font-family: 'Inter', sans-serif;
}
.dashboard :deep(.text-h2),
.dashboard :deep(.text-h3),
.dashboard :deep(.text-h4),
.dashboard :deep(.text-h5),
.dashboard :deep(.text-h6) {
  font-family: 'Plus Jakarta Sans', sans-serif;
  letter-spacing: -0.02em;
}

/* ── Welcome section ────────────────────── */
.welcome-heading {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.015em;
  line-height: 1.3;
}
.welcome-heading strong { font-weight: 800; }

.welcome-sub {
  font-size: 1rem;
  line-height: 1.6;
}

.stat-label {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 2px;
}
.stat-value {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  line-height: 1;
}

.gap-row { gap: 2rem; }

/* ── Time Spending ──────────────────────── */
.section-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.3rem;
  font-weight: 700;
  letter-spacing: -0.005em;
}
.section-sub { font-size: 0.9rem; }

.time-value {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 2.5rem;
  font-weight: 800;
  letter-spacing: -0.035em;
  line-height: 1;
}
.time-unit {
  font-size: 1.4rem;
  font-weight: 500;
}

.donut-wrap { width: 160px; height: 160px; }
.donut-label {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.3;
}
.donut-sub { font-size: 0.75rem; }

/* ── Cards ──────────────────────────────── */
.card-title {
  font-family: 'Plus Jakarta Sans', sans-serif;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: -0.005em;
}

/* ── Topics chart ───────────────────────── */
.bar {
  height: 28px;
  border-radius: 5px;
  font-size: 12px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
  min-width: 52px;
}
.axis-label { font-size: 10px; opacity: .4; }

.legend-dot { width: 9px; height: 9px; flex-shrink: 0; display: inline-block; }
.legend-name { font-size: 0.8rem; }
.legend-pct { font-size: 1rem; font-weight: 700; }

/* ── Instructors ────────────────────────── */
.col-headers {
  font-size: 10px;
  letter-spacing: .08em;
  text-transform: uppercase;
  opacity: .4;
}
.ins-name  { font-size: 0.875rem; font-weight: 600; }
.ins-sub   { font-size: 0.75rem;  }
.ins-count { font-size: 0.875rem; font-weight: 600; }

/* ── Top Courses ────────────────────────── */
.course-icon { width: 38px; height: 38px; }
.course-name { font-size: 0.85rem; font-weight: 500; }

/* ── Webinar ────────────────────────────── */
.webinar-card { border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity)); }
.webinar-banner {
  background: linear-gradient(145deg, #e8eaf6 0%, #c5cae9 100%);
  height: 150px;
  border-radius: 12px 12px 0 0;
}
.webinar-desc       { font-size: 0.875rem; line-height: 1.6; }
.webinar-meta-val   { font-size: 0.875rem; font-weight: 600; }
.webinar-meta-lbl   { font-size: 0.75rem;  }

/* ── Assignments ────────────────────────── */
.mini-donut { width: 52px; height: 52px; }
.mini-donut-label { font-size: 9px; font-weight: 700; line-height: 1; }
.assign-name  { font-size: 0.875rem; font-weight: 600; }
.assign-tasks { font-size: 0.75rem;  }

/* ── Table ──────────────────────────────── */
.tbl-icon         { width: 40px; height: 40px; }
.tbl-course-name  { font-size: 0.875rem; font-weight: 600; }
.tbl-instructor   { font-size: 0.75rem;  }
.tbl-pct          { font-size: 0.875rem; font-weight: 700; width: 42px; }
.tbl-fraction     { font-size: 0.75rem; white-space: nowrap; }
.tbl-status-num   { font-size: 0.875rem; font-weight: 500; }
</style>
