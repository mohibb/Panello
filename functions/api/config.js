export async function onRequestGet({ env, data }) {
  if (data.user.userId === '__admin__') {
    return Response.json({ familyName: env.FAMILY_NAME || 'Panello', location: 'Oslo', members: [] });
  }

  const { results } = await env.DB.prepare(
    'SELECT id, name, color FROM calendar_groups WHERE user_id = ? ORDER BY sort_order, id'
  ).bind(data.user.userId).all();

  return Response.json({
    familyName: env.FAMILY_NAME || 'Panello',
    location: 'Oslo',
    members: results.map(g => ({ id: String(g.id), name: g.name, color: g.color })),
  });
}
