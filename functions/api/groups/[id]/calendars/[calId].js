export async function onRequestDelete({ env, params, data }) {
  if (data.user.userId === '__admin__') {
    return Response.json({ error: 'Not available' }, { status: 403 });
  }

  const calId = parseInt(params.calId);

  // Verify the group belongs to the user before deleting
  const row = await env.DB.prepare(
    `SELECT gc.id FROM group_calendars gc
     JOIN calendar_groups cg ON cg.id = gc.group_id
     WHERE gc.id = ? AND cg.user_id = ?`
  ).bind(calId, data.user.userId).first();

  if (!row) return Response.json({ error: 'Not found' }, { status: 404 });

  await env.DB.prepare('DELETE FROM group_calendars WHERE id = ?').bind(calId).run();
  return Response.json({ success: true });
}
