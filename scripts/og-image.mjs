/* Renders public/og-image.png (1200x630), the link-preview image used by LinkedIn, WhatsApp, X, etc.
   Run with: npm run og */
import { Resvg } from '@resvg/resvg-js'
import { writeFileSync } from 'node:fs'

const W = 1200, H = 630
let seed = 7
const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
const stars = Array.from({ length: 140 }, () => {
  const x = (rand() * W).toFixed(1), y = (rand() * H * 0.78).toFixed(1), r = (rand() * 1.4 + 0.3).toFixed(2), o = (rand() * 0.6 + 0.25).toFixed(2)
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#e8f0ff" opacity="${o}"/>`
}).join('')

const logo = `
  <g transform="translate(84 96) scale(1.5)">
    <g transform="rotate(-22 32 32)"><path d="M2 32A30 8.5 0 0 1 62 32" stroke="#8fe3ff" stroke-width="2" opacity=".45" fill="none"/></g>
    <circle cx="32" cy="32" r="25" fill="url(#disc)" stroke="url(#ring)" stroke-width="2"/>
    <path d="M18 17V47M34 17V47M18 32H34M34 19.5H39.5A6.25 6.25 0 0 1 39.5 32H34M34 32H40.5A6.25 6.25 0 0 1 40.5 44.5H34" stroke="#fff" stroke-width="5" stroke-linejoin="round" fill="none"/>
    <path d="M22 7L22.9 10.1L26 11L22.9 11.9L22 15L21.1 11.9L18 11L21.1 10.1Z" fill="#fff" opacity=".9"/>
    <g transform="rotate(-22 32 32)">
      <path d="M2 32A30 8.5 0 0 0 62 32" stroke="#8fe3ff" stroke-width="2" fill="none"/>
      <circle cx="59.6" cy="35.3" r="3.3" fill="#ffb35c"/>
    </g>
  </g>`

const chip = (x, label) => {
  const w = label.length * 11.2 + 36
  return [`<g transform="translate(${x} 470)"><rect width="${w}" height="44" rx="22" fill="#0e1733" stroke="#8fe3ff" stroke-opacity=".35"/><text x="${w / 2}" y="29" text-anchor="middle" font-family="Consolas, 'DM Mono', monospace" font-size="18" fill="#cfe4ff">${label}</text></g>`, w]
}
let cx = 84, chips = ''
for (const label of ['CGPA 9.205', 'LeetCode Guardian · 2147', 'ICPC Regionalist', 'Ex-SDE Intern @ Barclays']) {
  const [svg, w] = chip(cx, label); chips += svg; cx += w + 14
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="sky" cx="70%" cy="20%" r="90%"><stop offset="0" stop-color="#14224f"/><stop offset=".55" stop-color="#060b1f"/><stop offset="1" stop-color="#02040c"/></radialGradient>
    <radialGradient id="earth" cx="40%" cy="20%" r="80%"><stop offset="0" stop-color="#5fb3ff"/><stop offset=".45" stop-color="#1d5fb3"/><stop offset="1" stop-color="#0a2348"/></radialGradient>
    <radialGradient id="moon" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#f1f1ee"/><stop offset=".6" stop-color="#a9a9a4"/><stop offset="1" stop-color="#4b4b49"/></radialGradient>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#8fe3ff" stop-opacity=".35"/><stop offset="1" stop-color="#8fe3ff" stop-opacity="0"/></radialGradient>
    <radialGradient id="disc" cx="35%" cy="30%" r="75%"><stop offset="0" stop-color="#1d2f66"/><stop offset="1" stop-color="#050a1c"/></radialGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8fe3ff"/><stop offset="1" stop-color="#ffb35c"/></linearGradient>
    <linearGradient id="trail" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#ffb35c" stop-opacity="0"/><stop offset="1" stop-color="#ffb35c" stop-opacity=".9"/></linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  ${stars}
  <circle cx="1010" cy="150" r="120" fill="url(#glow)"/>
  <circle cx="1010" cy="150" r="62" fill="url(#moon)"/>
  <circle cx="990" cy="132" r="9" fill="#8a8a86" opacity=".55"/><circle cx="1030" cy="170" r="13" fill="#8a8a86" opacity=".45"/><circle cx="1022" cy="120" r="5" fill="#8a8a86" opacity=".5"/>
  <ellipse cx="900" cy="980" rx="720" ry="430" fill="url(#earth)"/>
  <ellipse cx="900" cy="980" rx="728" ry="438" fill="none" stroke="#7cc8ff" stroke-opacity=".55" stroke-width="6"/>
  <path d="M760 520 C 820 420, 880 330, 948 230" stroke="url(#trail)" stroke-width="4" fill="none" stroke-dasharray="2 10" stroke-linecap="round"/>
  <g transform="translate(944 236) rotate(38)">
    <path d="M0 -26 C 9 -16 10 2 8 14 L -8 14 C -10 2 -9 -16 0 -26 Z" fill="#f1f3f7"/>
    <path d="M-8 6 L-16 18 L-8 14 Z M8 6 L16 18 L8 14 Z" fill="#d93a30"/>
    <circle cx="0" cy="-9" r="4.5" fill="#7fd4ff"/>
    <path d="M-5 15 L0 30 L5 15 Z" fill="#ffb35c"/>
  </g>
  ${logo}
  <text x="84" y="282" font-family="'Segoe UI', 'Space Grotesk', Arial, sans-serif" font-size="96" font-weight="700" letter-spacing="-3" fill="#eaf2ff">Harivansh B</text>
  <text x="88" y="340" font-family="'Segoe UI', Arial, sans-serif" font-size="34" font-weight="500" fill="#8fe3ff">Software Developer</text>
  <text x="88" y="392" font-family="'Segoe UI', Arial, sans-serif" font-size="25" fill="#c3cfe6">Backend · Distributed Systems · AI — CSE @ SSN College of Engineering</text>
  ${chips}
  <text x="84" y="580" font-family="Consolas, 'DM Mono', monospace" font-size="18" letter-spacing="3" fill="#8d9bb8">HARIVANSH-B.VERCEL.APP · MISSION HB-02</text>
</svg>`

const png = new Resvg(svg, { fitTo: { mode: 'width', value: W }, font: { loadSystemFonts: true, defaultFontFamily: 'Arial' } }).render().asPng()
writeFileSync(new URL('../public/og-image.png', import.meta.url), png)
console.log(`public/og-image.png written (${(png.length / 1024).toFixed(1)} KB)`)
