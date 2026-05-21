export async function onRequestGet({ request }) {
  const url = new URL(request.url);
  const week = url.searchParams.get('week');

  if (!week) {
    return Response.json({ error: 'week param required' }, { status: 400 });
  }

  const d = new Date(week);
  if (isNaN(d.getTime())) {
    return Response.json({ error: 'invalid date' }, { status: 400 });
  }

  return Response.json([]);
}
