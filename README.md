# Harpenden bin days

A single-page Next.js app that showed the next bin collection dates for Coleswood Road, Harpenden. It got them from St Albans District Council's VeoliaProxy API.

**Retired in October 2026.** The council now protects that API with Barracuda bot protection, which serves only browsers that have passed a JavaScript challenge. The app can no longer fetch data, and the Vercel project is paused. See [`docs/2026-10-council-api-blocked.md`](docs/2026-10-council-api-blocked.md) for the investigation and what reviving it would take.

Project notes for contributors and agents are in [`AGENTS.md`](AGENTS.md).

## Running locally

```bash
npm ci
npm run dev
```

The page loads, but `/api/bins` returns 502 while the council's bot protection is in place.
