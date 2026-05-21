import { fmtTask } from '../utils.js';

export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM tasks ORDER BY created_at DESC'
  ).all();
  return Response.json(results.map(fmtTask));
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  if (!body.title) {
    return Response.json({ error: 'title required' }, { status: 400 });
  }
  const task = await env.DB.prepare(
    'INSERT INTO tasks (title, owner) VALUES (?, ?) RETURNING *'
  ).bind(body.title, body.owner || 'shared').first();
  return Response.json(fmtTask(task), { status: 201 });
}
