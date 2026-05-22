const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const CALENDAR_MEMBERS = ['mohibb', 'saffa', 'family'];

function unauthorized() {
  return new Response('Unauthorized', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Panello Admin"' },
  });
}

export async function onRequestGet({ request, env }) {
  const auth = request.headers.get('Authorization') || '';
  const [scheme, encoded] = auth.split(' ');
  if (scheme !== 'Basic' || !encoded) return unauthorized();
  const [, password] = atob(encoded).split(':');
  if (password !== env.ADMIN_PASSWORD) return unauthorized();

  const url = new URL(request.url);
  const member = url.searchParams.get('member');
  if (!CALENDAR_MEMBERS.includes(member)) {
    return Response.json({ error: 'Invalid member' }, { status: 400 });
  }

  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_REDIRECT_URI) {
    return new Response('Google OAuth not configured', { status: 503 });
  }

  const state = crypto.randomUUID();
  await env.CACHE.put(`oauth_state_${state}`, member, { expirationTtl: 600 });

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set('redirect_uri', env.GOOGLE_REDIRECT_URI);
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', SCOPE);
  authUrl.searchParams.set('access_type', 'offline');
  authUrl.searchParams.set('prompt', 'consent');
  authUrl.searchParams.set('state', state);

  return Response.redirect(authUrl.toString(), 302);
}
