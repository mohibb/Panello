# Malik Family Dashboard — Project Plan

## Overview

A self-hosted family dashboard, inspired by Skylight, running on a Mac Mini at home. Displays calendar, tasks, meals, and photos on a wall-mounted screen. Built for the Malik family; architecture kept simple and clean enough to scale later if needed.

---

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | Node.js + Express | CommonJS, no TypeScript |
| Database | SQLite (via better-sqlite3) | Tasks, meals, family config |
| Frontend | Vanilla HTML/CSS/JS | No build step, served by Express |
| Hosting | Mac Mini (local network) | `npx pm2 start server.js` |
| Calendar | Google Calendar API (OAuth2) | Proxied server-side |
| Photos | Google Photos API (OAuth2) | Proxied server-side |
| Weather | Yr.no (no auth required) | Cached 30 min |
| Admin | Password-protected Express route | Meal and task management |
| Linting | ESLint v10 (flat config) | `npm run lint` |
| Testing | Jest + Supertest | `npm test` — 40 tests across 8 suites |
| CI | GitHub Actions | Lint → test on every push |

---

## Architecture

```
Mac Mini
├── server.js                   Express app (exports app; auto-starts only when run directly)
├── routes/
│   ├── config.js               GET /api/config
│   ├── events.js               GET /api/events?week=YYYY-MM-DD
│   ├── tasks.js                GET/POST/PATCH/DELETE /api/tasks
│   ├── meals.js                GET/POST /api/meals?week=YYYY-MM-DD
│   ├── weather.js              GET /api/weather
│   └── photos.js               GET /api/photos
├── admin/
│   ├── index.html              Meal + task editor (password-protected)
│   └── admin.js                Admin route handler
├── public/
│   └── index.html              Dashboard frontend (single-page, no framework)
├── db/
│   └── db.js                   SQLite setup + queries
├── data/
│   └── family.db               SQLite database file (gitignored)
├── tests/
│   ├── helpers/server.js       Supertest bootstrap — skips gracefully if server not built
│   ├── api/                    One test file per route (config, events, tasks, meals, weather, photos)
│   ├── db/schema.test.js       DB table and column assertions
│   └── admin/auth.test.js      Basic-auth checks
├── .github/
│   └── workflows/ci.yml        GitHub Actions: npm ci → lint → test (Node 20)
├── eslint.config.js            ESLint v10 flat config
├── .env                        Google credentials, admin password, location
└── .env.example                Template (committed)
```

---

## Settings data model (localStorage)

Calendar groups are configured in the Settings tab and persisted in `localStorage` under the key `panello_settings`. This is the shape the frontend reads and writes:

```json
{
  "groups": [
    {
      "id": "mohibb",
      "name": "Mohibb",
      "color": "#3D8EE8",
      "calendars": [
        { "name": "Mohibb privat", "calId": "" },
        { "name": "Mohibb jobb",   "calId": "" }
      ]
    }
  ]
}
```

In Phase 4, each `calId` maps to a Google Calendar ID. The backend merges all calendars within a group and returns them tagged with the group `id`. The frontend already reads this structure — no frontend changes needed in Phase 4.

---

## API Contract

All endpoints return JSON. Frontend fetches on load and polls every 60 seconds.

### GET /api/config
Returns family identity and member list. Frontend builds legend and person chips from this — nothing is hardcoded in HTML.

```json
{
  "familyName": "Malik",
  "location": "Oslo",
  "members": [
    { "id": "mohibb", "name": "Mohibb", "color": "#3D8EE8", "calendarId": "..." },
    { "id": "saffa",  "name": "Saffa",  "color": "#E8607A", "calendarId": "..." },
    { "id": "jonas",  "name": "Jonas",  "color": "#F0A500", "calendarId": "..." },
    { "id": "noah",   "name": "Noah",   "color": "#48B368", "calendarId": "..." },
    { "id": "family", "name": "Family", "color": "#8B6FD4", "calendarId": "..." }
  ]
}
```

### GET /api/events?week=2026-05-18
Returns all events for the week starting on the given Monday. Returns 400 if `week` is missing or not a valid date.

```json
[
  {
    "date": "2026-05-20",
    "time": "08:30",
    "end": "09:00",
    "title": "Standmøte",
    "person": "mohibb"
  }
]
```

### GET /api/tasks
Returns all tasks.

```json
[
  { "id": 1, "title": "Kjøp bursdagsgave til Amina", "owner": "shared", "done": false },
  { "id": 2, "title": "Sjekk strømavtale", "owner": "mohibb", "done": false }
]
```

### PATCH /api/tasks/:id
Toggle done state. Body: `{ "done": true }`. Returns 404 for unknown id.

### POST /api/tasks
Add a task. Body: `{ "title": "...", "owner": "shared|mohibb|saffa|..." }`. Returns 201 on success, 400 if title missing.

### DELETE /api/tasks/:id
Delete a task. Returns 404 for unknown id.

### GET /api/meals?week=2026-05-18
Returns meal plan for the week. Returns 400 if `week` is missing.

```json
[
  { "date": "2026-05-18", "lunch": "Rester fra helgen", "dinner": "Pasta bolognese" },
  { "date": "2026-05-20", "lunch": null, "dinner": "Taco" }
]
```

### POST /api/meals
Upsert a meal entry. Body: `{ "date": "2026-05-20", "lunch": "...", "dinner": "..." }`. Returns 400 if date missing.

### GET /api/weather
Returns current weather and 4-day forecast from Yr.no. Cached 30 min server-side.

```json
{
  "temp": 14,
  "description": "Partly cloudy",
  "feelsLike": 11,
  "wind": 5,
  "rain": 10,
  "forecast": [
    { "day": "Thu", "icon": "🌧", "temp": 11 },
    { "day": "Fri", "icon": "⛅", "temp": 15 }
  ]
}
```

### GET /api/photos
Returns a list of photo URLs from a Google Photos album. Cached 1 hour.

```json
[
  { "url": "https://...", "caption": "Sørmarka · Aug 2024" }
]
```

---

## Database Schema (SQLite)

```sql
CREATE TABLE tasks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL,
  owner      TEXT    NOT NULL DEFAULT 'shared',
  done       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    DEFAULT (datetime('now'))
);

CREATE TABLE meals (
  date   TEXT PRIMARY KEY,   -- ISO date: 2026-05-20
  lunch  TEXT,
  dinner TEXT
);
```

Family config (members, colors, calendar IDs) lives in `.env` or a `config.json` — not in the DB.

---

## Frontend

Single file: `public/index.html`. No build step.

**Tabs:**
- **Calendar** (default) — time-based grid 06:00–00:00, events positioned absolutely, red now-line, prev/next week navigation
- **Tasks** — shared section + individual sections per person
- **Meals** — weekly grid, lunch + dinner per day
- **Photos** — mosaic layout, Google Photos album
- **Settings** — calendar group editor (name, color, sub-calendars with Google Calendar ID fields)

**On load:**
1. Read `panello_settings` from localStorage → build `MEMBERS` and `COLORS` maps
2. Fetch `/api/config` → update legend and person chips
3. Fetch `/api/events`, `/api/tasks`, `/api/meals`, `/api/weather`, `/api/photos`
4. Render all tabs
5. Start 60s poll loop

**No hardcoded names, colors, or calendar data in the HTML.**

---

## Admin Page

Route: `/admin` — basic-auth protected (`ADMIN_PASSWORD` env var).

Features:
- View / add / delete tasks (all owners)
- Edit meal plan (week view, editable fields)
- No calendar editing (managed via Google Calendar app)

---

## Build Phases

### Phase 1 — Frontend mockup ✅
Static HTML with hardcoded mock data. All 5 tabs working (Calendar, Tasks, Meals, Photos, Settings). Skylight-inspired design. Time-based calendar grid (06:00–00:00), scales to fill page. Prev/next week navigation. Weather widget in header. Settings tab allows configuring calendar groups (name, color, list of Google Calendar IDs per group) — stored in localStorage and reflected live on the calendar.

### Phase 2 — Backend scaffold
- `npm init` complete; all dependencies installed
- Express server (`server.js`) exporting the `app` for testability
- Static file serving (`public/`)
- All API routes stubbed, returning mock JSON
- SQLite connected, schema created (`db/db.js`)
- `.env` / `config.json` for family members
- Frontend updated to fetch from API (no hardcoded data)
- Admin page with basic auth
- All 40 CI tests passing

### Phase 3 — Live data: Weather + Tasks + Meals
- Yr.no weather integration (no auth needed)
- Tasks fully CRUD via API + admin page
- Meals fully CRUD via API + admin page
- Frontend polling live

### Phase 4 — Google Calendar
- Google Cloud project setup
- OAuth2 credentials for each family member's calendar
- Token storage in `.env` or local file
- `/api/events` proxy — reads `calId` per group from config, merges calendars, returns events tagged with group `id`
- Frontend consuming live events (no frontend changes needed — already reads group ids)

### Phase 5 — Google Photos
- Google Photos API integration
- Album selection per family
- Photo URLs cached server-side
- Slideshow on Photos tab

### Phase 6 — Polish
- Sleep mode (screen off at configurable time)
- Auto-restart on Mac Mini boot (pm2)
- Error states in frontend (loading, offline)
- Smooth photo transitions on home screensaver

---

## Environment Variables (.env)

```
PORT=3000
ADMIN_PASSWORD=...
DATABASE_PATH=data/family.db

# Family config
FAMILY_NAME=Malik
LOCATION_LAT=59.9139
LOCATION_LON=10.7522

# Google OAuth
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback

# Calendar IDs (one per group — or list multiple comma-separated for Phase 4)
CAL_MOHIBB=...
CAL_SAFFA=...
CAL_FAMILY=...

# Google Photos album
PHOTOS_ALBUM_ID=...
```

---

## Future Scaling Notes (if needed later)

If this grows into a product for multiple families:
- Move backend to cloud (Railway, Fly.io, or Vercel)
- Replace SQLite with Postgres (Supabase or Neon)
- Add proper auth (Clerk or Supabase Auth)
- Each family identified by `familyId` — all API routes become `/api/{familyId}/...`
- Frontend stays identical — just reads `familyId` from URL or cookie
- Google OAuth verification required for public app

The current architecture is intentionally simple but clean enough that this migration is additive, not a rewrite.
