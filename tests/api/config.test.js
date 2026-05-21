import { describe, test, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { onRequestGet } from '../../functions/api/config.js';

const ctx = (url) => ({ request: new Request(url), env, params: {} });

describe('GET /api/config', () => {
  test('returns 200', async () => {
    const res = await onRequestGet(ctx('http://localhost/api/config'));
    expect(res.status).toBe(200);
  });

  test('has familyName string', async () => {
    const res = await onRequestGet(ctx('http://localhost/api/config'));
    const body = await res.json();
    expect(typeof body.familyName).toBe('string');
    expect(body.familyName.length).toBeGreaterThan(0);
  });

  test('has members array with at least one entry', async () => {
    const res = await onRequestGet(ctx('http://localhost/api/config'));
    const body = await res.json();
    expect(Array.isArray(body.members)).toBe(true);
    expect(body.members.length).toBeGreaterThan(0);
  });

  test('each member has id, name, color, calendarId', async () => {
    const res = await onRequestGet(ctx('http://localhost/api/config'));
    const body = await res.json();
    for (const m of body.members) {
      expect(typeof m.id).toBe('string');
      expect(typeof m.name).toBe('string');
      expect(m.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect('calendarId' in m).toBe(true);
    }
  });
});
