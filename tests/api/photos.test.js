import { describe, test, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { onRequestGet } from '../../functions/api/photos.js';
import { TEST_USER } from '../helpers/setup.js';

const DATA = { user: TEST_USER };

describe('GET /api/photos', () => {
  test('returns 200', async () => {
    const res = await onRequestGet({ request: new Request('http://localhost/api/photos'), env, data: DATA });
    expect(res.status).toBe(200);
  });

  test('returns an array', async () => {
    const res = await onRequestGet({ request: new Request('http://localhost/api/photos'), env, data: DATA });
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('each photo has url and caption', async () => {
    const res = await onRequestGet({ request: new Request('http://localhost/api/photos'), env, data: DATA });
    const body = await res.json();
    for (const p of body) {
      expect(typeof p.url).toBe('string');
      expect(typeof p.caption).toBe('string');
    }
  });
});
