'use strict';

const request = require('supertest');
const { app, serverReady } = require('../helpers/server');

const suite = serverReady ? describe : describe.skip;

suite('Tasks API', () => {
  let createdId;

  test('GET /api/tasks returns 200 with an array', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('each task has id, title, owner, done fields', async () => {
    // Seed one task first so the list is non-empty
    await request(app).post('/api/tasks').send({ title: 'Probe task', owner: 'shared' });
    const res = await request(app).get('/api/tasks');
    for (const t of res.body) {
      expect(typeof t.id).toBe('number');
      expect(typeof t.title).toBe('string');
      expect(typeof t.owner).toBe('string');
      expect(typeof t.done).toBe('boolean');
    }
  });

  test('POST /api/tasks creates a task and returns 201', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'CI test task', owner: 'mohibb' });
    expect(res.status).toBe(201);
    expect(res.body.title).toBe('CI test task');
    expect(res.body.owner).toBe('mohibb');
    expect(res.body.done).toBe(false);
    expect(typeof res.body.id).toBe('number');
    createdId = res.body.id;
  });

  test('POST /api/tasks returns 400 when title is missing', async () => {
    const res = await request(app).post('/api/tasks').send({ owner: 'shared' });
    expect(res.status).toBe(400);
  });

  test('PATCH /api/tasks/:id toggles done state', async () => {
    const res = await request(app)
      .patch(`/api/tasks/${createdId}`)
      .send({ done: true });
    expect(res.status).toBe(200);
    expect(res.body.done).toBe(true);
  });

  test('PATCH /api/tasks/:id returns 404 for unknown id', async () => {
    const res = await request(app).patch('/api/tasks/999999').send({ done: true });
    expect(res.status).toBe(404);
  });

  test('DELETE /api/tasks/:id removes the task', async () => {
    const del = await request(app).delete(`/api/tasks/${createdId}`);
    expect(del.status).toBe(200);

    const list = await request(app).get('/api/tasks');
    const ids = list.body.map(t => t.id);
    expect(ids).not.toContain(createdId);
  });

  test('DELETE /api/tasks/:id returns 404 for unknown id', async () => {
    const res = await request(app).delete('/api/tasks/999999');
    expect(res.status).toBe(404);
  });
});
