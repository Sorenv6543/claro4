<!--
  Claro wordmark — Variant A "Hook-back arc"
  Source: design/handoff/claude-design-v1/extracted/preview/brand-wordmark-v1.html
  Uses linearGradient on the arc for a subtle fade-in stroke effect.
-->
<template>
  <svg
    class="claro-wordmark"
    viewBox="0 -24 420 180"
    fill="none"
    role="img"
    aria-label="Claro"
  >
    <title>Claro</title>
    <defs>
      <linearGradient
        id="claro-wm-arc"
        x1="140"
        y1="56"
        x2="338"
        y2="88"
        gradientUnits="userSpaceOnUse"
      >
        <stop offset="0%" stop-color="#5A4FE3" stop-opacity="0" />
        <stop offset="65%" stop-color="#5A4FE3" stop-opacity="0.7" />
        <stop offset="100%" stop-color="#5A4FE3" stop-opacity="1" />
      </linearGradient>
    </defs>
    <text
      x="8"
      y="118"
      font-family="'Inter',system-ui,sans-serif"
      font-weight="700"
      font-size="128"
      letter-spacing="-3.2"
      fill="#5A4FE3"
    >Claro</text>
    <path
      d="M 338 88 Q 358 40 326 14 Q 288 -8 232 6 Q 168 20 140 56"
      stroke="url(#claro-wm-arc)"
      stroke-width="8"
      stroke-linecap="round"
      fill="none"
    />
  </svg>
</template>

<style scoped>
.claro-wordmark {
  display: block;
  height: 38px;
  width: auto;
  flex-shrink: 0;
}
</style>
