function symbolToIcon(symbol) {
  const s = symbol.replace(/_(day|night|polartwilight)$/, '').replace(/_/g, '');
  return {
    clearsky: '☀️', fair: '🌤', partlycloudy: '⛅', cloudy: '☁️', fog: '🌫',
    lightrain: '🌦', rain: '🌧', heavyrain: '🌧', sleet: '🌨',
    snow: '❄️', lightsnow: '🌨', heavysnow: '❄️', thunder: '⛈',
  }[s] || '🌡';
}

function symbolToDesc(symbol) {
  const s = symbol.replace(/_(day|night|polartwilight)$/, '');
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');
}

function transformYrData(data) {
  const series = data.properties.timeseries;
  const now = series[0]?.data || {};
  const details = now.instant?.details || {};
  const temp = Math.round(details.air_temperature ?? 0);
  const wind = Math.round(details.wind_speed ?? 0);
  const symbol = now.next_1_hours?.summary?.symbol_code
    || now.next_6_hours?.summary?.symbol_code
    || 'cloudy';
  const rain = Math.round((now.next_1_hours?.details?.precipitation_amount ?? 0) * 10) / 10;
  const feelsLike = wind > 1 && temp < 10
    ? Math.round(13.12 + 0.6215 * temp - 11.37 * wind ** 0.16 + 0.3965 * temp * wind ** 0.16)
    : temp;

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date().toISOString().slice(0, 10);
  const seen = new Set([today]);
  const forecast = [];

  for (const entry of series) {
    const date = entry.time.slice(0, 10);
    if (seen.has(date)) continue;
    seen.add(date);
    const next6 = entry.data?.next_6_hours;
    if (!next6) continue;
    const max = next6.details?.air_temperature_max ?? 0;
    const min = next6.details?.air_temperature_min ?? 0;
    forecast.push({
      day: dayNames[new Date(date).getDay()],
      icon: symbolToIcon(next6.summary?.symbol_code || 'cloudy'),
      temp: Math.round((max + min) / 2),
    });
    if (forecast.length >= 4) break;
  }

  return { temp, description: symbolToDesc(symbol), feelsLike, wind, rain, forecast };
}

export async function onRequestGet({ env }) {
  const cached = await env.CACHE.get('weather', 'json');
  if (cached) return Response.json(cached);

  const lat = env.LOCATION_LAT || '59.9139';
  const lon = env.LOCATION_LON || '10.7522';
  const url = `https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`;

  try {
    const resp = await fetch(url, {
      headers: { 'User-Agent': 'Panello/1.0 github.com/mohibb/panello' },
    });
    if (!resp.ok) throw new Error(`Yr.no responded ${resp.status}`);
    const weather = transformYrData(await resp.json());
    await env.CACHE.put('weather', JSON.stringify(weather), { expirationTtl: 1800 });
    return Response.json(weather);
  } catch (err) {
    return Response.json({ error: 'Weather unavailable', detail: err.message }, { status: 503 });
  }
}
