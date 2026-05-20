'use strict';

const request = require('supertest');
const { app, serverReady } = require('../helpers/server');

const suite = serverReady ? describe : describe.skip;

suite('Meals API', () => {
  const WEEK = '2026-05-18';

  test('GET /api/meals returns 400 when week param is missing', async () => {
    const res = await request(app).get('/api/meals');
    expect(res.status).toBe(400);
  });

  test('GET /api/meals?week returns 200 with an array', async () => {
    const res = await request(app).get(`/api/meals?week=${WEEK}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('each meal entry has date, lunch, dinner fields', async () => {
    const res = await request(app).get(`/api/meals?week=${WEEK}`);
    for (const m of res.body) {
      expect(typeof m.date).toBe('string');
      expect(m.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect('lunch'  in m).toBe(true);
      expect('dinner' in m).toBe(true);
    }
  });

  test('POST /api/meals upserts and returns 200', async () => {
    const res = await request(app)
      .post('/api/meals')
      .send({ date: '2026-05-20', lunch: 'Salat', dinner: 'Laks' });
    expect(res.status).toBe(200);
  });

  test('POST /api/meals persists the upserted row', async () => {
    await request(app)
      .post('/api/meals')
      .send({ date: '2026-05-21', lunch: null, dinner: 'Taco' });

    const res  = await request(app).get(`/api/meals?week=${WEEK}`);
    const row  = res.body.find(m => m.date === '2026-05-21');
    expect(row).toBeDefined();
    expect(row.dinner).toBe('Taco');
  });

  test('POST /api/meals returns 400 when date is missing', async () => {
    const res = await request(app).post('/api/meals').send({ dinner: 'Pizza' });
    expect(res.status).toBe(400);
  });
});
