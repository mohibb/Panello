'use strict';

const request = require('supertest');
const { app, serverReady } = require('../helpers/server');

const suite = serverReady ? describe : describe.skip;

suite('GET /api/config', () => {
  test('returns 200', async () => {
    const res = await request(app).get('/api/config');
    expect(res.status).toBe(200);
  });

  test('has familyName string', async () => {
    const res = await request(app).get('/api/config');
    expect(typeof res.body.familyName).toBe('string');
    expect(res.body.familyName.length).toBeGreaterThan(0);
  });

  test('has members array with at least one entry', async () => {
    const res = await request(app).get('/api/config');
    expect(Array.isArray(res.body.members)).toBe(true);
    expect(res.body.members.length).toBeGreaterThan(0);
  });

  test('each member has id, name, color, calendarId', async () => {
    const res = await request(app).get('/api/config');
    for (const m of res.body.members) {
      expect(typeof m.id).toBe('string');
      expect(typeof m.name).toBe('string');
      expect(m.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect('calendarId' in m).toBe(true);
    }
  });
});
