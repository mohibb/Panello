import { fmtTask } from '../../utils.js';

export async function onRequestPatch({ request, env, params }) {
  const id = parseInt(params.id);
  const { done } = await request.json();
  const task = await env.DB.prepare(
    'UPDATE tasks SET done = ? WHERE id = ? RETURNING *'
  ).bind(done ? 1 : 0, id).first();
  if (!task) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json(fmtTask(task));
}

export async function onRequestDelete({ env, params }) {
  const id = parseInt(params.id);
  const { meta } = await env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();
  if (meta.changes === 0) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ success: true });
}
