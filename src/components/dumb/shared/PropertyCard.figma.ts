/**
 * Figma Code Connect — PropertyCard
 *
 * To wire this up:
 *   1. Open your Figma file, click the PropertyCard component
 *   2. Copy the URL from the browser bar (e.g. ?node-id=12-345)
 *   3. Replace FIGMA_FILE_KEY and PROPERTY_CARD_NODE_ID below
 *   4. Run: pnpm figma:publish
 *
 * Note: PropertyCard takes a `property` object (type Property from @/types).
 * The Figma props below map visual states to the most impactful fields.
 * Pass the full property object in real usage.
 */
import figma, { html } from '@figma/code-connect'

figma.connect(
  'https://www.figma.com/design/SXfwbTotVeWVwKZr3UvKoJ/Soren?node-id=PROPERTY_CARD_NODE_ID',
  {
    props: {
      active: figma.boolean('Active'),
      displayActions: figma.boolean('Show Actions'),
    },
    example: ({ active, displayActions }) => html`
      <PropertyCard
        :property="property"
        :display-actions="${displayActions}"
      />
    `,
  },
)
