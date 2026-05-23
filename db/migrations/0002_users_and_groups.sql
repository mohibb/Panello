CREATE TABLE users (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT,
  picture    TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE calendar_groups (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    TEXT    NOT NULL,
  name       TEXT    NOT NULL,
  color      TEXT    NOT NULL DEFAULT '#3D8EE8',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE group_calendars (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  group_id    INTEGER NOT NULL,
  calendar_id TEXT    NOT NULL,
  name        TEXT    NOT NULL,
  UNIQUE(group_id, calendar_id),
  FOREIGN KEY (group_id) REFERENCES calendar_groups(id) ON DELETE CASCADE
);
