<script setup lang="ts">
import { computed } from 'vue'

const welcomeStats = [
  { icon: 'mdi-laptop',              color: 'secondary', label: 'Hours Spent',      value: '34h' },
  { icon: 'mdi-lightbulb-outline',   color: 'info',      label: 'Test Results',     value: '82%' },
  { icon: 'mdi-certificate-outline', color: 'warning',   label: 'Course Completed', value: '14'  },
]

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
  { name: 'Videography Basic Design Course',    views: '1.2k', icon: 'mdi-video-outline',     color: 'secondary' },
  { name: 'Basic Front-end Development Course', views: '834',  icon: 'mdi-code-tags',          color: 'info'      },
  { name: 'Basic Fundamentals of Photography',  views: '3.7k', icon: 'mdi-image-outline',      color: 'success'   },
  { name: 'Advance Dribble Base Visual Design', views: '2.5k', icon: 'mdi-basketball',         color: 'warning'   },
  { name: 'Your First Singing Lesson',          views: '948',  icon: 'mdi-music-note-outline', color: 'error'     },
]

const assignments = [
  { name: 'User Experience Design',  tasks: 120, pct: 72, color: '#5C6BC0' },
  { name: 'Basic fundamentals',      tasks:  32, pct: 48, color: '#29B6F6' },
  { name: 'React Native components', tasks: 182, pct: 15, color: '#EF5350' },
  { name: 'Basic of music theory',   tasks:  56, pct: 24, color: '#FFA726' },
]

const C1 = 2 * Math.PI * 15.9
const C2 = 2 * Math.PI * 14
function arc(pct: number, c: number) {
  const f = (pct / 100) * c
  return `${f} ${c - f}`
}
</script>

<template>
  <v-container
    fluid
    class="pa-3 pa-md-4"
    style="background: rgb(var(--v-theme-surface-variant)); min-height: 100vh"
  >
    <!-- ── Row 1: Welcome + Time Spending ──────────────────────── -->
    <v-row class="mb-2">
      <v-col
        cols="12"
        md="8"
      >
        <v-card
          rounded="xl"
          elevation="0"
          border
        >
          <v-card-text class="pa-4">
            <p class="text-subtitle-1 font-weight-bold ma-0">
              Welcome back, Felecia 👋
            </p>
            <p
              class="text-body-2 text-medium-emphasis mt-1 mb-4"
              style="max-width: 320px"
            >
              Your progress this week is Awesome. let's keep it up!
            </p>
            <div class="d-flex align-center flex-wrap ga-2">
              <template
                v-for="(stat, i) in welcomeStats"
                :key="stat.label"
              >
                <v-divider
                  v-if="i > 0"
                  vertical
                  style="height: 44px"
                  class="mx-3"
                />
                <div class="d-flex align-center ga-2">
                  <div
                    class="stat-sm-icon d-flex align-center justify-center rounded-lg flex-shrink-0"
                    :style="`background: rgba(var(--v-theme-${stat.color}), 0.12)`"
                  >
                    <v-icon
                      :color="stat.color"
                      size="20"
                    >
                      {{ stat.icon }}
                    </v-icon>
                  </div>
                  <div>
                    <p
                      class="text-caption text-medium-emphasis ma-0"
                      style="white-space: nowrap"
                    >
                      {{ stat.label }}
                    </p>
                    <p
                      class="text-subtitle-2 font-weight-bold ma-0"
                      :class="`text-${stat.color}`"
                    >
                      {{ stat.value }}
                    </p>
                  </div>
                </div>
              </template>
            </div>
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
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-center">
              <div>
                <p class="text-subtitle-2 font-weight-medium ma-0">
                  Time Spending
                </p>
                <p class="text-caption text-medium-emphasis mt-0 mb-2">
                  Weekly Report
                </p>
                <p class="text-h6 font-weight-bold ma-0">
                  231h 14m
                </p>
                <v-chip
                  color="success"
                  variant="tonal"
                  size="small"
                  class="mt-1"
                >
                  +18.4%
                </v-chip>
              </div>
              <div class="donut position-relative flex-shrink-0">
                <svg
                  width="80"
                  height="80"
                  viewBox="0 0 36 36"
                >
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="rgba(0,0,0,0.08)"
                    stroke-width="2.5"
                  />
                  <circle
                    cx="18"
                    cy="18"
                    r="15.9"
                    fill="none"
                    stroke="#4CAF50"
                    stroke-width="2.5"
                    stroke-linecap="round"
                    :stroke-dasharray="arc(80, C1)"
                    stroke-dashoffset="0"
                    transform="rotate(-90 18 18)"
                  />
                </svg>
                <div
                  class="position-absolute d-flex flex-column align-center justify-center"
                  style="inset: 0"
                >
                  <span style="font-size: 10px; font-weight: 700; line-height: 1.2">231h</span>
                  <span style="font-size: 8px; opacity: .45; line-height: 1.2">Total</span>
                </div>
              </div>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Row 2: Topics chart + Popular Instructors ────────────── -->
    <v-row class="mb-2">
      <v-col
        cols="12"
        md="8"
      >
        <v-card
          rounded="xl"
          elevation="0"
          border
        >
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-center mb-4">
              <p class="text-subtitle-2 font-weight-bold ma-0">
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
                class="pr-sm-5"
              >
                <div
                  v-for="(t, i) in barsDesc"
                  :key="t.name"
                  class="d-flex align-center mb-2"
                >
                  <span
                    class="text-caption text-medium-emphasis mr-2"
                    style="width: 12px; text-align: right; font-size: 10px"
                  >
                    {{ topics.length - i }}
                  </span>
                  <div class="flex-grow-1">
                    <div
                      class="bar d-flex align-center px-2"
                      :style="`width: ${(t.percent / 35) * 100}%; background: ${t.color}`"
                    >
                      {{ t.name }}
                    </div>
                  </div>
                </div>
                <div class="d-flex justify-space-between mt-1 ml-4">
                  <span
                    v-for="n in [0, 7, 14, 21, 28, 35]"
                    :key="n"
                    style="font-size: 8px; opacity: .4"
                  >
                    {{ n }}%
                  </span>
                </div>
              </v-col>
              <v-col
                cols="12"
                sm="6"
                class="mt-3 mt-sm-0"
              >
                <v-row no-gutters>
                  <v-col
                    v-for="t in topics"
                    :key="t.name + '-l'"
                    cols="6"
                    class="mb-2 pr-1"
                  >
                    <div class="d-flex align-center ga-1 mb-1">
                      <span
                        class="legend-dot rounded-circle"
                        :style="`background: ${t.color}`"
                      />
                      <span
                        class="text-caption"
                        style="font-size: 11px"
                      >{{ t.name }}</span>
                    </div>
                    <p class="text-body-2 font-weight-bold ma-0 ml-3">
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
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-center mb-1">
              <p class="text-subtitle-2 font-weight-bold ma-0">
                Popular Instructors
              </p>
              <v-btn
                icon="mdi-dots-vertical"
                variant="text"
                size="small"
                density="compact"
              />
            </div>
            <div
              class="d-flex justify-space-between px-1 mb-1"
              style="font-size: 9px; letter-spacing: .08em; text-transform: uppercase; opacity: .4"
            >
              <span>Instructors</span><span>Courses</span>
            </div>
            <v-divider class="mb-1" />
            <div
              v-for="ins in instructors"
              :key="ins.name"
              class="d-flex align-center justify-space-between py-2"
            >
              <div class="d-flex align-center ga-2">
                <v-avatar
                  :color="ins.color"
                  size="32"
                >
                  <span
                    class="text-white font-weight-bold"
                    style="font-size: 11px"
                  >{{ ins.initials }}</span>
                </v-avatar>
                <div>
                  <p
                    class="text-body-2 font-weight-medium ma-0"
                    style="font-size: 12px"
                  >
                    {{ ins.name }}
                  </p>
                  <p class="text-caption text-medium-emphasis ma-0">
                    {{ ins.sub }}
                  </p>
                </div>
              </div>
              <span class="text-body-2 font-weight-medium">{{ ins.courses }}</span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- ── Row 3: Top Courses + Webinar + Assignment Progress ────── -->
    <v-row>
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
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-center mb-2">
              <p class="text-subtitle-2 font-weight-bold ma-0">
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
              class="d-flex align-center justify-space-between py-2"
            >
              <div
                class="d-flex align-center ga-2 flex-grow-1 mr-2"
                style="min-width: 0"
              >
                <div
                  class="course-icon d-flex align-center justify-center rounded-lg flex-shrink-0"
                  :style="`background: rgba(var(--v-theme-${c.color}), 0.12)`"
                >
                  <v-icon
                    :color="c.color"
                    size="16"
                  >
                    {{ c.icon }}
                  </v-icon>
                </div>
                <p
                  class="text-body-2 ma-0 text-truncate"
                  style="font-size: 12px"
                >
                  {{ c.name }}
                </p>
              </div>
              <v-chip
                size="x-small"
                variant="tonal"
                class="flex-shrink-0"
                style="font-size: 10px"
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
            <span style="font-size: 80px; filter: drop-shadow(0 6px 10px rgba(0,0,0,.15))">🧑‍💻</span>
          </div>
          <v-card-text class="pa-4">
            <p class="text-subtitle-2 font-weight-bold ma-0">
              Upcoming Webinar
            </p>
            <p
              class="text-body-2 text-medium-emphasis mt-1 mb-3"
              style="font-size: 12px"
            >
              Next Generation Frontend Architecture Using Layout Engine And Vue.
            </p>
            <div class="d-flex ga-5 mb-4">
              <div class="d-flex align-center ga-1">
                <v-icon
                  size="16"
                  color="medium-emphasis"
                >
                  mdi-calendar-outline
                </v-icon>
                <div>
                  <p
                    class="text-body-2 font-weight-medium ma-0"
                    style="font-size: 12px"
                  >
                    17 Nov 23
                  </p>
                  <p class="text-caption text-medium-emphasis ma-0">
                    Date
                  </p>
                </div>
              </div>
              <div class="d-flex align-center ga-1">
                <v-icon
                  size="16"
                  color="medium-emphasis"
                >
                  mdi-clock-outline
                </v-icon>
                <div>
                  <p
                    class="text-body-2 font-weight-medium ma-0"
                    style="font-size: 12px"
                  >
                    32 Minutes
                  </p>
                  <p class="text-caption text-medium-emphasis ma-0">
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
          <v-card-text class="pa-4">
            <div class="d-flex justify-space-between align-center mb-2">
              <p class="text-subtitle-2 font-weight-bold ma-0">
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
              class="d-flex align-center justify-space-between py-2"
            >
              <div class="d-flex align-center ga-2">
                <div class="mini-donut position-relative flex-shrink-0">
                  <svg
                    width="44"
                    height="44"
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
                    <span style="font-size: 8px; font-weight: 700; line-height: 1">{{ a.pct }}%</span>
                  </div>
                </div>
                <div>
                  <p
                    class="text-body-2 font-weight-medium ma-0"
                    style="font-size: 12px"
                  >
                    {{ a.name }}
                  </p>
                  <p class="text-caption text-medium-emphasis ma-0">
                    {{ a.tasks }} Tasks
                  </p>
                </div>
              </div>
              <v-btn
                icon="mdi-chevron-right"
                variant="outlined"
                size="x-small"
                rounded="lg"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.stat-sm-icon { width: 38px; height: 38px; }
.course-icon  { width: 32px; height: 32px; }
.donut        { width: 80px; height: 80px; }
.mini-donut   { width: 44px; height: 44px; }

.bar {
  height: 22px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  color: white;
  white-space: nowrap;
  min-width: 40px;
}

.legend-dot {
  width: 7px;
  height: 7px;
  flex-shrink: 0;
  display: inline-block;
}

.webinar-card {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
}

.webinar-banner {
  background: linear-gradient(145deg, #e8eaf6 0%, #c5cae9 100%);
  height: 130px;
  border-radius: 12px 12px 0 0;
}
</style>