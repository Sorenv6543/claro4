/**
 * Figma Code Connect — ErrorAlert
 *
 * To wire this up:
 *   1. Open your Figma file, click the ErrorAlert component
 *   2. Copy the URL from the browser bar (e.g. ?node-id=12-345)
 *   3. Replace ERROR_ALERT_NODE_ID below with the real node id
 *   4. Run: pnpm figma:publish
 */
import figma, { html } from '@figma/code-connect/html'

figma.connect(
  'https://www.figma.com/design/SXfwbTotVeWVwKZr3UvKoJ/Soren?node-id=ERROR_ALERT_NODE_ID',
  {
    props: {
      type: figma.enum('Type', {
        Error: 'error',
        Warning: 'warning',
        Info: 'info',
      }),
      message: figma.string('Message'),
      title: figma.string('Title'),
      userRole: figma.enum('Role', {
        Owner: 'owner',
        Admin: 'admin',
      }),
      retryable: figma.boolean('Retryable'),
      closable: figma.boolean('Closable'),
      variant: figma.enum('Variant', {
        Tonal: 'tonal',
        Outlined: 'outlined',
        Flat: 'flat',
      }),
    },
    example: ({ type, message, title, userRole, retryable, closable, variant }) => html`
      <ErrorAlert
        type="${type}"
        message="${message}"
        title="${title}"
        user-role="${userRole}"
        :retryable="${retryable}"
        :closable="${closable}"
        variant="${variant}"
      />
    `,
  },
)
