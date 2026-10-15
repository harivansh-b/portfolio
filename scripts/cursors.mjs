/* Generates the site's cursor set (public/cursors/*.svg) in the portfolio's own palette,
   one file per cursor and theme. Run with: npm run cursors */
import { mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'

const out = new URL('../public/cursors/', import.meta.url)
mkdirSync(out, { recursive: true })
for (const f of readdirSync(out)) if (/\.(png|svg|txt)$/.test(f)) rmSync(new URL(f, out))

const THEMES = {
  dark: { fill: ['#1d2f66', '#050a1c'], edge: ['#8fe3ff', '#ffb35c'], accent: '#8fe3ff', accent2: '#ffb35c', ink: '#ffffff', halo: 'rgba(143,227,255,.35)', danger: '#ff6b8b' },
  light: { fill: ['#fffaf3', '#f1e4d4'], edge: ['#c2410c', '#2563eb'], accent: '#c2410c', accent2: '#2563eb', ink: '#1d1a22', halo: 'rgba(194,65,12,.25)', danger: '#dc2626' },
}

/* classic arrow silhouette, tip at (3, 2) */
const ARROW = 'M3 2 L3 23.5 L8.6 18.4 L12.4 26.6 L16 25 L12.3 17 L19.8 17 Z'
const STAR = (x, y, r, c) => `<path d="M${x} ${y - r}L${x + r * .28} ${y - r * .28}L${x + r} ${y}L${x + r * .28} ${y + r * .28}L${x} ${y + r}L${x - r * .28} ${y + r * .28}L${x - r} ${y}L${x - r * .28} ${y - r * .28}Z" fill="${c}"/>`

const svg = (body, t, size = 32) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
<defs>
  <linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${t.fill[0]}"/><stop offset="1" stop-color="${t.fill[1]}"/></linearGradient>
  <linearGradient id="e" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.edge[0]}"/><stop offset="1" stop-color="${t.edge[1]}"/></linearGradient>
  <linearGradient id="a" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${t.accent}"/><stop offset="1" stop-color="${t.accent2}"/></linearGradient>
</defs>${body}</svg>`

const arrow = (t, fill = 'url(#f)') => `
<path d="${ARROW}" fill="none" stroke="${t.halo}" stroke-width="4" stroke-linejoin="round"/>
<path d="${ARROW}" fill="${fill}" stroke="url(#e)" stroke-width="1.6" stroke-linejoin="round"/>`

const CURSORS = {
  /* default pointer */
  default: t => svg(arrow(t) + STAR(7.2, 10.5, 2.6, t.ink), t),
  /* links and buttons: accent arrow inside an orbit, like the logo */
  pointer: t => svg(`
<g transform="rotate(-24 16 18)"><ellipse cx="16" cy="18" rx="13" ry="4.4" fill="none" stroke="${t.accent}" stroke-width="1.3" opacity=".55"/></g>
${arrow(t, 'url(#a)')}
<g transform="rotate(-24 16 18)"><path d="M3 18 A13 4.4 0 0 0 29 18" fill="none" stroke="${t.accent}" stroke-width="1.3"/><circle cx="28.4" cy="19.6" r="2" fill="${t.accent2}"/></g>
${STAR(7.2, 10.5, 2.6, t.fill[1])}`, t),
  /* text fields */
  text: t => svg(`
<path d="M11 5 H14 Q16 5 16 7 V25 Q16 27 14 27 H11 M21 5 H18 Q16 5 16 7 M21 27 H18 Q16 27 16 25" fill="none" stroke="${t.halo}" stroke-width="4" stroke-linecap="round"/>
<path d="M11 5 H14 Q16 5 16 7 V25 Q16 27 14 27 H11 M21 5 H18 Q16 5 16 7 M21 27 H18 Q16 27 16 25" fill="none" stroke="url(#e)" stroke-width="1.8" stroke-linecap="round"/>
${STAR(16, 16, 2.2, t.ink)}`, t),
  /* Space Jam reticle */
  crosshair: t => svg(`
<circle cx="16" cy="16" r="9" fill="none" stroke="${t.halo}" stroke-width="4"/>
<circle cx="16" cy="16" r="9" fill="none" stroke="url(#e)" stroke-width="1.6"/>
<path d="M16 2 V9 M16 23 V30 M2 16 H9 M23 16 H30" stroke="${t.accent}" stroke-width="1.6" stroke-linecap="round"/>
<circle cx="16" cy="16" r="1.8" fill="${t.accent2}"/>`, t),
  /* disabled controls */
  unavailable: t => svg(arrow(t) + `
<circle cx="23" cy="23" r="6" fill="${t.fill[1]}" stroke="${t.danger}" stroke-width="1.8"/><path d="M19 27 L27 19" stroke="${t.danger}" stroke-width="1.8" stroke-linecap="round"/>`, t),
  /* while the contact form is sending */
  progress: t => svg(arrow(t) + `
<circle cx="23.5" cy="23.5" r="5.5" fill="none" stroke="${t.accent}" stroke-width="1.2" opacity=".45"/>
<circle cx="29" cy="23.5" r="1.8" fill="${t.accent2}"/><circle cx="23.5" cy="18" r="1.4" fill="${t.accent}"/><circle cx="18.6" cy="25.8" r="1.1" fill="${t.ink}"/>`, t),
}

for (const [theme, t] of Object.entries(THEMES))
  for (const [name, make] of Object.entries(CURSORS))
    writeFileSync(new URL(`${name}-${theme}.svg`, out), make(t))
console.log(`public/cursors: ${Object.keys(CURSORS).length * 2} cursors written`)
