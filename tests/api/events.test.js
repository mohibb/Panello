'use strict';

const request = require('supertest');
const { app, serverReady } = require('../helpers/server');

const suite = serverReady ? describe : describe.skip;

suite('GET /api/events', () => {
  const WEEK = '2026-05-18'; // a known Monday

  test('returns 400 when week param is missing', async () => {
    const res = await request(app).get('/api/events');
    expect(res.status).toBe(400);
  });

  test('returns 400 for an invalid week value', async () => {
    const res = await request(app).get('/api/events?week=not-a-date');
    expect(res.status).toBe(400);
  });

  test('returns 200 with an array for a valid Monday', async () => {
    const res = await request(app).get(`/api/events?week=${WEEK}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('each event has required fields', async () => {
    const res = await request(app).get(`/api/events?week=${WEEK}`);
    for (const ev of res.body) {
      expect(typeof ev.date).toBe('string');
      expect(ev.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(typeof ev.time).toBe('string');
      expect(typeof ev.end).toBe('string');
      expect(typeof ev.title).toBe('string');
      expect(typeof ev.person).toBe('string');
    }
  });

  test('all returned events fall within the requested week', async () => {
    const res = await request(app).get(`/api/events?week=${WEEK}`);
    const start = new Date(WEEK);
    const end   = new Date(WEEK);
    end.setDate(end.getDate() + 6);

    for (const ev of res.body) {
      const d = new Date(ev.date);
      expect(d >= start).toBe(true);
      expect(d <= end).toBe(true);
    }
  });
});
