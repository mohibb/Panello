import { describe, test, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { onRequestGet } from '../../functions/api/calendar-status.js';

function makeRequest(password = 'ci_test_password') {
  const creds = btoa(`admin:${password}`);
  return new Request('http://localhost/api/calendar-status', {
    headers: { Authorization: `Basic ${creds}` },
  });
}

describe('GET /api/calendar-status', () => {
  test('returns 401 without credentials', async () => {
    const res = await onRequestGet({
      request: new Request('http://localhost/api/calendar-status'),
      env,
    });
    expect(res.status).toBe(401);
  });

  test('returns 401 with wrong password', async () => {
    const res = await onRequestGet({ request: makeRequest('wrong'), env });
    expect(res.status).toBe(401);
  });

  test('returns 200 with array of member status objects', async () => {
    const res = await onRequestGet({ request: makeRequest(), env });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThan(0);
  });

  test('each entry has member, authorized, calendarConfigured fields', async () => {
    const res = await onRequestGet({ request: makeRequest(), env });
    const body = await res.json();
    for (const item of body) {
      expect(typeof item.member).toBe('string');
      expect(typeof item.authorized).toBe('boolean');
      expect(typeof item.calendarConfigured).toBe('boolean');
    }
  });

  test('authorized is false when no token in KV', async () => {
    const res = await onRequestGet({ request: makeRequest(), env });
    const body = await res.json();
    for (const item of body) {
      expect(item.authorized).toBe(false);
    }
  });
});
