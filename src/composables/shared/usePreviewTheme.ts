import { onMounted } from 'vue'
import { useTheme } from 'vuetify'

/**
 * Toggle the "Cluely Dark" preview theme without committing it.
 *
 * Activation:
 *   - URL: append `?theme=preview-cluely` to any route. Sticky in localStorage.
 *   - URL: append `?theme=default` (or any other value) to clear.
 *   - Programmatic: `usePreviewTheme().applyPreview('preview-cluely' | null)`.
 *
 * Sets `<html data-theme="preview-cluely">` (CSS-var overlay scope) AND
 * switches the Vuetify theme registration so v-chip / v-btn / v-card pick up
 * the dark palette. Both are required for a faithful preview.
 */

const STORAGE_KEY = 'claro-preview-theme'
const PREVIEW_NAME = 'preview-cluely'
const VUETIFY_THEME = 'previewCluely'

export function usePreviewTheme () {
  const theme = useTheme()

  function applyPreview (name: string | null) {
    if (name === PREVIEW_NAME) {
      document.documentElement.dataset.theme = PREVIEW_NAME
      theme.global.name.value = VUETIFY_THEME
      localStorage.setItem(STORAGE_KEY, PREVIEW_NAME)
    } else {
      delete document.documentElement.dataset.theme
      theme.global.name.value = 'light'
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  onMounted(() => {
    const url = new URL(window.location.href)
    const param = url.searchParams.get('theme')
    if (param === PREVIEW_NAME) {
      applyPreview(PREVIEW_NAME)
    } else if (param === null) {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved === PREVIEW_NAME) {
        applyPreview(PREVIEW_NAME)
      }
    } else {
      // Any other ?theme= value clears the preview.
      applyPreview(null)
    }
  })

  return { applyPreview }
}
