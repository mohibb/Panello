const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const CALENDAR_BASE = 'https://www.googleapis.com/calendar/v3';

async function refreshAccessToken(env, userId, stored) {
  if (!stored.refresh_token) return null;
  const resp = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: stored.refresh_token,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
    }).toString(),
  });
  if (!resp.ok) return null;
  const data = await resp.json();
  const updated = {
    access_token: data.access_token,
    refresh_token: stored.refresh_token,
    expiry_ms: Date.now() + ((data.expires_in || 3600) - 60) * 1000,
  };
  await env.CACHE.put(`oauth_token_${userId}`, JSON.stringify(updated), {
    expirationTtl: 86400 * 30,
  });
  return updated.access_token;
}

export async function getAccessToken(env, userId) {
  const stored = await env.CACHE.get(`oauth_token_${userId}`, 'json');
  if (!stored) return null;
  if (Date.now() < stored.expiry_ms) return stored.access_token;
  return refreshAccessToken(env, userId, stored);
}

export async function fetchCalendarEvents(accessToken, calendarId, timeMin, timeMax) {
  const url = new URL(`${CALENDAR_BASE}/calendars/${encodeURIComponent(calendarId)}/events`);
  url.searchParams.set('timeMin', timeMin);
  url.searchParams.set('timeMax', timeMax);
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('maxResults', '250');

  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!resp.ok) throw new Error(`Calendar API error: ${resp.status}`);
  return resp.json();
}

function fmtTime(dateTimeStr) {
  if (!dateTimeStr) return '';
  return dateTimeStr.slice(11, 16);
}

export function transformEvents(items, person) {
  return (items || [])
    .filter(ev => ev.status !== 'cancelled')
    .map(ev => {
      const isAllDay = Boolean(ev.start.date && !ev.start.dateTime);
      return {
        date: isAllDay ? ev.start.date : ev.start.dateTime.slice(0, 10),
        time: isAllDay ? '' : fmtTime(ev.start.dateTime),
        end: isAllDay ? '' : fmtTime(ev.end?.dateTime),
        title: ev.summary || '(no title)',
        person,
        allDay: isAllDay,
      };
    });
}
