import { describe, test, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { onRequestGet } from '../../functions/api/events.js';
import { transformEvents } from '../../functions/lib/google-calendar.js';
import { TEST_USER } from '../helpers/setup.js';

const WEEK = '2026-05-18';

function get(search = '') {
  return onRequestGet({
    request: new Request(`http://localhost/api/events${search}`),
    env,
    params: {},
    data: { user: TEST_USER },
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

  test('returns 200 with an empty array when no tokens are stored', async () => {
    const res = await get(`?week=${WEEK}`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(0);
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
});

describe('transformEvents', () => {
  const GOOGLE_ITEMS = [
    {
      status: 'confirmed',
      summary: 'Standmøte',
      start: { dateTime: '2026-05-20T08:30:00+02:00' },
      end:   { dateTime: '2026-05-20T09:00:00+02:00' },
    },
    {
      status: 'confirmed',
      summary: 'Familiemiddag',
      start: { date: '2026-05-21' },
      end:   { date: '2026-05-22' },
    },
    {
      status: 'cancelled',
      summary: 'Avlyst',
      start: { dateTime: '2026-05-20T10:00:00+02:00' },
      end:   { dateTime: '2026-05-20T11:00:00+02:00' },
    },
  ];

  test('maps timed events correctly', () => {
    const events = transformEvents(GOOGLE_ITEMS, '1');
    const timed = events.find(e => e.title === 'Standmøte');
    expect(timed).toBeDefined();
    expect(timed.date).toBe('2026-05-20');
    expect(timed.time).toBe('08:30');
    expect(timed.end).toBe('09:00');
    expect(timed.person).toBe('1');
  });

  test('maps all-day events correctly', () => {
    const events = transformEvents(GOOGLE_ITEMS, '2');
    const allDay = events.find(e => e.title === 'Familiemiddag');
    expect(allDay).toBeDefined();
    expect(allDay.date).toBe('2026-05-21');
    expect(allDay.time).toBe('');
    expect(allDay.end).toBe('');
    expect(allDay.allDay).toBe(true);
  });

  test('drops cancelled events', () => {
    const events = transformEvents(GOOGLE_ITEMS, '1');
    expect(events.find(e => e.title === 'Avlyst')).toBeUndefined();
  });

  test('handles empty and undefined items', () => {
    expect(transformEvents([], '1')).toEqual([]);
    expect(transformEvents(undefined, '1')).toEqual([]);
  });
});
