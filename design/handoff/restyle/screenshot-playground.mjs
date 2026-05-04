import { chromium } from 'playwright'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

const URL = 'https://play.vuetifyjs.com/#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'

const outPath = join(__dirname, 'owner-calendar-vuetify-preview.png')

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.setViewportSize({ width: 1280, height: 900 })

await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 })
await page.waitForTimeout(3000)

// Find the preview iframe and screenshot it
const previewFrame = page.frames().find(f => f.url() === '' || f.url().includes('about:srcdoc'))
  ?? page.mainFrame()

// Screenshot the preview panel area (right half of the page)
const previewEl = await page.$('iframe')
if (previewEl) {
  const box = await previewEl.boundingBox()
  await page.screenshot({
    path: outPath,
    clip: { x: box.x, y: box.y, width: box.width, height: Math.min(box.height, 760) },
  })
  console.log(`Saved preview screenshot to: ${outPath}`)
  console.log(`Dimensions: ${box.width}x${Math.min(box.height, 760)}`)
} else {
  console.log('No iframe found — taking full page screenshot')
  await page.screenshot({ path: outPath })
}

await browser.close()
