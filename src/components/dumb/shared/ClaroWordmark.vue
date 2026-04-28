<!--
  Claro wordmark — Variant A "Hook-back arc"
  Source: design/handoff/claude-design-v1/extracted/preview/brand-wordmark-v1.html
  Uses linearGradient on the arc for a subtle fade-in stroke effect.
-->
<template>
  <svg
    aria-label="Claro"
    class="claro-wordmark"
    fill="none"
    role="img"
    viewBox="0 -24 420 180"
  >
    <title>Claro</title>

    <defs>
      <linearGradient
        id="claro-wm-arc"
        gradientUnits="userSpaceOnUse"
        x1="140"
        x2="338"
        y1="56"
        y2="88"
      >
        <stop offset="0%" stop-color="#5A4FE3" stop-opacity="0" />
        <stop offset="65%" stop-color="#5A4FE3" stop-opacity="0.7" />
        <stop offset="100%" stop-color="#5A4FE3" stop-opacity="1" />
      </linearGradient>
    </defs>

    <text
      fill="#5A4FE3"
      font-family="'Inter',system-ui,sans-serif"
      font-size="128"
      font-weight="700"
      letter-spacing="-3.2"
      x="8"
      y="118"
    >Claro</text>

    <path
      d="M 338 88 Q 358 40 326 14 Q 288 -8 232 6 Q 168 20 140 56"
      fill="none"
      stroke="url(#claro-wm-arc)"
      stroke-linecap="round"
      stroke-width="8"
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
