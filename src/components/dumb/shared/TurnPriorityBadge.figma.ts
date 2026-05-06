/**
 * Figma Code Connect — TurnPriorityBadge
 *
 * To wire this up:
 *   1. Open your Figma file, click the TurnPriorityBadge component
 *   2. Copy the URL from the browser bar (e.g. ?node-id=12-345)
 *   3. Replace FIGMA_FILE_KEY and TURN_PRIORITY_BADGE_NODE_ID below
 *   4. Run: pnpm figma:publish
 */
import figma, { html } from '@figma/code-connect'

figma.connect(
  'https://www.figma.com/design/FIGMA_FILE_KEY/Claro?node-id=TURN_PRIORITY_BADGE_NODE_ID',
  {
    props: {
      priority: figma.enum('Priority', {
        Urgent: 'urgent',
        High: 'high',
        Normal: 'normal',
        Low: 'low',
      }),
      userRole: figma.enum('Role', {
        Owner: 'owner',
        Admin: 'admin',
      }),
      size: figma.enum('Size', {
        'X-Small': 'x-small',
        Small: 'small',
        Default: 'default',
        Large: 'large',
      }),
      variant: figma.enum('Variant', {
        Flat: 'flat',
        Tonal: 'tonal',
        Outlined: 'outlined',
      }),
      showIcon: figma.boolean('Show Icon'),
      animated: figma.boolean('Animated'),
    },
    example: ({ priority, userRole, size, variant, showIcon, animated }) => html`
      <TurnPriorityBadge
        priority="${priority}"
        user-role="${userRole}"
        size="${size}"
        variant="${variant}"
        :show-icon="${showIcon}"
        :animated="${animated}"
      />
    `,
  },
)
