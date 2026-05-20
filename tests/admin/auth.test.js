'use strict';

const request = require('supertest');
const { app, serverReady } = require('../helpers/server');

const suite = serverReady ? describe : describe.skip;

suite('Admin auth', () => {
  const PASSWORD = process.env.ADMIN_PASSWORD || 'ci_test_password';

  test('GET /admin returns 401 with no credentials', async () => {
    const res = await request(app).get('/admin');
    expect(res.status).toBe(401);
  });

  test('GET /admin returns 401 with wrong password', async () => {
    const res = await request(app)
      .get('/admin')
      .auth('admin', 'wrong_password');
    expect(res.status).toBe(401);
  });

  test('GET /admin returns 200 with correct password', async () => {
    const res = await request(app)
      .get('/admin')
      .auth('admin', PASSWORD);
    expect(res.status).toBe(200);
  });
});
