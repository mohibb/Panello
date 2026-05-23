export async function onRequestPost({ request, env }) {
  const cookie = request.headers.get('Cookie') || '';
  const match = cookie.match(/panello_session=([^;]+)/);
  if (match) {
    await env.CACHE.delete(`session_${match[1]}`);
  }
  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
      'Set-Cookie': 'panello_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
    },
  });
}
