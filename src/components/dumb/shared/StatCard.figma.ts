/**
 * Figma Code Connect — StatCard
 *
 * To wire this up:
 *   1. Open your Figma file, click the StatCard component
 *   2. Copy the URL from the browser bar (e.g. ?node-id=12-345)
 *   3. Replace FIGMA_FILE_KEY and STAT_CARD_NODE_ID below
 *   4. Run: pnpm figma:publish
 */
import figma, { html } from '@figma/code-connect'

figma.connect(
  'https://www.figma.com/design/FIGMA_FILE_KEY/Claro?node-id=STAT_CARD_NODE_ID',
  {
    props: {
      value: figma.string('Value'),
      label: figma.string('Label'),
      icon: figma.string('Icon'),
      trend: figma.enum('Trend', {
        Up: 'up',
        Down: 'down',
        Flat: 'flat',
      }),
      trendValue: figma.string('Trend Value'),
      color: figma.string('Color'),
    },
    example: ({ value, label, icon, trend, trendValue, color }) => html`
      <StatCard
        value="${value}"
        label="${label}"
        icon="${icon}"
        trend="${trend}"
        trend-value="${trendValue}"
        color="${color}"
      />
    `,
  },
)
