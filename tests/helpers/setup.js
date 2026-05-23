import { beforeAll } from 'vitest';
import { env } from 'cloudflare:test';

export const TEST_USER = {
  userId: 'test-user-sub-123',
  email: 'test@example.com',
  name: 'Test User',
};

export let TEST_GROUP_ID = null;

beforeAll(async () => {
  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS tasks (
       id         INTEGER PRIMARY KEY AUTOINCREMENT,
       title      TEXT    NOT NULL,
       owner      TEXT    NOT NULL DEFAULT 'shared',
       done       INTEGER NOT NULL DEFAULT 0,
       created_at TEXT             DEFAULT (datetime('now'))
     )`
  ).run();

  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS meals (
       date   TEXT PRIMARY KEY,
       lunch  TEXT,
       dinner TEXT
     )`
  ).run();

  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS users (
       id         TEXT PRIMARY KEY,
       email      TEXT NOT NULL UNIQUE,
       name       TEXT,
       picture    TEXT,
       created_at TEXT DEFAULT (datetime('now'))
     )`
  ).run();

  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS calendar_groups (
       id         INTEGER PRIMARY KEY AUTOINCREMENT,
       user_id    TEXT    NOT NULL,
       name       TEXT    NOT NULL,
       color      TEXT    NOT NULL DEFAULT '#3D8EE8',
       sort_order INTEGER NOT NULL DEFAULT 0,
       created_at TEXT    DEFAULT (datetime('now'))
     )`
  ).run();

  await env.DB.prepare(
    `CREATE TABLE IF NOT EXISTS group_calendars (
       id          INTEGER PRIMARY KEY AUTOINCREMENT,
       group_id    INTEGER NOT NULL,
       calendar_id TEXT    NOT NULL,
       name        TEXT    NOT NULL,
       UNIQUE(group_id, calendar_id)
     )`
  ).run();

  await env.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)`
  ).bind(TEST_USER.userId, TEST_USER.email, TEST_USER.name).run();

  const group = await env.DB.prepare(
    `INSERT INTO calendar_groups (user_id, name, color, sort_order) VALUES (?, ?, ?, ?) RETURNING id`
  ).bind(TEST_USER.userId, 'Test Group', '#3D8EE8', 0).first();
  TEST_GROUP_ID = group.id;
});
