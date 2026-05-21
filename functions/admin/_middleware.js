export async function onRequest({ request, next, env }) {
  const auth = request.headers.get('Authorization') || '';
  const [scheme, encoded] = auth.split(' ');

  if (scheme !== 'Basic' || !encoded) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Panello Admin"' },
    });
  }

  const [, password] = atob(encoded).split(':');
  if (password !== env.ADMIN_PASSWORD) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Panello Admin"' },
    });
  }

  return next();
}
