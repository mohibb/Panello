async function ownsGroup(env, userId, groupId) {
  const row = await env.DB.prepare(
    'SELECT id FROM calendar_groups WHERE id = ? AND user_id = ?'
  ).bind(groupId, userId).first();
  return Boolean(row);
}

export async function onRequestPost({ request, env, params, data }) {
  if (data.user.userId === '__admin__') {
    return Response.json({ error: 'Not available' }, { status: 403 });
  }

  const groupId = parseInt(params.id);
  if (!await ownsGroup(env, data.user.userId, groupId)) {
    return Response.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  if (!body.calendar_id || !body.name) {
    return Response.json({ error: 'calendar_id and name required' }, { status: 400 });
  }

  const cal = await env.DB.prepare(
    `INSERT INTO group_calendars (group_id, calendar_id, name)
     VALUES (?, ?, ?) RETURNING id, calendar_id, name`
  ).bind(groupId, body.calendar_id, body.name).first().catch(() => null);

  if (!cal) return Response.json({ error: 'Calendar already in group' }, { status: 409 });
  return Response.json(cal, { status: 201 });
}
