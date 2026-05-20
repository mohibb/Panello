# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A self-hosted family dashboard (Malik family) running on a Mac Mini, displayed on a wall-mounted screen. Inspired by Skylight. See `PROJECT_PLAN.md` for full architecture, API contract, DB schema, and phased build plan.

**Current state:** Phase 1 complete (static frontend mockup). Phase 2 is the backend scaffold.

---

## Running the project

```bash
npm install
node server.js
# or with auto-restart:
npx pm2 start server.js --name family-dashboard
```

Dashboard: `http://localhost:3000`
Admin page: `http://localhost:3000/admin`

No build step — frontend is plain HTML/CSS/JS served by Express.

---

## Architecture

```
server.js               Express entry point
routes/                 One file per API resource
admin/index.html        Meal + task editor (basic-auth protected)
public/index.html       The dashboard (single-page, no framework)
db/db.js                SQLite setup and queries (better-sqlite3)
data/family.db          SQLite database file
.env                    Secrets and family config
```

### Request flow

The frontend fetches `/api/config` on load to get member list and colors — nothing about family members is hardcoded in HTML. It then fetches all other endpoints and starts a 60-second poll loop.

Backend routes proxy Google Calendar and Google Photos server-side; the frontend never calls Google APIs directly. Weather (Yr.no) and photo responses are cached in memory (30 min and 1 hr respectively).

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

### Database (SQLite via better-sqlite3)

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

Family config (members, colors, calendar IDs) lives in `.env` / `config.json`, not the DB.

---

## Coding conventions

- **Node.js CommonJS** (`require`), not ESM
- **No TypeScript**, no frontend framework — vanilla HTML/CSS/JS only
- **better-sqlite3** — synchronous API throughout
- **In-memory cache** objects for weather and photos — no Redis
- `/admin` protected by basic-auth Express middleware using `ADMIN_PASSWORD` from `.env`

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

## Environment variables

```
PORT=3000
ADMIN_PASSWORD=
FAMILY_NAME=Malik
LOCATION_LAT=59.9139
LOCATION_LON=10.7522
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/callback
CAL_MOHIBB=
CAL_SAFFA=
CAL_FAMILY=
PHOTOS_ALBUM_ID=
```

---

## Hard constraints

- Do not add a frontend framework (React, Vue, etc.)
- Do not add a cloud database — SQLite is sufficient for this use case
- Do not add auth to the dashboard itself — it's a local-network wall display
- Do not hardcode family member names or colors in frontend HTML
- Do not call Google APIs directly from the frontend
