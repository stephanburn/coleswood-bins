# October 2026: council API blocked by bot protection — app retired

**Status:** the app is retired, and the Vercel project is to be paused from the Vercel dashboard. Bin dates now live as a calendar in Stephan's Obsidian vault.

## Symptom

From 24 October 2026 the page showed "Couldn't load collection dates". `/api/bins` returned `502 {"error":"Failed to fetch from Veolia API"}`.

## Root cause

St Albans District Council put a **Barracuda web application firewall with bot protection** in front of `gis.stalbans.gov.uk`. Requests to

```
POST https://gis.stalbans.gov.uk/NoticeBoard9/VeoliaProxy.NoticeBoard.asmx/GetServicesByUprnAndNoticeBoard
```

are now accepted only from a real browser that has passed Barracuda's JavaScript challenge. Passing it sets the cookies `x-bni-fpc`, `x-bni-rncf`, `__utm_is_wdck` and `__utm_is_did=x-bni-ja`. Any request without them is blocked:

- **From Vercel:** the request hangs until the route's 5s abort timeout (`AbortError: This operation was aborted`).
- **From a UK home connection** (`npx tsx scripts/test-api.ts`, or `curl`): an HTML "You have been blocked" page from Barracuda Networks, which the script then fails to parse as JSON.
- **With a descriptive `User-Agent` and `Accept: application/json` added:** still blocked. Headers alone are not enough.

The endpoint itself has **not** moved. The council's own page (`https://gis.stalbans.gov.uk/NoticeBoard9/NoticeBoard.aspx`) still calls the same URL with the same body (`{"uprn":"…","noticeBoard":"default"}`). It works in a browser only because the browser carries the challenge cookies.

## Why the app was not patched

The firewall is a deliberate control to keep scripts out. Getting past it would mean faking a browser or replaying challenge cookies, i.e. circumventing the council's security, and those cookies expire anyway. The legitimate options considered were:

1. **Ask the council to allowlist the app.** The block page invites an email to the site owner quoting its event ID. Vercel's egress IPs aren't fixed, so the council would have to allow the app by `User-Agent`, and may refuse.
2. **Calculate dates from the published fortnightly schedule** (Round 1 or 2, collection day, plus a yearly bank-holiday shift list), with no network calls.

Option 2 makes a web app pointless next to a calendar entry, so the app was retired instead.

## Diagnostic dead ends (to avoid repeating)

- **The log hid the error.** In production, Next.js 16 redacts an error thrown out of a `"use cache"` function to `Error: An error occurred in the Server Components render…` before it reaches the caller. The route's `console.error` therefore showed nothing useful, and its `AbortError` → 504 branch could never match. Fixed in `ef74f2b`: the error is now logged inside `fetchVeoliaServices`, before it crosses the cache boundary.
- **Region and timeout were a red herring.** Pinning functions to London (`lhr1`, via `vercel.json`) and raising the timeout to 10s made no difference. Both were reverted; the timeout is back to 5s.
- **Production showed no Next.js `⨯` line.** Locally, Next.js logs its own `⨯` line with the real error, but no such line appeared in production. Don't count on Vercel logs showing it.
- **Cloud sessions can't probe the API.** Their network policy denies both `gis.stalbans.gov.uk` and `coleswood-bins.vercel.app`, so upstream tests have to run on the laptop.

## Reviving the app

Only worthwhile if the council allowlists the app or publishes an open API or calendar feed. Then:

1. Unpause the Vercel project.
2. Confirm `npx tsx scripts/test-api.ts` prints collections, not the Barracuda page.
3. Redeploy from `main`, and check that `next build` still lists `/api/bins` as `ƒ`.
