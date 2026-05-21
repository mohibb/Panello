export async function onRequestGet({ env }) {
  const cached = await env.CACHE.get('photos', 'json');
  if (cached) return Response.json(cached);

  // Phase 5: integrate Google Photos API
  const photos = [];

  await env.CACHE.put('photos', JSON.stringify(photos), { expirationTtl: 3600 });
  return Response.json(photos);
}
