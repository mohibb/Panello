import { getAccessToken, fetchCalendarEvents, transformEvents } from '../lib/google-calendar.js';

const CALENDAR_MEMBERS = [
  { id: 'mohibb', calEnvKey: 'CAL_MOHIBB' },
  { id: 'saffa',  calEnvKey: 'CAL_SAFFA' },
  { id: 'family', calEnvKey: 'CAL_FAMILY' },
];

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const week = url.searchParams.get('week');

  if (!week) {
    return Response.json({ error: 'week param required' }, { status: 400 });
  }

  const d = new Date(week);
  if (isNaN(d.getTime())) {
    return Response.json({ error: 'invalid date' }, { status: 400 });
  }

  const timeMin = `${week}T00:00:00Z`;
  const timeMax = new Date(d.getTime() + 7 * 86400000).toISOString().slice(0, 10) + 'T00:00:00Z';

  const allEvents = [];

  await Promise.allSettled(
    CALENDAR_MEMBERS.map(async ({ id, calEnvKey }) => {
      const calendarId = env[calEnvKey];
      if (!calendarId) return;

      const accessToken = await getAccessToken(env, id);
      if (!accessToken) return;

      const data = await fetchCalendarEvents(accessToken, calendarId, timeMin, timeMax);
      allEvents.push(...transformEvents(data.items, id));
    })
  );

  allEvents.sort((a, b) => {
    const dc = a.date.localeCompare(b.date);
    return dc !== 0 ? dc : a.time.localeCompare(b.time);
  });

  return Response.json(allEvents);
}
