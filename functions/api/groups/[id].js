async function ownsGroup(env, userId, groupId) {
  const row = await env.DB.prepare(
    'SELECT id FROM calendar_groups WHERE id = ? AND user_id = ?'
  ).bind(groupId, userId).first();
  return Boolean(row);
}

export async function onRequestPatch({ request, env, params, data }) {
  if (data.user.userId === '__admin__') {
    return Response.json({ error: 'Not available' }, { status: 403 });
  }

  const id = parseInt(params.id);
  if (!await ownsGroup(env, data.user.userId, id)) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const setClauses = [];
  const values = [];

  if (body.name !== undefined) { setClauses.push('name = ?'); values.push(body.name.trim()); }
  if (body.color !== undefined) { setClauses.push('color = ?'); values.push(body.color); }
  if (!setClauses.length) return Response.json({ error: 'Nothing to update' }, { status: 400 });

  values.push(id);
  const group = await env.DB.prepare(
    `UPDATE calendar_groups SET ${setClauses.join(', ')} WHERE id = ? RETURNING id, name, color, sort_order`
  ).bind(...values).first();

  return Response.json(group);
}

export async function onRequestDelete({ env, params, data }) {
  if (data.user.userId === '__admin__') {
    return Response.json({ error: 'Not available' }, { status: 403 });
  }

  const id = parseInt(params.id);
  if (!await ownsGroup(env, data.user.userId, id)) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  await env.DB.prepare('DELETE FROM calendar_groups WHERE id = ?').bind(id).run();
  return Response.json({ success: true });
}
