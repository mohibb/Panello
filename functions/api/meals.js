export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const week = url.searchParams.get('week');
  if (!week) {
    return Response.json({ error: 'week param required' }, { status: 400 });
  }

  const start = new Date(week);
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setUTCDate(d.getUTCDate() + i);
    days.push(d.toISOString().slice(0, 10));
  }

  const placeholders = days.map(() => '?').join(', ');
  const { results } = await env.DB.prepare(
    `SELECT * FROM meals WHERE date IN (${placeholders}) ORDER BY date`
  ).bind(...days).all();

  return Response.json(results);
}

export async function onRequestPost({ request, env }) {
  const body = await request.json().catch(() => ({}));
  if (!body.date) {
    return Response.json({ error: 'date required' }, { status: 400 });
  }
  await env.DB.prepare(
    `INSERT INTO meals (date, lunch, dinner) VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET lunch = excluded.lunch, dinner = excluded.dinner`
  ).bind(body.date, body.lunch ?? null, body.dinner ?? null).run();
  const row = await env.DB.prepare('SELECT * FROM meals WHERE date = ?').bind(body.date).first();
  return Response.json(row);
}
