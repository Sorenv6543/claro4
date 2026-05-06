/**
 * Figma Code Connect — ClaroWordmark
 *
 * To wire this up:
 *   1. Open your Figma file, click the ClaroWordmark component
 *   2. Copy the URL from the browser bar (e.g. ?node-id=12-345)
 *   3. Replace FIGMA_FILE_KEY and CLARO_WORDMARK_NODE_ID below
 *   4. Run: pnpm figma:publish
 */
import figma, { html } from '@figma/code-connect'

figma.connect(
  'https://www.figma.com/design/FIGMA_FILE_KEY/Claro?node-id=CLARO_WORDMARK_NODE_ID',
  {
    props: {},
    example: () => html`
      <ClaroWordmark />
    `,
  },
)
