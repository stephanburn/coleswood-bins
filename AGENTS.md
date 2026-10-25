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
- `src/app/api/bins/route.ts` — server-side proxy. Takes no parameters: `GET` reads the UPRN from `NEXT_PUBLIC_UPRN` (falling back to the hardcoded Coleswood Road value), calls VeoliaProxy, infers bin `type` from `ServiceName`, and returns `{type, serviceName, nextCollection, lastCollection, schedule}[]`. Has a 10s abort timeout, UPRN regex validation, `await connection()`, and `"use cache"` + `cacheLife("hours")` keyed by UPRN and current London date.
- `src/app/page.tsx` — client component. Fetches `/api/bins`, excludes food waste from the cards, sorts by next date, highlights the next collection, and shows a "put your bins out" banner when one is due today/tomorrow.
- `vercel.json` — pins functions to London (`lhr1`), next to the council's server. Added Oct 2026, when every request to VeoliaProxy from Vercel's default region hit the then-5s abort timeout while the council's own site worked.
- `next.config.ts` — `cacheComponents: true` plus security headers (nosniff, frame DENY, referrer policy).
- `scripts/test-api.ts` — standalone probe of the upstream API; run with `npx tsx scripts/test-api.ts`.

## Conventions / gotchas
- The street's UPRN is configured via `NEXT_PUBLIC_UPRN` in `.env.local` (currently `100080830667`). The app is single-address; there is no postcode search yet.
- Food waste is intentionally NOT shown as a card — it goes out every collection, surfaced as a one-line note instead.
- **Time-sensitive routes must not be prerendered.** With `cacheComponents` enabled, a `GET` route handler that touches no request-time API is baked into a static payload at build time and served indefinitely — Vercel's CDN keeps returning the build-time body and only revalidates in the background, so `cacheLife`'s `expire` is no protection. This froze `/api/bins` on its 28 June 2026 build for 71 days (fixed in `a3172aa`). `/api/bins` therefore calls `await connection()` and passes the current Europe/London date into the `"use cache"` helper as a cache key. After changing a data route, check the `next build` route table: a `○` on it means the payload is frozen; it must be `ƒ`.

## Verify
Run before and after changes; all must pass on `main`:

```bash
./node_modules/.bin/tsc --noEmit
npm run lint
```

- Use the project-local `tsc`; a bare `npx tsc` pulls an unrelated package. Run `npm ci` first if `node_modules` is missing.
- No test framework is set up. `npx tsx scripts/test-api.ts` probes the live upstream API (network required).
- After changing a data route, also run `npm run build` and check the route table (see the prerender gotcha above).

## Session sync (local and cloud)
Work on this repo happens both on Stephan's laptop and in Claude Code cloud sessions, and each side only sees what is pushed to GitHub. Cloud sessions start from the default branch, so unmerged PR branches and unpushed local commits are invisible to them.
- **At the start of a session:** run `git fetch`, then check whether the current branch is behind or ahead of its remote, whether the working tree has uncommitted changes, and whether there are open PRs (`gh pr list`) from other sessions. Report anything out of line before changing code. (Local sessions get this from a SessionStart hook; cloud sessions must do it themselves.)
- **Before ending a session:** commit and push the work, or open a PR, so the other side can see it. If anything is left uncommitted or unpushed, say so.
