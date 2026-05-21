import { describe, test, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { onRequest } from '../../functions/admin/_middleware.js';
import { onRequestGet } from '../../functions/admin/index.js';

const PASSWORD = 'ci_test_password';

function makeCtx(authHeader) {
  const headers = new Headers();
  if (authHeader) headers.set('Authorization', authHeader);
  const request = new Request('http://localhost/admin', { headers });
  const next = () => onRequestGet({ request, env });
  return { request, env, next };
}

describe('Admin auth', () => {
  test('GET /admin returns 401 with no credentials', async () => {
    const res = await onRequest(makeCtx(null));
    expect(res.status).toBe(401);
  });

  test('GET /admin returns 401 with wrong password', async () => {
    const res = await onRequest(makeCtx('Basic ' + btoa('admin:wrong_password')));
    expect(res.status).toBe(401);
  });

  test('GET /admin returns 200 with correct password', async () => {
    const res = await onRequest(makeCtx('Basic ' + btoa(`admin:${PASSWORD}`)));
    expect(res.status).toBe(200);
  });
});
