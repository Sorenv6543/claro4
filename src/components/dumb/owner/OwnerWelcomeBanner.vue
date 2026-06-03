<!--
  Aurora hero card — doubles as a generic page header for all non-calendar owner pages.
  Mode A (Overview): pass userName → "Welcome back, {userName}" heading
  Mode B (Other pages): pass pageTitle → shows as main heading
  Stats are passed as an array for the right-side icon boxes.
-->
<template>
  <div class="owner-hero card-aurora">
    <!-- Decorative SVG wave -->
    <svg
      aria-hidden="true"
      class="flow"
      preserveAspectRatio="none"
      viewBox="0 0 800 200"
    >
      <defs>
        <linearGradient
          id="owner-hero-fade"
          x1="0"
          x2="1"
          y1="0"
          y2="0"
        >
          <stop offset="0%" stop-color="white" stop-opacity="0" />
          <stop offset="8%" stop-color="white" stop-opacity="1" />
          <stop offset="92%" stop-color="white" stop-opacity="1" />
          <stop offset="100%" stop-color="white" stop-opacity="0" />
        </linearGradient>

        <mask id="owner-hero-mask">
          <rect fill="url(#owner-hero-fade)" height="200" width="800" />
        </mask>
      </defs>

      <g mask="url(#owner-hero-mask)" style="opacity:0.7" transform="scale(-1,1) translate(-800,0)">
        <path d="M -40,150 C 120,150 180,68 310,68 S 500,160 610,110 760,48 900,78 L 900,86 C 760,56 610,118 500,169 S 310,80 180,76 C 50,72 -40,160 -40,160 Z" fill="rgba(0,0,0,0.05)" />
        <path d="M -40,138 C 120,138 180,56 310,56 S 500,146 610,96 760,36 900,66 L 900,86 C 760,56 610,118 500,169 S 310,80 180,76 C 50,72 -40,160 -40,160 Z" fill="rgba(255,255,255,0.05)" />
        <path d="M -40,138 C 120,138 180,56 310,56 S 500,146 610,96 760,36 900,66 L 900,70 C 760,40 610,102 500,152 S 310,70 180,66 C 50,62 -40,142 -40,142 Z" fill="rgba(255,255,255,0.11)" />
        <path d="M -40,138 C 120,138 180,56 310,56 S 500,146 610,96 760,36 900,66" fill="none" stroke="rgba(255,255,255,0.12)" stroke-width="0.8" />
      </g>
    </svg>

    <!-- Left: heading + subtitle + mobile pills -->
    <div class="hero-left">
      <h2 class="hero-h">{{ heading }}</h2>
      <p class="hero-sub">{{ resolvedSubtitle }}</p>

      <!-- Mobile stat pills (overview only — when legacy count props are passed) -->
      <div v-if="hasMobilePills" class="hero-pills d-flex d-sm-none">
        <span class="hero-pill">{{ turnsTodayCount }} turns</span>
        <span class="hero-pill">{{ checkoutsTodayCount }} check-outs</span>
        <span class="hero-pill">{{ weeklyOccupancyPct }}% occ.</span>
      </div>
    </div>

    <!-- Right: stat boxes (desktop) -->
    <div v-if="resolvedStats.length > 0" class="hero-right d-none d-sm-flex">
      <div v-for="stat in resolvedStats" :key="stat.label" class="hero-item">
        <div class="hero-box">
          <v-icon aria-hidden="true" color="white" :icon="stat.icon" size="18" />
        </div>

        <div>
          <div class="claro-eyebrow hero-lbl">{{ stat.label }}</div>
          <div class="claro-numeric hero-val">{{ stat.value }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  interface StatBox {
    icon: string
    label: string
    value: string | number
  }

  const props = defineProps<{
    // Mode A: greeting (overview)
    userName?: string
    // Mode B: page title (other pages)
    pageTitle?: string
    subtitle?: string
    // Right-side stat boxes
    stats?: StatBox[]
    // Legacy shorthand for overview mobile pills
    turnsTodayCount?: number
    checkoutsTodayCount?: number
    weeklyOccupancyPct?: number
  }>()

  const heading = computed(() =>
    props.pageTitle ?? (props.userName ? `Welcome back, ${props.userName}` : 'Claro'),
  )

  const resolvedSubtitle = computed(() =>
    props.subtitle ?? (props.userName
      ? 'Here\'s what\'s happening with your properties today.'
      : undefined),
  )

  const resolvedStats = computed((): StatBox[] => {
    if (props.stats?.length) return props.stats
    // Legacy fallback: overview passes the 3 count props
    if (props.turnsTodayCount !== undefined) {
      return [
        { icon: 'mdi-swap-horizontal', label: 'Turns Today', value: props.turnsTodayCount },
        { icon: 'mdi-logout', label: 'Check-outs', value: props.checkoutsTodayCount ?? 0 },
        { icon: 'mdi-home-outline', label: 'Occupancy', value: `${props.weeklyOccupancyPct ?? 0}%` },
      ]
    }
    return []
  })

  const hasMobilePills = computed(() => props.turnsTodayCount !== undefined)
</script>
