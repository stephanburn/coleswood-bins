<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: Harpenden bin days

A single-page web app that shows the next bin collection dates for one street (Coleswood Road, Harpenden). Data comes from St Albans District Council's public VeoliaProxy API (no auth).

## Stack
- Next.js 16 (App Router) with `cacheComponents` enabled, React 19, Tailwind CSS v4.
- Deployed on Vercel. Live at coleswood-bins.vercel.app.

## Key files
- `src/app/api/bins/route.ts` — server-side proxy. GET `?uprn=` → calls VeoliaProxy, infers bin `type` from `ServiceName`, returns `{type, serviceName, nextCollection, lastCollection, schedule}[]`. Has a 5s abort timeout, UPRN regex validation, and `"use cache"` + `cacheLife("hours")`.
- `src/app/page.tsx` — client component. Fetches `/api/bins`, excludes food waste from the cards, sorts by next date, highlights the next collection, and shows a "put your bins out" banner when one is due today/tomorrow.
- `next.config.ts` — `cacheComponents: true` plus security headers (nosniff, frame DENY, referrer policy).
- `scripts/test-api.ts` — standalone probe of the upstream API; run with `npx tsx scripts/test-api.ts`.

## Conventions / gotchas
- The street's UPRN is configured via `NEXT_PUBLIC_UPRN` in `.env.local` (currently `100080830667`). The app is single-address; there is no postcode search yet.
- Food waste is intentionally NOT shown as a card — it goes out every collection, surfaced as a one-line note instead.
- No test framework is set up. The only verification script is `scripts/test-api.ts`.
- Per the root CLAUDE.md, run a type check after editing TS. Use the project-local binary (`./node_modules/.bin/tsc --noEmit`) — a bare `npx tsc` pulls an unrelated package. Note `node_modules` may not be installed; run `npm install` first.
