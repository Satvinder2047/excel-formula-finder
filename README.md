# Formula Finder (no-key version)

Search-based Excel formula reference. Instead of a page per formula, everything lives
in one searchable database (`public/formulas.json`) and the search box filters it
instantly in the browser — no API, no API key, no cost.

## How it works

1. `public/formulas.json` holds every formula entry (syntax, description, example,
   common mistakes, related formulas).
2. `public/script.js` loads that file once, then filters it live as you type — no
   network calls after the initial page load.
3. `server.js` is a tiny Express app that just serves the `public` folder. It doesn't
   call any external API.

## Setup

```bash
npm install
npm start
```

Visit `http://localhost:3000`. No `.env` file, no API key needed anywhere.

## Adding more formulas

Open `public/formulas.json` and add a new entry following the same shape:

```json
{
  "formula": "SUMPRODUCT",
  "category": "Math",
  "syntax": "=SUMPRODUCT(array1, [array2], ...)",
  "description": "One or two sentences on what it does.",
  "example": "A short concrete example.",
  "commonMistakes": ["Mistake one.", "Mistake two."],
  "relatedFormulas": ["SUMIFS", "SUMIF"]
}
```

Save, commit, and it's searchable immediately — no code changes needed.

## Deploying

Same as before — push to GitHub, deploy on Render (or Railway/Vercel) as a Node web
service with build command `npm install` and start command `npm start`. There are no
environment variables to configure this time.
