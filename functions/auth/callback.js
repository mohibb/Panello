const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v3/userinfo';
const SESSION_TTL = 86400 * 30;

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) return new Response(`OAuth error: ${error}`, { status: 400 });
  if (!code || !state) return new Response('Missing code or state', { status: 400 });

  const stateData = await env.CACHE.get(`oauth_state_${state}`, 'json');
  if (!stateData) {
    return new Response('Invalid or expired state — please try signing in again', { status: 400 });
  }
  await env.CACHE.delete(`oauth_state_${state}`);

  const tokenResp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
    }).toString(),
  });
  if (!tokenResp.ok) {
    return new Response(`Token exchange failed: ${await tokenResp.text()}`, { status: 502 });
  }
  const tokens = await tokenResp.json();

  const userResp = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!userResp.ok) return new Response('Failed to fetch user info', { status: 502 });
  const userInfo = await userResp.json();

  await env.DB.prepare(
    `INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET email=excluded.email, name=excluded.name, picture=excluded.picture`
  ).bind(userInfo.sub, userInfo.email, userInfo.name || '', userInfo.picture || '').run();

  const tokenData = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || null,
    expiry_ms: Date.now() + ((tokens.expires_in || 3600) - 60) * 1000,
  };
  await env.CACHE.put(`oauth_token_${userInfo.sub}`, JSON.stringify(tokenData), {
    expirationTtl: SESSION_TTL,
  });

  const sessionToken = crypto.randomUUID();
  await env.CACHE.put(
    `session_${sessionToken}`,
    JSON.stringify({ userId: userInfo.sub, email: userInfo.email, name: userInfo.name || '' }),
    { expirationTtl: SESSION_TTL }
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: stateData.returnTo || '/',
      'Set-Cookie': `panello_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_TTL}`,
    },
  });
}
