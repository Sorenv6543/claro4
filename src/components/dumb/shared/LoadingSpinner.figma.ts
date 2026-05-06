/**
 * Figma Code Connect — LoadingSpinner
 *
 * To wire this up:
 *   1. Open your Figma file, click the LoadingSpinner component
 *   2. Copy the URL from the browser bar (e.g. ?node-id=12-345)
 *   3. Replace LOADING_SPINNER_NODE_ID below with the real node id
 *   4. Run: pnpm figma:publish
 */
import figma, { html } from '@figma/code-connect/html'

figma.connect(
  'https://www.figma.com/design/SXfwbTotVeWVwKZr3UvKoJ/Soren?node-id=LOADING_SPINNER_NODE_ID',
  {
    props: {
      variant: figma.enum('Variant', {
        Inline: 'inline',
        Overlay: 'overlay',
        Page: 'page',
        Button: 'button',
      }),
      color: figma.string('Color'),
      message: figma.string('Message'),
    },
    example: ({ variant, color, message }) => html`
      <LoadingSpinner
        variant="${variant}"
        color="${color}"
        message="${message}"
      />
    `,
  },
)
