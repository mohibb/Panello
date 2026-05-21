import { describe, test, expect } from 'vitest';
import { env } from 'cloudflare:test';

describe('Database schema', () => {
  test('tasks table exists', async () => {
    const row = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='tasks'"
    ).first();
    expect(row).toBeDefined();
    expect(row.name).toBe('tasks');
  });

  test('tasks table has correct columns', async () => {
    const { results } = await env.DB.prepare('PRAGMA table_info(tasks)').all();
    const names = results.map(c => c.name);
    expect(names).toEqual(expect.arrayContaining(['id', 'title', 'owner', 'done', 'created_at']));
  });

  test("tasks.owner defaults to 'shared'", async () => {
    const { results } = await env.DB.prepare('PRAGMA table_info(tasks)').all();
    const col = results.find(c => c.name === 'owner');
    expect(col.dflt_value).toBe("'shared'");
  });

  test('tasks.done defaults to 0', async () => {
    const { results } = await env.DB.prepare('PRAGMA table_info(tasks)').all();
    const col = results.find(c => c.name === 'done');
    expect(col.dflt_value).toBe('0');
  });

  test('meals table exists', async () => {
    const row = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name='meals'"
    ).first();
    expect(row).toBeDefined();
    expect(row.name).toBe('meals');
  });

  test('meals table has correct columns', async () => {
    const { results } = await env.DB.prepare('PRAGMA table_info(meals)').all();
    const names = results.map(c => c.name);
    expect(names).toEqual(expect.arrayContaining(['date', 'lunch', 'dinner']));
  });

  test('meals.date is the primary key', async () => {
    const { results } = await env.DB.prepare('PRAGMA table_info(meals)').all();
    const col = results.find(c => c.name === 'date');
    expect(col.pk).toBe(1);
  });
});
