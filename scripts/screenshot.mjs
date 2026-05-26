// Generates docs/screenshot.png for the README.
// Seeds a sample layout into localStorage, loads the running dev server, and
// captures the canvas. Run the dev server first (npm run dev), then:
//   node scripts/screenshot.mjs
import { chromium } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const URL = process.env.SCREENSHOT_URL ?? 'http://localhost:5173/'
const ft = (n) => ({ ft: n, mm: n * 304.8 })

const items = [
  {
    id: 'room-1',
    kind: 'room',
    name: 'Living Room',
    position: { x: 2, y: 2 },
    colorIndex: 8,
    members: [
      { id: 'm1', kind: 'rectangle', position: { x: 0, y: 0 }, colorIndex: 8, width: ft(16), height: ft(12) },
      { id: 'm2', kind: 'rectangle', position: { x: 16, y: 0 }, colorIndex: 8, width: ft(8), height: ft(16) },
    ],
  },
  { id: 's1', kind: 'square', position: { x: 2, y: 22 }, colorIndex: 3, side: ft(12) },
  { id: 's2', kind: 'rectangle', position: { x: 16, y: 22 }, colorIndex: 0, width: ft(10), height: ft(6) },
  { id: 's3', kind: 'triangle', position: { x: 28, y: 2 }, colorIndex: 5, width: ft(8), height: ft(10), rightAngle: 'BL' },
]

const state = { items, displayUnit: 'ft', viewport: { tx: 300, ty: 40, scale: 1 } }
const theme = process.env.SCREENSHOT_THEME // 'light' | 'dark' | undefined (system)
const out = process.env.SCREENSHOT_OUT ?? 'docs/screenshot.png'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1280, height: 760 }, deviceScaleFactor: 2 })
await page.addInitScript(
  ({ s, t }) => {
    localStorage.setItem('floor-plan-v1', JSON.stringify({ state: s, version: 2 }))
    if (t) localStorage.setItem('groundwork-theme', t)
  },
  { s: state, t: theme },
)
await page.goto(URL, { waitUntil: 'networkidle' })
await page.waitForSelector('.toolbar')
await page.waitForTimeout(400)

mkdirSync('docs', { recursive: true })
await page.screenshot({ path: out })
await browser.close()
console.log(`Wrote ${out}`)
