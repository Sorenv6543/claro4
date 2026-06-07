<!--
  Aurora hero card — doubles as a generic page header for all non-calendar owner pages.
  Mode A (Overview): pass userName → "Welcome back, {userName}" heading
  Mode B (Other pages): pass pageTitle → shows as main heading
  Stats are passed as an array for the right-side icon boxes.
-->
<template>
  <div class="owner-hero card-aurora">
    <!-- Decorative SVG wave — enhanced opacity for glass feel -->
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

      <g mask="url(#owner-hero-mask)" style="opacity:0.4" transform="scale(-1,1) translate(-800,0)">
        <path d="M -40,150 C 120,150 180,68 310,68 S 500,160 610,110 760,48 900,78 L 900,86 C 760,56 610,118 500,169 S 310,80 180,76 C 50,72 -40,160 -40,160 Z" fill="rgba(255,255,255,0.1)" />
        <path d="M -40,138 C 120,138 180,56 310,56 S 500,146 610,96 760,36 900,66 L 900,86 C 760,56 610,118 500,169 S 310,80 180,76 C 50,72 -40,160 -40,160 Z" fill="rgba(255,255,255,0.05)" />
      </g>
    </svg>

    <!-- Left: heading + subtitle + mobile pills -->
    <div class="hero-left">
      <div class="claro-eyebrow hero-eyebrow" v-if="userName">TODAY</div>
      <h2 class="hero-h">{{ heading }}</h2>
      <p class="hero-sub">{{ resolvedSubtitle }}</p>

      <!-- Mobile stat pills (overview only — when legacy count props are passed) -->
      <div v-if="hasMobilePills" class="hero-pills d-flex d-sm-none">
        <span class="hero-pill">{{ turnsTodayCount }} same-day turnovers</span>
        <span class="hero-pill">{{ checkoutsTodayCount }} check-outs</span>
        <span class="hero-pill">{{ weeklyOccupancyPct }}% occupancy</span>
      </div>
    </div>

    <!-- Right: stat boxes (desktop) -->
    <div v-if="resolvedStats.length > 0" class="hero-right d-none d-sm-flex">
      <div v-for="stat in resolvedStats" :key="stat.label" class="hero-item">
        <div class="hero-box glass-card">
          <v-icon aria-hidden="true" color="white" :icon="stat.icon" size="20" />
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
    greeting?: string
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
    props.pageTitle ?? (props.userName
      ? `${props.greeting ?? 'Good morning'}, ${props.userName}`
      : 'Claro'),
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

<style scoped>
.owner-hero {
  position: relative;
  width: 100%;
  display: flex;
  align-items: stretch;
  border-radius: var(--claro-radius-card, 24px);
  color: #fff;
  overflow: hidden;
  isolation: isolate;
  min-height: 180px;
  margin-bottom: var(--claro-space-lg);
}

.card-aurora {
  background: linear-gradient(135deg, #7367F0 0%, #9E95F5 50%, #5E52EE 100%);
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  box-shadow: var(--claro-shadow-lg) !important;
}

.flow {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.hero-left {
  flex: 1 1 0;
  padding: 40px;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  justify-content: center;
}

.hero-right {
  align-items: center;
  padding: 40px;
  gap: 32px;
  flex-wrap: wrap;
  position: relative;
  z-index: 1;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(4px);
}

.hero-eyebrow {
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: -4px;
}

.hero-h {
  margin: 0;
  font-size: 2.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  line-height: 1.1;
}

.hero-sub {
  margin: 0;
  font-size: var(--claro-text-sm);
  opacity: 0.75;
  line-height: var(--claro-lh-snug, 1.4);
}

.hero-pills {
  gap: 6px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.hero-pill {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 10px;
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.25);
}

.hero-item {
  display: flex;
  align-items: center;
  gap: 11px;
}

.hero-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.15) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.hero-lbl {
  color: rgba(255, 255, 255, 0.75);
  font-weight: 600;
}

.hero-val {
  font-size: 1.5rem;
  font-weight: 700;
  color: #fff;
}

@media (max-width: 599px) {
  .owner-hero {
    flex-direction: column;
  }
  .hero-left {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.10);
  }
}
</style>
