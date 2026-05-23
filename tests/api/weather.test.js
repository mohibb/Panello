import { describe, test, expect, beforeAll } from 'vitest';
import { env } from 'cloudflare:test';
import { onRequestGet } from '../../functions/api/weather.js';
import { TEST_USER } from '../helpers/setup.js';

const DATA = { user: TEST_USER };

const MOCK_WEATHER = {
  temp: 14,
  description: 'Partly cloudy day',
  feelsLike: 11,
  wind: 5,
  rain: 0.2,
  forecast: [
    { day: 'Thu', icon: '⛅', temp: 12 },
    { day: 'Fri', icon: '🌧', temp: 10 },
    { day: 'Sat', icon: '☀️', temp: 16 },
    { day: 'Sun', icon: '☁️', temp: 13 },
  ],
};

describe('GET /api/weather', () => {
  beforeAll(async () => {
    await env.CACHE.put('weather', JSON.stringify(MOCK_WEATHER));
  });

  test('returns 200', async () => {
    const res = await onRequestGet({ request: new Request('http://localhost/api/weather'), env, data: DATA });
    expect(res.status).toBe(200);
  });

  test('has required top-level fields', async () => {
    const res = await onRequestGet({ request: new Request('http://localhost/api/weather'), env, data: DATA });
    const body = await res.json();
    expect(typeof body.temp).toBe('number');
    expect(typeof body.description).toBe('string');
    expect(typeof body.feelsLike).toBe('number');
    expect(typeof body.wind).toBe('number');
    expect(typeof body.rain).toBe('number');
  });

  test('forecast is an array of at least 1 day', async () => {
    const res = await onRequestGet({ request: new Request('http://localhost/api/weather'), env, data: DATA });
    const body = await res.json();
    expect(Array.isArray(body.forecast)).toBe(true);
    expect(body.forecast.length).toBeGreaterThanOrEqual(1);
  });

  test('each forecast entry has day, icon, temp', async () => {
    const res = await onRequestGet({ request: new Request('http://localhost/api/weather'), env, data: DATA });
    const body = await res.json();
    for (const day of body.forecast) {
      expect(typeof day.day).toBe('string');
      expect(typeof day.icon).toBe('string');
      expect(typeof day.temp).toBe('number');
    }
  });
});
