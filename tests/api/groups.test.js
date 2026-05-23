import { describe, test, expect } from 'vitest';
import { env } from 'cloudflare:test';
import { onRequestGet, onRequestPost } from '../../functions/api/groups.js';
import { onRequestPatch, onRequestDelete } from '../../functions/api/groups/[id].js';
import { onRequestPost as addCalendar } from '../../functions/api/groups/[id]/calendars.js';
import { onRequestDelete as removeCalendar } from '../../functions/api/groups/[id]/calendars/[calId].js';
import { TEST_USER } from '../helpers/setup.js';

const DATA = { user: TEST_USER };

function jsonReq(url, method, body) {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('Groups API', () => {
  let groupId;
  let calRowId;

  test('GET /api/groups returns 200 with array', async () => {
    const res = await onRequestGet({ request: new Request('http://localhost/api/groups'), env, data: DATA });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });

  test('each group has id, name, color, calendars', async () => {
    const res = await onRequestGet({ request: new Request('http://localhost/api/groups'), env, data: DATA });
    const body = await res.json();
    for (const g of body) {
      expect(typeof g.id).toBe('number');
      expect(typeof g.name).toBe('string');
      expect(g.color).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(Array.isArray(g.calendars)).toBe(true);
    }
  });

  test('POST /api/groups creates a group and returns 201', async () => {
    const res = await onRequestPost({
      request: jsonReq('http://localhost/api/groups', 'POST', { name: 'Work', color: '#FF5733' }),
      env,
      data: DATA,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.name).toBe('Work');
    expect(body.color).toBe('#FF5733');
    expect(Array.isArray(body.calendars)).toBe(true);
    groupId = body.id;
  });

  test('POST /api/groups returns 400 when name is missing', async () => {
    const res = await onRequestPost({
      request: jsonReq('http://localhost/api/groups', 'POST', { color: '#FF5733' }),
      env,
      data: DATA,
    });
    expect(res.status).toBe(400);
  });

  test('PATCH /api/groups/:id updates name and color', async () => {
    const res = await onRequestPatch({
      request: jsonReq(`http://localhost/api/groups/${groupId}`, 'PATCH', { name: 'Work Updated' }),
      env,
      params: { id: String(groupId) },
      data: DATA,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.name).toBe('Work Updated');
  });

  test('PATCH /api/groups/:id returns 404 for wrong user', async () => {
    const otherUser = { user: { userId: 'other-user', email: 'other@example.com', name: 'Other' } };
    const res = await onRequestPatch({
      request: jsonReq(`http://localhost/api/groups/${groupId}`, 'PATCH', { name: 'Hack' }),
      env,
      params: { id: String(groupId) },
      data: otherUser,
    });
    expect(res.status).toBe(404);
  });

  test('POST /api/groups/:id/calendars adds a calendar', async () => {
    const res = await addCalendar({
      request: jsonReq(`http://localhost/api/groups/${groupId}/calendars`, 'POST', {
        calendar_id: 'test@group.calendar.google.com',
        name: 'Test Calendar',
      }),
      env,
      params: { id: String(groupId) },
      data: DATA,
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.calendar_id).toBe('test@group.calendar.google.com');
    expect(body.name).toBe('Test Calendar');
    calRowId = body.id;
  });

  test('POST /api/groups/:id/calendars returns 409 on duplicate', async () => {
    const res = await addCalendar({
      request: jsonReq(`http://localhost/api/groups/${groupId}/calendars`, 'POST', {
        calendar_id: 'test@group.calendar.google.com',
        name: 'Duplicate',
      }),
      env,
      params: { id: String(groupId) },
      data: DATA,
    });
    expect(res.status).toBe(409);
  });

  test('DELETE /api/groups/:id/calendars/:calId removes the calendar', async () => {
    const res = await removeCalendar({
      request: new Request(`http://localhost/api/groups/${groupId}/calendars/${calRowId}`, { method: 'DELETE' }),
      env,
      params: { id: String(groupId), calId: String(calRowId) },
      data: DATA,
    });
    expect(res.status).toBe(200);
  });

  test('DELETE /api/groups/:id removes the group', async () => {
    const res = await onRequestDelete({
      request: new Request(`http://localhost/api/groups/${groupId}`, { method: 'DELETE' }),
      env,
      params: { id: String(groupId) },
      data: DATA,
    });
    expect(res.status).toBe(200);
  });

  test('DELETE /api/groups/:id returns 404 for unknown id', async () => {
    const res = await onRequestDelete({
      request: new Request('http://localhost/api/groups/999999', { method: 'DELETE' }),
      env,
      params: { id: '999999' },
      data: DATA,
    });
    expect(res.status).toBe(404);
  });
});
