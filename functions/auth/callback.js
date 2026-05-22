const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');

  if (error) {
    return new Response(`OAuth error: ${error}`, { status: 400 });
  }
  if (!code || !state) {
    return new Response('Missing code or state', { status: 400 });
  }

  const member = await env.CACHE.get(`oauth_state_${state}`);
  if (!member) {
    return new Response('Invalid or expired state — please try again from the admin page', {
      status: 400,
    });
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: env.GOOGLE_REDIRECT_URI,
  });

  const resp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return new Response(`Token exchange failed: ${text}`, { status: 502 });
  }

  const data = await resp.json();
  if (!data.refresh_token) {
    return new Response(
      'No refresh_token returned. Revoke access at myaccount.google.com/permissions and try again.',
      { status: 400 }
    );
  }

  const tokenData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expiry_ms: Date.now() + (data.expires_in - 60) * 1000,
  };

  await env.CACHE.put(`oauth_token_${member}`, JSON.stringify(tokenData), {
    expirationTtl: 86400 * 30,
  });
  await env.CACHE.delete(`oauth_state_${state}`);

  return Response.redirect('/admin?authorized=' + member, 302);
}
