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
  const cookies = parseCookie(request.headers.get('Cookie'));

  // Session cookie (dashboard users via Google OAuth)
  const sessionToken = cookies.panello_session;
  if (sessionToken) {
    const session = await env.CACHE.get(`session_${sessionToken}`, 'json');
    if (session) {
      data.user = session;
      return next();
    }
  }

  // Admin session cookie (issued by /admin middleware after Basic Auth)
  const adminToken = cookies.panello_admin;
  if (adminToken) {
    const valid = await env.CACHE.get(`admin_session_${adminToken}`);
    if (valid) {
      data.user = { userId: '__admin__', email: 'admin', name: 'Admin' };
      return next();
    }
  }

  // Direct Basic Auth fallback (curl, scripts, or browsers that send it explicitly)
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
