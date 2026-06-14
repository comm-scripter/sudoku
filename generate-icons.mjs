/**
 * Generates apple-touch-icon.png from public/favicon.svg using Playwright.
 * Run with: node generate-icons.mjs
 * Requires Playwright browsers: npx playwright install chromium
 */

import { chromium } from 'playwright'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const svgPath = resolve('./public/favicon.svg')
const svg = readFileSync(svgPath, 'utf8')

const sizes = [
  { name: 'apple-touch-icon.png', size: 180 },
]

const browser = await chromium.launch()

for (const { name, size } of sizes) {
  const page = await browser.newPage()
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<!doctype html>
<html>
<head><style>*{margin:0;padding:0}body{background:transparent}</style></head>
<body>
  <img src="data:image/svg+xml,${encodeURIComponent(svg)}" width="${size}" height="${size}">
</body>
</html>`)
  await page.waitForLoadState('networkidle')
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: size, height: size }, omitBackground: true })
  writeFileSync(`./public/${name}`, png)
  console.log(`✓ public/${name} (${size}×${size})`)
  await page.close()
}

await browser.close()
console.log('Done.')
