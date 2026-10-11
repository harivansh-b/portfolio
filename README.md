# Harivansh B - Space Journey Portfolio

A cinematic developer portfolio that takes visitors from Earth to the Moon while presenting Harivansh B's education, engineering experience, selected projects, competitive-programming record, achievements, and contact details.

## Highlights (v2)

- **Scroll-driven 3D journey** (three.js + GSAP ScrollSmoother/ScrollTrigger): an astronaut rides a rocket from an Earth launchpad through every section, past project satellites, a skills constellation, an asteroid belt and achievement beacon gates.
- **Two destinations**: dark mode flies Earth → Moon and lands on the lunar surface; light mode flies Earth → Sun and lands on Helios Station, a heat-shielded platform parked in front of a Sun with granulation, sunspots, corona and prominences. Either way the rocket deploys its landing legs and the astronaut plants an HB-logo flag. Switching themes re-routes the flight live.
- Ten sections: launch, education, about, experience (Barclays), crew (leadership), filterable projects, tech stack with brand logos, competitive programming, achievements and contact.
- HB monogram logo (`src/brand/logo.tsx`, `public/logo.svg`) used for the header, favicon, rocket decal, flag and landing pad.
- Live mission HUD: phase, distance travelled, velocity and clickable section waypoints.
- Procedural GPU-shaded Earth, clouds, Moon and Sun (no texture downloads), with reduced-motion and no-WebGL fallbacks.
- Résumé dossier served from `public/resume.pdf`.
- **Space Jam v2**: waves of splitting asteroids, UFOs that shoot back, a mothership boss every 5th wave, power-ups (triple shot, rapid fire, shield, extra life, bomb), combo multiplier, pause, touch/drag controls and a saved best score.
- Contact form wired to a server-side Brevo delivery function on Vercel.

## Tech stack

- React + TypeScript + Vite
- three.js for the WebGL scene (`src/journey/`)
- GSAP ScrollSmoother + ScrollTrigger for smooth scrolling and reveals
- Lucide icons and Simple Icons (tech-stack logos)
- Vercel Serverless Function + Brevo Transactional Email API for the contact endpoint

## Run locally

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Resume

The résumé is served from:

```text
public/resume.pdf
```

Replace that file to update the in-site viewer and download link.

## Deploying to Vercel

1. Push this repository and import it in Vercel (framework preset **Vite**; `vercel.json` already sets the build command and `dist` output).
2. **Settings → Environment Variables:** add the Brevo variables from `.env.example` for the contact form.
3. **Storage → Marketplace → Upstash (Redis):** connect a free database to power the visitor counter in the header and footer (`api/visits.ts`). Until it is connected the counter stays hidden.
4. **Analytics tab → Enable Web Analytics**, and **Speed Insights tab → Enable**. Page views, visitors, countries and the custom click events below then appear in the Vercel dashboard. Custom events need a Vercel Pro plan; page views work on Hobby.
5. Redeploy after adding variables so the functions pick them up.

Tracked click events: `Resume viewed`, `Resume downloaded`, `Project opened`, `Project link clicked`, `Profile link clicked`, `Book a call clicked`, `Contact form sent`, `Space Jam opened`, `Theme switched`.

Vercel Analytics data can only be read in the dashboard (there is no public API for it), which is why the on-page visitor count comes from the small Upstash counter instead.

Preview the header counter locally with `http://localhost:5173/?mockVisits=1234` (dev server only).

## Contact form deployment

The form posts to `/api/contact`, implemented in `api/contact.ts`. It needs Vercel (or an equivalent serverless host) and these private environment variables:

```text
BREVO_API_KEY=
BREVO_MAIL_FROM_EMAIL=bandaruharivansh@gmail.com
CONTACT_RECIPIENT_EMAIL=bandaruharivansh@gmail.com
```

Never prefix secrets with `VITE_`, commit them, or place them in frontend files. The sender email must also be verified in Brevo.

## Visitor counter

The footer and contact section show a visitor count from `api/visits.ts` (one count per browser session). It needs a free Upstash Redis database: in Vercel, open **Storage → Marketplace → Upstash (Redis)** and connect it to this project, which injects `KV_REST_API_URL` / `KV_REST_API_TOKEN` (or set `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` yourself). Until then the counter simply stays hidden.

## Link preview image

`public/og-image.png` is a real 1200×630 screenshot of the hero, used by LinkedIn, WhatsApp and X link cards. After changing the hero, regenerate it:

```bash
npm run build && npm run preview   # serves http://localhost:4173
npm run og                         # in a second terminal
```

After deploying, refresh LinkedIn's cache at https://www.linkedin.com/post-inspector/.

## Project data

Profile, project, experience, education, skill groups, competitive-programming and achievement content lives in `src/data/profile.ts`. Keep this content sourced from the résumé or project repositories.

## Featured work

Nine projects are listed in `src/data/profile.ts` (TinyLink, MedChain, Nexus Finance, Eventra, SavorGo, JD Hub, Chronos, E-Spam, EcoFinds). The four featured ones:

### TinyLink

Scalable URL-shortening infrastructure with aliases, QR codes, expiry, analytics, authentication, Redis caching, and rate limiting. Built with React, FastAPI, PostgreSQL, Redis, and Clerk.

### Nexus Finance

Personal finance application for budgeting, transactions, analytics, crypto data, and payments. Built with React, Express, MongoDB, Redis, and Razorpay.

### Eventra

Event-management platform for event creation, discovery, registration, payments, check-ins, email notifications, and organizer analytics. Built with Vue.js, Java, Spring Boot, Spring Security, JPA, Tailwind CSS, JWT, and Razorpay.

### MedChain AI

Privacy-preserving federated learning for medical AI. Hospital data stays local while only weights and metrics are submitted; updates pass digital-twin validation and cross-hospital anomaly screening before FedAvg aggregation. The platform maintains an auditable on-chain trust layer and uses React, FastAPI, MongoDB, Azure Blob Storage, Solidity, and an in-process EVM.

## Repository hygiene

`.gitignore` excludes dependencies, build output and local environment files. The résumé PDF **is** committed on purpose: Vercel builds from git, so an ignored `public/resume.pdf` never reaches production. Do not commit secrets, API keys, or deployment credentials.
