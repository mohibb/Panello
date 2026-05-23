function parseCookie(header) {
  if (!header) return {};
  return Object.fromEntries(
    header.split(';').map(p => {
      const [k, ...rest] = p.trim().split('=');
      return [k.trim(), rest.join('=').trim()];
    })
  );
}

export async function onRequest({ request, next, env, data }) {
  // Session cookie (dashboard users)
  const cookies = parseCookie(request.headers.get('Cookie'));
  const token = cookies.panello_session;
  if (token) {
    const session = await env.CACHE.get(`session_${token}`, 'json');
    if (session) {
      data.user = session;
      return next();
    }
  }

  // Admin Basic Auth fallback — allows admin page to reach /api/tasks and /api/meals
  const auth = request.headers.get('Authorization') || '';
  const [scheme, encoded] = auth.split(' ');
  if (scheme === 'Basic' && encoded) {
    const [, password] = atob(encoded).split(':');
    if (password === env.ADMIN_PASSWORD) {
      data.user = { userId: '__admin__', email: 'admin', name: 'Admin' };
      return next();
    }
  }

  return Response.json({ error: 'Unauthorized' }, { status: 401 });
}
