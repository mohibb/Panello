import { describe, test, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { onRequestGet } from '../../functions/api/config.js';
import { TEST_USER } from '../helpers/setup.js';

const ctx = () => ({
  request: new Request('http://localhost/api/config'),
  env,
  params: {},
  data: { user: TEST_USER },
});

describe('GET /api/config', () => {
  test('returns 200', async () => {
    const res = await onRequestGet(ctx());
    expect(res.status).toBe(200);
  });

  test('has familyName string', async () => {
    const res = await onRequestGet(ctx());
    const body = await res.json();
    expect(typeof body.familyName).toBe('string');
    expect(body.familyName.length).toBeGreaterThan(0);
  });

  test('has members array', async () => {
    const res = await onRequestGet(ctx());
    const body = await res.json();
    expect(Array.isArray(body.members)).toBe(true);
  });

  test('each member has id, name, color', async () => {
    const res = await onRequestGet(ctx());
    const body = await res.json();
    for (const m of body.members) {
      expect(typeof m.id).toBe('string');
      expect(typeof m.name).toBe('string');
      expect(m.color).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  test('members reflect D1 calendar groups', async () => {
    const res = await onRequestGet(ctx());
    const body = await res.json();
    // Setup creates one test group, so at least 1 member should exist
    expect(body.members.length).toBeGreaterThanOrEqual(1);
  });
});
