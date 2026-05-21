CREATE TABLE IF NOT EXISTS tasks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT    NOT NULL,
  owner      TEXT    NOT NULL DEFAULT 'shared',
  done       INTEGER NOT NULL DEFAULT 0,
  created_at TEXT             DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS meals (
  date   TEXT PRIMARY KEY,
  lunch  TEXT,
  dinner TEXT
);
