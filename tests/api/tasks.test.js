import { describe, test, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { onRequestGet, onRequestPost } from '../../functions/api/tasks.js';
import { onRequestPatch, onRequestDelete } from '../../functions/api/tasks/[id].js';
import { TEST_USER } from '../helpers/setup.js';

const DATA = { user: TEST_USER };

function json(method, body) {
  return new Request('http://localhost/api/tasks', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Tasks API', () => {
  let createdId;

  test('GET /api/tasks returns 200 with an array', async () => {
    const res = await onRequestGet({ request: new Request('http://localhost/api/tasks'), env, data: DATA });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('each task has id, title, owner, done fields', async () => {
    await onRequestPost({ request: json('POST', { title: 'Probe task', owner: 'shared' }), env, data: DATA });
    const res = await onRequestGet({ request: new Request('http://localhost/api/tasks'), env, data: DATA });
    const body = await res.json();
    for (const t of body) {
      expect(typeof t.id).toBe('number');
      expect(typeof t.title).toBe('string');
      expect(typeof t.owner).toBe('string');
      expect(typeof t.done).toBe('boolean');
    }
  });

  test('POST /api/tasks creates a task and returns 201', async () => {
    const res = await onRequestPost({
      request: json('POST', { title: 'CI test task', owner: 'mohibb' }),
      env,
      data: DATA,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.title).toBe('CI test task');
    expect(body.owner).toBe('mohibb');
    expect(body.done).toBe(false);
    expect(typeof body.id).toBe('number');
    createdId = body.id;
  });

  test('POST /api/tasks returns 400 when title is missing', async () => {
    const res = await onRequestPost({ request: json('POST', { owner: 'shared' }), env, data: DATA });
    expect(res.status).toBe(400);
  });

  test('PATCH /api/tasks/:id toggles done state', async () => {
    const res = await onRequestPatch({
      request: new Request(`http://localhost/api/tasks/${createdId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: true }),
      }),
      env,
      params: { id: String(createdId) },
      data: DATA,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.done).toBe(true);
  });

  test('PATCH /api/tasks/:id returns 404 for unknown id', async () => {
    const res = await onRequestPatch({
      request: new Request('http://localhost/api/tasks/999999', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done: true }),
      }),
      env,
      params: { id: '999999' },
      data: DATA,
    });
    expect(res.status).toBe(404);
  });

  test('DELETE /api/tasks/:id removes the task', async () => {
    const del = await onRequestDelete({
      request: new Request(`http://localhost/api/tasks/${createdId}`, { method: 'DELETE' }),
      env,
      params: { id: String(createdId) },
      data: DATA,
    });
    expect(del.status).toBe(200);

    const list = await onRequestGet({ request: new Request('http://localhost/api/tasks'), env, data: DATA });
    const body = await list.json();
    expect(body.map(t => t.id)).not.toContain(createdId);
  });

  test('DELETE /api/tasks/:id returns 404 for unknown id', async () => {
    const res = await onRequestDelete({
      request: new Request('http://localhost/api/tasks/999999', { method: 'DELETE' }),
      env,
      params: { id: '999999' },
      data: DATA,
    });
    expect(res.status).toBe(404);
  });
});
