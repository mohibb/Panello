import { getAccessToken, fetchCalendarEvents, transformEvents } from '../lib/google-calendar.js';

export async function onRequestGet({ request, env, data }) {
  const url = new URL(request.url);
  const week = url.searchParams.get('week');

  if (!week) return Response.json({ error: 'week param required' }, { status: 400 });
  const d = new Date(week);
  if (isNaN(d.getTime())) return Response.json({ error: 'invalid date' }, { status: 400 });

  if (data.user.userId === '__admin__') return Response.json([]);

  const accessToken = await getAccessToken(env, data.user.userId);
  if (!accessToken) return Response.json([]);

  const { results } = await env.DB.prepare(
    `SELECT cg.id AS group_id, gc.calendar_id
     FROM calendar_groups cg
     JOIN group_calendars gc ON gc.group_id = cg.id
     WHERE cg.user_id = ?`
  ).bind(data.user.userId).all();

  if (!results.length) return Response.json([]);

  const timeMin = `${week}T00:00:00Z`;
  const timeMax = new Date(d.getTime() + 7 * 86400000).toISOString().slice(0, 10) + 'T00:00:00Z';

  const allEvents = [];
  await Promise.allSettled(
    results.map(async ({ group_id, calendar_id }) => {
      const calData = await fetchCalendarEvents(accessToken, calendar_id, timeMin, timeMax);
      allEvents.push(...transformEvents(calData.items, String(group_id)));
    })
  );

  allEvents.sort((a, b) => {
    const dc = a.date.localeCompare(b.date);
    return dc !== 0 ? dc : a.time.localeCompare(b.time);
  });

  return Response.json(allEvents);
}
