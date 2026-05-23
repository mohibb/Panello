import { describe, test, expect } from 'vitest';
import { env } from 'cloudflare:test';

async function columns(table) {
  const { results } = await env.DB.prepare(`PRAGMA table_info(${table})`).all();
  return results;
}

describe('Database schema', () => {
  // ── tasks ────────────────────────────────────────────────────────────────
  test('tasks table exists', async () => {
    const row = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'"
    ).first();
    expect(row?.name).toBe('tasks');
  });

  test('tasks table has correct columns', async () => {
    const names = (await columns('tasks')).map(c => c.name);
    expect(names).toEqual(expect.arrayContaining(['id', 'title', 'owner', 'done', 'created_at']));
  });

  test("tasks.owner defaults to 'shared'", async () => {
    const col = (await columns('tasks')).find(c => c.name === 'owner');
    expect(col.dflt_value).toBe("'shared'");
  });

  test('tasks.done defaults to 0', async () => {
    const col = (await columns('tasks')).find(c => c.name === 'done');
    expect(col.dflt_value).toBe('0');
  });

  // ── meals ────────────────────────────────────────────────────────────────
  test('meals table exists', async () => {
    const row = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='meals'"
    ).first();
    expect(row?.name).toBe('meals');
  });

  test('meals table has correct columns', async () => {
    const names = (await columns('meals')).map(c => c.name);
    expect(names).toEqual(expect.arrayContaining(['date', 'lunch', 'dinner']));
  });

  test('meals.date is the primary key', async () => {
    const col = (await columns('meals')).find(c => c.name === 'date');
    expect(col.pk).toBe(1);
  });

  // ── users ────────────────────────────────────────────────────────────────
  test('users table exists', async () => {
    const row = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
    ).first();
    expect(row?.name).toBe('users');
  });

  test('users table has correct columns', async () => {
    const names = (await columns('users')).map(c => c.name);
    expect(names).toEqual(expect.arrayContaining(['id', 'email', 'name', 'picture', 'created_at']));
  });

  test('users.id is the primary key', async () => {
    const col = (await columns('users')).find(c => c.name === 'id');
    expect(col.pk).toBe(1);
  });

  // ── calendar_groups ──────────────────────────────────────────────────────
  test('calendar_groups table exists', async () => {
    const row = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='calendar_groups'"
    ).first();
    expect(row?.name).toBe('calendar_groups');
  });

  test('calendar_groups table has correct columns', async () => {
    const names = (await columns('calendar_groups')).map(c => c.name);
    expect(names).toEqual(
      expect.arrayContaining(['id', 'user_id', 'name', 'color', 'sort_order', 'created_at'])
    );
  });

  test("calendar_groups.color defaults to '#3D8EE8'", async () => {
    const col = (await columns('calendar_groups')).find(c => c.name === 'color');
    expect(col.dflt_value).toBe("'#3D8EE8'");
  });

  // ── group_calendars ──────────────────────────────────────────────────────
  test('group_calendars table exists', async () => {
    const row = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='group_calendars'"
    ).first();
    expect(row?.name).toBe('group_calendars');
  });

  test('group_calendars table has correct columns', async () => {
    const names = (await columns('group_calendars')).map(c => c.name);
    expect(names).toEqual(
      expect.arrayContaining(['id', 'group_id', 'calendar_id', 'name'])
    );
  });
});
