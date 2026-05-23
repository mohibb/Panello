const unauthorized = () => new Response('Unauthorized', {
  status: 401,
  headers: { 'WWW-Authenticate': 'Basic realm="Panello Admin"' },
});

export async function onRequest({ request, next, env }) {
  const auth = request.headers.get('Authorization') || '';
  const [scheme, encoded] = auth.split(' ');

  if (scheme !== 'Basic' || !encoded) return unauthorized();

  const [, password] = atob(encoded).split(':');
  if (password !== env.ADMIN_PASSWORD) return unauthorized();

  const response = await next();

  // Issue a short-lived admin session cookie so the admin page's fetch() calls
  // to /api/* are authenticated without the browser re-sending Basic Auth headers
  // (browsers don't auto-forward Basic Auth to different paths).
  const token = crypto.randomUUID();
  await env.CACHE.put(`admin_session_${token}`, '1', { expirationTtl: 3600 });

  const out = new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: new Headers(response.headers),
  });
  out.headers.append(
    'Set-Cookie',
    `panello_admin=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=3600`
  );
  return out;
}
