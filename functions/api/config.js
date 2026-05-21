export async function onRequestGet({ env }) {
  return Response.json({
    familyName: env.FAMILY_NAME || 'Malik',
    location: 'Oslo',
    members: [
      { id: 'mohibb', name: 'Mohibb', color: '#3D8EE8', calendarId: env.CAL_MOHIBB || '' },
      { id: 'saffa',  name: 'Saffa',  color: '#E8607A', calendarId: env.CAL_SAFFA  || '' },
      { id: 'jonas',  name: 'Jonas',  color: '#F0A500', calendarId: '' },
      { id: 'noah',   name: 'Noah',   color: '#48B368', calendarId: '' },
      { id: 'family', name: 'Family', color: '#8B6FD4', calendarId: env.CAL_FAMILY || '' },
    ],
  });
}
