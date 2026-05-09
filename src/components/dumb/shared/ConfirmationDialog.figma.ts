/**
 * Figma Code Connect — ConfirmationDialog
 *
 * To wire this up:
 *   1. Open your Figma file, click the ConfirmationDialog component
 *   2. Copy the URL from the browser bar (e.g. ?node-id=12-345)
 *   3. Replace FIGMA_FILE_KEY and CONFIRMATION_DIALOG_NODE_ID below
 *   4. Run: pnpm figma:publish
 */
import figma, { html } from '@figma/code-connect/html'

figma.connect(
  'https://www.figma.com/design/SXfwbTotVeWVwKZr3UvKoJ/Soren?node-id=CONFIRMATION_DIALOG_NODE_ID',
  {
    props: {
      title: figma.string('Title'),
      message: figma.string('Message'),
      confirmText: figma.string('Confirm Text'),
      cancelText: figma.string('Cancel Text'),
      dangerous: figma.boolean('Dangerous'),
    },
    example: ({ title, message, confirmText, cancelText, dangerous }) => html`
      <ConfirmationDialog
        :open="isOpen"
        title="${title}"
        message="${message}"
        confirm-text="${confirmText}"
        cancel-text="${cancelText}"
        :dangerous="${dangerous}"
        @confirm="handleConfirm"
        @cancel="handleCancel"
      />
    `,
  },
)
