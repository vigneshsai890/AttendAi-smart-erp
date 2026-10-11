<div align="center">

<img src="docs/architecture.svg" alt="AttendAI Smart ERP architecture map" width="100%" />

</div>

# AttendAI Smart ERP

> A full-stack workspace for operational workflows, frontend surfaces and service integrations.

A Next.js-based smart ERP workspace whose repository contains frontend and backend surfaces plus integrations for authentication, messaging, QR scanning and reporting.

<div align="center">

`Next.js · React · TypeScript · MongoDB / Firebase integrations` &nbsp;·&nbsp; `web UI → application routes → services / data integrations`

</div>

## `01 / SYSTEM CARD`

- **Primary boundary:** `frontend → backend / route handlers → persistence + external services`
- **Documentation stance:** architecture and presentation only; application source is intentionally untouched.
- **Visual language:** Y2K terminal grid, brutalist labels, maximalist contrast, readable static SVG fallback.

## `02 / ARCHITECTURE`

The map above is a compact view of the repository's visible runtime boundary. It is designed to answer three questions quickly: where input enters, where policy or domain logic lives, and where external side effects leave the system.

![Architecture map for AttendAI Smart ERP](docs/architecture.svg)

## `03 / DESIGN NOTES`

- This is a repository-level map based on the visible project structure and package manifest.
- The existing create-next-app run instructions are preserved below rather than replaced with unverified product claims.

This upgrade adds documentation assets only. It does not change source files, dependency manifests, tests, workflows or runtime configuration.

## `04 / EXISTING PROJECT DOCUMENTATION`

<details open>
<summary>Read the original project notes</summary>

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.


<!-- Triggering fresh Render deployment for Universal Auth Hub at Sat Apr  4 02:19:24 IST 2026 -->

</details>

