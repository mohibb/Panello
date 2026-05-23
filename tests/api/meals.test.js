import { describe, test, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { onRequestGet, onRequestPost } from '../../functions/api/meals.js';
import { TEST_USER } from '../helpers/setup.js';

const DATA = { user: TEST_USER };
const WEEK = '2026-05-18';

function getWeek(week) {
  const url = week ? `http://localhost/api/meals?week=${week}` : 'http://localhost/api/meals';
  return onRequestGet({ request: new Request(url), env, data: DATA });
}

function postMeal(body) {
  return onRequestPost({
    request: new Request('http://localhost/api/meals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
    env,
    data: DATA,
  });
}

describe('Meals API', () => {
  test('GET /api/meals returns 400 when week param is missing', async () => {
    const res = await getWeek(null);
    expect(res.status).toBe(400);
  });

  test('GET /api/meals?week returns 200 with an array', async () => {
    const res = await getWeek(WEEK);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('each meal entry has date, lunch, dinner fields', async () => {
    const res = await getWeek(WEEK);
    const body = await res.json();
    for (const m of body) {
      expect(typeof m.date).toBe('string');
      expect(m.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect('lunch'  in m).toBe(true);
      expect('dinner' in m).toBe(true);
    }
  });

  test('POST /api/meals upserts and returns 200', async () => {
    const res = await postMeal({ date: '2026-05-20', lunch: 'Salat', dinner: 'Laks' });
    expect(res.status).toBe(200);
  });

  test('POST /api/meals persists the upserted row', async () => {
    await postMeal({ date: '2026-05-21', lunch: null, dinner: 'Taco' });
    const res  = await getWeek(WEEK);
    const body = await res.json();
    const row  = body.find(m => m.date === '2026-05-21');
    expect(row).toBeDefined();
    expect(row.dinner).toBe('Taco');
  });

  test('POST /api/meals returns 400 when date is missing', async () => {
    const res = await postMeal({ dinner: 'Pizza' });
    expect(res.status).toBe(400);
  });
});
