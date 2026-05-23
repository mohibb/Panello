import { getAccessToken } from '../lib/google-calendar.js';

export async function onRequestGet({ env, data }) {
  if (data.user.userId === '__admin__') {
    return Response.json({ error: 'Not available' }, { status: 403 });
  }

  const accessToken = await getAccessToken(env, data.user.userId);
  if (!accessToken) {
    return Response.json({ error: 'Google account not connected', needsAuth: true }, { status: 401 });
  }

  const resp = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    if (resp.status === 401) {
      return Response.json({ error: 'Google token expired', needsAuth: true }, { status: 401 });
    }
    return Response.json({ error: 'Failed to fetch calendars' }, { status: 502 });
  }

  const result = await resp.json();
  return Response.json(
    (result.items || []).map(c => ({ id: c.id, name: c.summary }))
  );
}
