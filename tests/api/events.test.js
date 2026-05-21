import { describe, test, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { onRequestGet } from '../../functions/api/events.js';

const WEEK = '2026-05-18';

function get(search = '') {
  return onRequestGet({
    request: new Request(`http://localhost/api/events${search}`),
    env,
    params: {},
  });
}

describe('GET /api/events', () => {
  test('returns 400 when week param is missing', async () => {
    const res = await get();
    expect(res.status).toBe(400);
  });

  test('returns 400 for an invalid week value', async () => {
    const res = await get('?week=not-a-date');
    expect(res.status).toBe(400);
  });

  test('returns 200 with an array for a valid Monday', async () => {
    const res = await get(`?week=${WEEK}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('each event has required fields', async () => {
    const res = await get(`?week=${WEEK}`);
    const body = await res.json();
    for (const ev of body) {
      expect(typeof ev.date).toBe('string');
      expect(ev.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof ev.time).toBe('string');
      expect(typeof ev.end).toBe('string');
      expect(typeof ev.title).toBe('string');
      expect(typeof ev.person).toBe('string');
    }
  });

  test('all returned events fall within the requested week', async () => {
    const res = await get(`?week=${WEEK}`);
    const body = await res.json();
    const start = new Date(WEEK);
    const end = new Date(WEEK);
    end.setDate(end.getDate() + 6);
    for (const ev of body) {
      const d = new Date(ev.date);
      expect(d >= start).toBe(true);
      expect(d <= end).toBe(true);
    }
  });
});
