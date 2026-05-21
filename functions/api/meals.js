export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const week = url.searchParams.get('week');
  if (!week) {
    return Response.json({ error: 'week param required' }, { status: 400 });
  }

  const t = new Date(week).getTime();
  const days = Array.from({ length: 7 }, (_, i) =>
    new Date(t + i * 86400000).toISOString().slice(0, 10)
  );

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
  const row = await env.DB.prepare(
    `INSERT INTO meals (date, lunch, dinner) VALUES (?, ?, ?)
     ON CONFLICT(date) DO UPDATE SET lunch = excluded.lunch, dinner = excluded.dinner
     RETURNING *`
  ).bind(body.date, body.lunch ?? null, body.dinner ?? null).first();
  return Response.json(row);
}
