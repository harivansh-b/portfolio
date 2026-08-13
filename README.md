# Harivansh B - Space Journey Portfolio

A cinematic developer portfolio that takes visitors from Earth to the Moon while presenting Harivansh B's education, engineering experience, selected projects, competitive-programming record, achievements, and contact details.

## Highlights

- Space-journey visual narrative: Earth, orbital projects, technology constellation, asteroid field, and Moon landing.
- Responsive mission-control interface with reduced-motion support and an optional solar light mode.
- Resume dossier using `public/resume.pdf`.
- Featured project detail panels for TinyLink, Nexus Finance, Eventra, and MedChain.
- Competitive-programming radar cards with verified résumé ratings.
- Optional royalty-free ambient soundtrack and interaction SFX.
- Space Jam: a small asteroid-destruction game launched from the lower-right corner.
- Contact form wired for a server-side Brevo delivery function when deployed to Vercel.

## Tech stack

- React + TypeScript + Vite
- CSS-first animation and responsive layout
- Lucide icons
- Vercel Serverless Function for the contact endpoint
- Brevo Transactional Email API

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

## Contact form deployment

The form posts to `/api/contact`, implemented in `api/contact.ts`. It needs Vercel (or an equivalent serverless host) and these private environment variables:

```text
BREVO_API_KEY=
BREVO_MAIL_FROM_EMAIL=bandaruharivansh@gmail.com
CONTACT_RECIPIENT_EMAIL=bandaruharivansh@gmail.com
```

Never prefix secrets with `VITE_`, commit them, or place them in frontend files. The sender email must also be verified in Brevo.

## Project data

Profile, project, education, skill, and achievement content lives in `src/data/profile.ts`. Keep this content sourced from the résumé or project repositories.

## Featured work

### TinyLink

Scalable URL-shortening infrastructure with aliases, QR codes, expiry, analytics, authentication, Redis caching, and rate limiting. Built with React, FastAPI, PostgreSQL, Redis, and Clerk.

### Nexus Finance

Personal finance application for budgeting, transactions, analytics, crypto data, and payments. Built with React, Express, MongoDB, Redis, and Razorpay.

### Eventra

Event-management platform for event creation, discovery, registration, payments, check-ins, email notifications, and organizer analytics. Built with Vue.js, Java, Spring Boot, Spring Security, JPA, Tailwind CSS, JWT, and Razorpay.

### MedChain AI

Privacy-preserving federated learning for medical AI. Hospital data stays local while only weights and metrics are submitted; updates pass digital-twin validation and cross-hospital anomaly screening before FedAvg aggregation. The platform maintains an auditable on-chain trust layer and uses React, FastAPI, MongoDB, Azure Blob Storage, Solidity, and an in-process EVM.

## Repository hygiene

`.gitignore` excludes dependencies, build output, local environment files, and the private résumé PDF. Do not commit secrets, API keys, or deployment credentials.
