# Wishgranted

A browser-based puzzle game where you write a wish that must satisfy an impossible genie's escalating list of conditions. 10 hand-curated levels plus a 24-condition Final Wish climax. No time gates — play through end-to-end in one sitting.

Live: https://wishgranted.vizleo.com

## Run locally

No build step. Open `index.html` directly in a browser, or serve the directory:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Test

Open the test pages directly in a browser (no server needed):

- `tests/rule-tests.html` — unit tests for every rule. Should be all green.
- `tests/solvability.html` — verifies every level (and the Final Wish) has a passing wish. Final Wish is acceptable as the 23-of-24 contradiction-exit (only `doubleLetter` or only `noDouble` failing — see `wishgranted-production-prd.md`, sections 2.5 and 2.7).

## Deploy

The site is hosted on Cloudflare Pages, connected to the `main` branch of the GitHub repo. Push to `main` triggers an auto-deploy. Rollback by reverting the commit. Cache headers live in `_headers`.

## Project layout

```
wishgranted/
├── index.html              entry point (script tags load in fixed order)
├── css/style.css           all styles
├── js/
│   ├── rules.js            30 rule definitions (window.RULE_POOL)
│   ├── levels.js           10 levels + Final Wish + helpers
│   ├── genie.js            voice lines + line picker
│   ├── state.js            localStorage abstraction (window.State)
│   ├── ui.js               rendering + DOM updates (window.UI)
│   └── app.js              game loop, init, event handlers
├── tests/                  browser-based test pages
├── assets/                 og-image and other binary assets
├── _headers                Cloudflare Pages cache + security headers
├── robots.txt
└── README.md
```

## Architecture

- **No build step.** Vanilla HTML, CSS, JavaScript only — no npm, no transpiler, no framework.
- **No ES modules.** Plain `<script>` tags load in order; each file attaches its public API to `window`.
- **Layering:** `rules.js`, `levels.js`, `genie.js` are pure data + pure functions (no DOM, no localStorage). `state.js` is the only file that touches localStorage. `ui.js` and `app.js` are the only files that touch the DOM.
- **State key:** `wishgranted_v1`. A future schema change ships under `wishgranted_v2` with a migration step.
- **Bundle budget:** 50 KB gzipped across all files.

See `wishgranted-production-prd.md` for the full product, design, and technical spec.

## How to add a rule

1. Append a new entry to `RULE_POOL` in `js/rules.js`. Required fields: `id`, `text`, `hint` (string or zero-arg function), `check(wish)` (pure boolean), `difficulty` (1-5), `category`.
2. Add 3+ pass and 3+ fail cases to `tests/rule-tests.html`. Open the page in a browser and verify all green.
3. (Optional) Add the rule's id to a level's `ruleIds` in `js/levels.js`.
4. Open `tests/solvability.html` and confirm every level + the Final Wish still solves. If a level fails, expand the seed corpus or pick a different rule combination.

## How to add a voice line

Add to the appropriate category in `js/genie.js` (`onUnlock`, `onBreak`, `onComplete`, `finalUnlock`, `finalComplete`). No other changes needed; `pickGenieLine` will pick uniformly with anti-immediate-repeat.

## State reset

A "reset (testing)" link sits at the bottom of the page. It wipes `localStorage` and reloads. Useful while developing; ship-time we may move it behind a key combo (out of scope for v1).
