export async function onRequestGet({ env }) {
  const { results } = await env.DB.prepare(
    'SELECT * FROM tasks ORDER BY created_at DESC'
  ).all();
  return Response.json(results.map(t => ({ ...t, done: Boolean(t.done) })));
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  if (!body.title) {
    return Response.json({ error: 'title required' }, { status: 400 });
  }
  const { meta } = await env.DB.prepare(
    'INSERT INTO tasks (title, owner) VALUES (?, ?)'
  ).bind(body.title, body.owner || 'shared').run();
  const task = await env.DB.prepare('SELECT * FROM tasks WHERE id = ?')
    .bind(meta.last_row_id).first();
  return Response.json({ ...task, done: Boolean(task.done) }, { status: 201 });
}
