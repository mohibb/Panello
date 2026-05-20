'use strict';

const request = require('supertest');
const { app, serverReady } = require('../helpers/server');

const suite = serverReady ? describe : describe.skip;

suite('GET /api/weather', () => {
  test('returns 200', async () => {
    const res = await request(app).get('/api/weather');
    expect(res.status).toBe(200);
  });

  test('has required top-level fields', async () => {
    const res = await request(app).get('/api/weather');
    const { body } = res;
    expect(typeof body.temp).toBe('number');
    expect(typeof body.description).toBe('string');
    expect(typeof body.feelsLike).toBe('number');
    expect(typeof body.wind).toBe('number');
    expect(typeof body.rain).toBe('number');
  });

  test('forecast is an array of at least 1 day', async () => {
    const res = await request(app).get('/api/weather');
    expect(Array.isArray(res.body.forecast)).toBe(true);
    expect(res.body.forecast.length).toBeGreaterThanOrEqual(1);
  });

  test('each forecast entry has day, icon, temp', async () => {
    const res = await request(app).get('/api/weather');
    for (const day of res.body.forecast) {
      expect(typeof day.day).toBe('string');
      expect(typeof day.icon).toBe('string');
      expect(typeof day.temp).toBe('number');
    }
  });
});
