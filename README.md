# Formula Finder

Search-based Excel formula reference. No per-formula pages — every query is answered
live by an LLM with web search, so it stays current and covers any formula (or
formula-shaped question) without you maintaining content.

## How it works

1. User types a formula name or a plain-English description into the formula-bar UI.
2. The frontend POSTs the query to `/api/search`.
3. The backend calls the Claude API with the web search tool enabled, asking for a
   structured JSON answer (syntax, description, example, common mistakes, related formulas).
4. The frontend renders that JSON into a spreadsheet-styled result card.

## Setup

```bash
npm install
cp .env.example .env
# then edit .env and add your ANTHROPIC_API_KEY (from console.anthropic.com)
npm start
```

Visit `http://localhost:3000`.

## Notes on cost & rate limiting

Every search is a live API call with web search, so it costs a bit more and takes a
couple seconds longer than a static page would. `server.js` includes a simple
per-IP rate limiter (12 requests/minute) to guard against abuse — swap it for
Redis-backed limiting if you deploy this publicly at scale.

## Deploying

This is a plain Node/Express app — it deploys as-is to Render, Railway, Fly.io, or a
small VPS. Just set the `ANTHROPIC_API_KEY` environment variable on whatever platform
you use; don't commit your real `.env` file.

## Next steps you might want

- Cache recent/popular queries (e.g. in Redis or even a local JSON file) to cut cost
  on repeat searches, while still going live for anything not yet cached.
- Add a few example queries as clickable chips under the search bar for first-time visitors.
- Log queries (anonymized) so you can see which formulas people search for most.
