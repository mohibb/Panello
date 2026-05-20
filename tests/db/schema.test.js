'use strict';

// Test the DB module directly — independent of whether the HTTP server is built.
let db;
let dbReady = false;

try {
  // Set in-memory path before loading db module
  process.env.DATABASE_PATH = ':memory:';
  db      = require('../../db/db');
  dbReady = true;
} catch {
  // db/db.js not built yet (Phase 2)
}

const suite = dbReady ? describe : describe.skip;

suite('Database schema', () => {
  test('tasks table exists', () => {
    const row = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'"
    ).get();
    expect(row).toBeDefined();
    expect(row.name).toBe('tasks');
  });

  test('tasks table has correct columns', () => {
    const cols = db.prepare('PRAGMA table_info(tasks)').all();
    const names = cols.map(c => c.name);
    expect(names).toEqual(expect.arrayContaining(['id', 'title', 'owner', 'done', 'created_at']));
  });

  test('tasks.owner defaults to shared', () => {
    const col = db.prepare('PRAGMA table_info(tasks)').all().find(c => c.name === 'owner');
    expect(col.dflt_value).toBe("'shared'");
  });

  test('tasks.done defaults to 0', () => {
    const col = db.prepare('PRAGMA table_info(tasks)').all().find(c => c.name === 'done');
    expect(col.dflt_value).toBe('0');
  });

  test('meals table exists', () => {
    const row = db.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='meals'"
    ).get();
    expect(row).toBeDefined();
    expect(row.name).toBe('meals');
  });

  test('meals table has correct columns', () => {
    const cols = db.prepare('PRAGMA table_info(meals)').all();
    const names = cols.map(c => c.name);
    expect(names).toEqual(expect.arrayContaining(['date', 'lunch', 'dinner']));
  });

  test('meals.date is the primary key', () => {
    const col = db.prepare('PRAGMA table_info(meals)').all().find(c => c.name === 'date');
    expect(col.pk).toBe(1);
  });
});
