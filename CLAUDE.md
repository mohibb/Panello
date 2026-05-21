# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A family dashboard (Malik family) hosted on Cloudflare Pages, displayed on a wall-mounted screen. Inspired by Skylight. See `PROJECT_PLAN.md` for full architecture, API contract, DB schema, and phased build plan.

**Current state:** Phase 1 complete (static frontend). Phase 2 complete (Cloudflare backend scaffold). Phase 3 next (live weather, tasks, meals).

---

## Code quality

All code is automatically linted and tested by GitHub Actions CI on every push. **Lint and tests must pass before any merge.**

```bash
npm run lint   # ESLint — zero errors required, warnings allowed
npm test       # vitest run — all test suites must pass
```

**ESLint** (`eslint.config.js`) covers every `.js` file except `public/` and `node_modules/`. Uses ESLint v10 flat config with `@eslint/js` recommended rules, `sourceType: 'module'`, and browser globals.

**Tests** (`tests/`) use Vitest + `@cloudflare/vitest-pool-workers`. Tests run inside a miniflare Workers environment with real D1 and KV bindings. Each test file gets its own Worker instance; `tests/helpers/setup.js` applies DB migrations via `beforeAll`.

**GitHub Actions** (`.github/workflows/ci.yml`) runs `npm ci → npm run lint → npm test` on Node 20. No env vars needed — all config comes from `wrangler.toml`.

---

## Running the project locally

```bash
npm install
npm run dev    # wrangler pages dev → http://localhost:8787
```

Dashboard: `http://localhost:8787`
Admin page: `http://localhost:8787/admin` (password: value of `ADMIN_PASSWORD` in `wrangler.toml`)

No build step — frontend is plain HTML/CSS/JS served by Cloudflare Pages.

---

## Architecture

```
public/index.html           The dashboard (single-page, no framework)
functions/
  api/
    config.js               GET /api/config
    events.js               GET /api/events?week=YYYY-MM-DD
    tasks.js                GET/POST /api/tasks
    tasks/[id].js           PATCH/DELETE /api/tasks/:id
    meals.js                GET/POST /api/meals
    weather.js              GET /api/weather (KV cache 30 min)
    photos.js               GET /api/photos  (KV cache 1 hr)
  admin/
    _middleware.js          Basic-auth guard (ADMIN_PASSWORD)
    index.js                Serves admin page HTML
db/
  migrations/
    0001_initial.sql        CREATE TABLE tasks + meals
tests/
  helpers/
    setup.js                Vitest setupFile — applies migrations to D1
  api/                      One test file per route
  db/schema.test.js         D1 schema assertions
  admin/auth.test.js        Basic-auth checks
wrangler.toml               D1, KV, vars, secrets list
vitest.config.js            Workers test pool config
```

### Request flow

Cloudflare Pages serves `public/index.html` as a static asset. All `/api/*` and `/admin` routes are handled by Pages Functions (`functions/`).

The frontend fetches `/api/config` on load to get member list and colors — nothing about family members is hardcoded in HTML. It then fetches all other endpoints and starts a 60-second poll loop.

Backend routes proxy Google Calendar and Google Photos server-side; the frontend never calls Google APIs directly. Weather (Yr.no) and photo responses are cached in KV (30 min and 1 hr respectively).

### Key API endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/config` | GET | Family name, members (id, name, color, calendarId) |
| `/api/events?week=YYYY-MM-DD` | GET | All calendar events for the week |
| `/api/tasks` | GET/POST | List or add tasks |
| `/api/tasks/:id` | PATCH/DELETE | Toggle done or delete |
| `/api/meals?week=YYYY-MM-DD` | GET | Meal plan for week |
| `/api/meals` | POST | Upsert a meal entry |
| `/api/weather` | GET | Current weather + forecast from Yr.no |
| `/api/photos` | GET | Photo URLs from Google Photos album |

All routes return `{ error: "..." }` with appropriate HTTP status on failure.

### Database (D1 — async SQLite)

```sql
CREATE TABLE tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  owner TEXT NOT NULL DEFAULT 'shared',
  done INTEGER NOT NULL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE meals (
  date TEXT PRIMARY KEY,  -- ISO: 2026-05-20
  lunch TEXT,
  dinner TEXT
);
```

Migration file: `db/migrations/0001_initial.sql`

Run locally: `npx wrangler d1 migrations apply panello --local`
Run in production: `npx wrangler d1 migrations apply panello`

Family config (members, colors, calendar IDs) lives in `wrangler.toml` vars / Cloudflare Pages env vars — not in D1.

---

## Coding conventions

- **ESM** (`import`/`export`) throughout — no CommonJS
- **No TypeScript**, no frontend framework — vanilla HTML/CSS/JS only
- **D1** — async API (`await env.DB.prepare(...).bind(...).all()`)
- **KV** — async with TTL (`await env.CACHE.put(key, val, { expirationTtl: 1800 })`)
- `/admin` protected by `functions/admin/_middleware.js` using `env.ADMIN_PASSWORD`
- Pages Functions export named handlers: `onRequestGet`, `onRequestPost`, `onRequestPatch`, `onRequestDelete`
- Dynamic routes use filename convention: `functions/api/tasks/[id].js` → `params.id`

---

## Frontend layout rules

- Left sidebar: 72px wide, icon + label nav, clock at bottom
- Calendar grid: 06:00–00:00 (18 hours), events positioned absolutely by time percentage
- Calendar header takes 2fr, body 10fr (CSS grid)
- `scaleGrid()` + ResizeObserver keeps the grid filling available height
- Person colors come from `/api/config` at runtime, stored in a `PERSON_COLORS` map — never hardcode them

---

## Family members (from config, not hardcoded)

| ID | Name | Color |
|---|---|---|
| mohibb | Mohibb | #3D8EE8 |
| saffa | Saffa | #E8607A |
| jonas | Jonas | #F0A500 |
| noah | Noah | #48B368 |
| family | Family | #8B6FD4 |

---

## wrangler.toml vars (development + test)

```toml
FAMILY_NAME    = "Malik"
LOCATION_LAT   = "59.9139"
LOCATION_LON   = "10.7522"
ADMIN_PASSWORD = "ci_test_password"   # Override in Cloudflare Pages dashboard for production
```

Production-only secrets set in Cloudflare Pages dashboard (Settings > Environment Variables, encrypted):
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- `CAL_MOHIBB`, `CAL_SAFFA`, `CAL_FAMILY`
- `PHOTOS_ALBUM_ID`

---

## First-time Cloudflare setup

```bash
npx wrangler login
npx wrangler d1 create panello          # copy database_id into wrangler.toml
npx wrangler kv namespace create CACHE  # copy id into wrangler.toml
npx wrangler kv namespace create CACHE --preview  # copy preview_id into wrangler.toml
npx wrangler d1 migrations apply panello --local
npx wrangler d1 migrations apply panello
# Connect Pages to GitHub repo in Cloudflare dashboard:
#   Build command: (none), Build output directory: public
```

---

## Hard constraints

- Do not add a frontend framework (React, Vue, etc.)
- Do not add a different database — D1 (SQLite) is sufficient for this use case
- Do not add auth to the dashboard itself — it's a wall display
- Do not hardcode family member names or colors in frontend HTML
- Do not call Google APIs directly from the frontend
