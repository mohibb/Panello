const COLOR_PALETTE = ['#E84040','#E87D40','#DDB033','#48B368','#3D8EE8','#7B5CE5','#E86097','#00B5B8'];

export async function onRequestGet({ env, data }) {
  const { results: groups } = await env.DB.prepare(
    'SELECT id, name, color, sort_order FROM calendar_groups WHERE user_id = ? ORDER BY sort_order, id'
  ).bind(data.user.userId).all();

  const enriched = await Promise.all(
    groups.map(async g => {
      const { results: cals } = await env.DB.prepare(
        'SELECT id, calendar_id, name FROM group_calendars WHERE group_id = ? ORDER BY id'
      ).bind(g.id).all();
      return { ...g, calendars: cals };
    })
  );

  return Response.json(enriched);
}

export async function onRequestPost({ request, env, data }) {
  if (data.user.userId === '__admin__') {
    return Response.json({ error: 'Not available' }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  if (!body.name || !body.name.trim()) {
    return Response.json({ error: 'name required' }, { status: 400 });
  }

  const { results } = await env.DB.prepare(
    'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM calendar_groups WHERE user_id = ?'
  ).bind(data.user.userId).all();
  const sortOrder = results[0]?.next_order ?? 0;

  const existing = await env.DB.prepare(
    'SELECT color FROM calendar_groups WHERE user_id = ? ORDER BY id'
  ).bind(data.user.userId).all();
  const usedColors = new Set(existing.results.map(g => g.color));
  const color = body.color || COLOR_PALETTE.find(c => !usedColors.has(c)) || COLOR_PALETTE[0];

  const group = await env.DB.prepare(
    `INSERT INTO calendar_groups (user_id, name, color, sort_order)
     VALUES (?, ?, ?, ?) RETURNING id, name, color, sort_order`
  ).bind(data.user.userId, body.name.trim(), color, sortOrder).first();

  return Response.json({ ...group, calendars: [] }, { status: 201 });
}
