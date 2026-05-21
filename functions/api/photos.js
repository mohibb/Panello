export async function onRequestGet({ env }) {
  const cached = await env.CACHE.get('photos', 'json');
  if (cached) return Response.json(cached);

  return Response.json([]);
}
