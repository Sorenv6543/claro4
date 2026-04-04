#!/usr/bin/env node
import { chromium } from 'playwright'

const baseUrl = process.argv[2] || 'http://localhost:3000'
const routes = ['/admin', '/admin/bookings', '/admin/properties', '/admin/schedule']

function classifySeverity (msgType, text) {
  if (msgType === 'error') {
    return 'Critical'
  }
  if (msgType === 'warning') {
    return 'Medium'
  }

  const lower = text.toLowerCase()
  if (lower.includes('uncaught') || lower.includes('unhandled')) {
    return 'Critical'
  }
  if (lower.includes('401') || lower.includes('403') || lower.includes('500')) {
    return 'High'
  }
  return 'Low'
}

function keyFor (item) {
  return `${item.kind}|${item.route}|${item.message}|${item.source || ''}`
}

const issues = []

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

page.on('console', msg => {
  const type = msg.type()
  if (type !== 'error' && type !== 'warning') {
    return
  }

  const location = msg.location()
  const source = location?.url
    ? `${location.url.split('/').at(-1) || location.url}:${location.lineNumber ?? 0}`
    : 'unknown'

  issues.push({
    kind: 'console',
    route: page.url().replace(baseUrl, '') || '/',
    type,
    severity: classifySeverity(type, msg.text()),
    message: msg.text(),
    source,
  })
})

page.on('response', response => {
  const status = response.status()
  if (status < 400) {
    return
  }

  issues.push({
    kind: 'network',
    route: page.url().replace(baseUrl, '') || '/',
    type: 'http',
    severity: status >= 500 ? 'High' : 'Medium',
    message: `${status} ${response.request().method()} ${response.url()}`,
    source: response.url(),
  })
})

page.on('requestfailed', request => {
  issues.push({
    kind: 'network',
    route: page.url().replace(baseUrl, '') || '/',
    type: 'requestfailed',
    severity: 'High',
    message: `${request.method()} ${request.url()} failed: ${request.failure()?.errorText || 'unknown error'}`,
    source: request.url(),
  })
})

for (const route of routes) {
  await page.goto(`${baseUrl}${route}`, { waitUntil: 'domcontentloaded', timeout: 60_000 })
  await page.waitForTimeout(2500)

  const links = page.getByRole('link')
  const clickable = await links.count()
  if (clickable > 0) {
    await links.first().click({ timeout: 5000 }).catch(() => {})
    await page.waitForTimeout(500)
    await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {})
    await page.waitForTimeout(500)
  }
}

await browser.close()

const deduped = []
const seen = new Map()
for (const issue of issues) {
  const key = keyFor(issue)
  seen.set(key, (seen.get(key) || 0) + 1)
}

for (const issue of issues) {
  const key = keyFor(issue)
  if (deduped.some(item => keyFor(item) === key)) {
    continue
  }
  deduped.push({ ...issue, frequency: seen.get(key) || 1 })
}

const bySeverity = {
  Critical: deduped.filter(i => i.severity === 'Critical'),
  High: deduped.filter(i => i.severity === 'High'),
  Medium: deduped.filter(i => i.severity === 'Medium'),
  Low: deduped.filter(i => i.severity === 'Low'),
}

console.log(JSON.stringify({ baseUrl, routes, totals: {
  totalIssues: deduped.length,
  critical: bySeverity.Critical.length,
  high: bySeverity.High.length,
  medium: bySeverity.Medium.length,
  low: bySeverity.Low.length,
}, issues: deduped }, null, 2))
