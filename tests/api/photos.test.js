'use strict';

const request = require('supertest');
const { app, serverReady } = require('../helpers/server');

const suite = serverReady ? describe : describe.skip;

suite('GET /api/photos', () => {
  test('returns 200', async () => {
    const res = await request(app).get('/api/photos');
    expect(res.status).toBe(200);
  });

  test('returns an array', async () => {
    const res = await request(app).get('/api/photos');
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('each photo has url and caption', async () => {
    const res = await request(app).get('/api/photos');
    for (const p of res.body) {
      expect(typeof p.url).toBe('string');
      expect(typeof p.caption).toBe('string');
    }
  });
});
