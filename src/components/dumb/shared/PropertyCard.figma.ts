/**
 * Figma Code Connect — PropertyCard
 *
 * To wire this up:
 *   1. Open your Figma file, click the PropertyCard component
 *   2. Copy the URL from the browser bar (e.g. ?node-id=12-345)
 *   3. Replace PROPERTY_CARD_NODE_ID below with the real node id
 *   4. Run: pnpm figma:publish
 *
 * Note: PropertyCard takes a `property` object (type Property from @/types).
 * Supply a real property object in production usage.
 */
import figma, { html } from '@figma/code-connect/html'

figma.connect(
  'https://www.figma.com/design/SXfwbTotVeWVwKZr3UvKoJ/Soren?node-id=PROPERTY_CARD_NODE_ID',
  {
    props: {
      displayActions: figma.boolean('Show Actions'),
    },
    example: ({ displayActions }) => html`
      <PropertyCard
        :property="{ id: '1', name: 'Beach House', active: true }"
        :display-actions="${displayActions}"
      />
    `,
  },
)
