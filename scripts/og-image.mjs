/* Captures public/og-image.png (1200x630): the link-preview image used by LinkedIn, WhatsApp, X, etc.
   It is a real screenshot of the hero, so it always matches the live site.

   Usage:  npm run build && npm run preview      (in one terminal, serves http://localhost:4173)
           npm run og                            (in another; optional: npm run og -- <url>)

   Reduced motion is forced so the hero text is fully visible without waiting for intro animations. */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const url = process.argv[2] ?? 'http://localhost:4173/'
const out = fileURLToPath(new URL('../public/og-image.png', import.meta.url))
const candidates = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].filter(Boolean)
const browser = candidates.find(p => existsSync(p))
if (!browser) throw new Error('Chrome/Edge not found. Set CHROME_PATH to a Chromium-based browser.')

const profile = mkdtempSync(join(tmpdir(), 'og-capture-'))
try {
  execFileSync(browser, [
    '--headless=new', `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars',
    '--force-dark-mode', '--force-prefers-reduced-motion',
    '--enable-unsafe-swiftshader', '--use-angle=swiftshader',
    '--window-size=1200,630', '--virtual-time-budget=9000',
    `--screenshot=${out}`, url,
  ], { stdio: 'ignore' })
} finally {
  rmSync(profile, { recursive: true, force: true })
}
console.log(`public/og-image.png captured from ${url} (${(statSync(out).size / 1024).toFixed(1)} KB)`)
