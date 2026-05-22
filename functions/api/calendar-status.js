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

  const status = await Promise.all(
    CALENDAR_MEMBERS.map(async (member) => {
      const token = await env.CACHE.get(`oauth_token_${member}`, 'json');
      return {
        member,
        authorized: Boolean(token),
        calendarConfigured: Boolean(env[`CAL_${member.toUpperCase()}`]),
      };
    })
  );

  return Response.json(status);
}
