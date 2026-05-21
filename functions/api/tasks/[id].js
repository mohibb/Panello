export async function onRequestPatch({ request, env, params }) {
  const id = parseInt(params.id);
  const existing = await env.DB.prepare('SELECT id FROM tasks WHERE id = ?').bind(id).first();
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });
  const { done } = await request.json();
  await env.DB.prepare('UPDATE tasks SET done = ? WHERE id = ?').bind(done ? 1 : 0, id).run();
  const task = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?').bind(id).first();
  return Response.json({ ...task, done: Boolean(task.done) });
}

export async function onRequestDelete({ env, params }) {
  const id = parseInt(params.id);
  const existing = await env.DB.prepare('SELECT id FROM tasks WHERE id = ?').bind(id).first();
  if (!existing) return Response.json({ error: 'Not found' }, { status: 404 });
  await env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();
  return Response.json({ success: true });
}
