// Open-Meteo weather fetching — completely free, no API key needed

const WMO: Record<number, { label: string; emoji: string }> = {
  0:  { label: "Clear sky",      emoji: "☀️" },
  1:  { label: "Mainly clear",   emoji: "🌤️" },
  2:  { label: "Partly cloudy",  emoji: "⛅" },
  3:  { label: "Overcast",       emoji: "☁️" },
  45: { label: "Foggy",          emoji: "🌫️" },
  48: { label: "Icy fog",        emoji: "🌫️" },
  51: { label: "Light drizzle",  emoji: "🌦️" },
  53: { label: "Drizzle",        emoji: "🌦️" },
  55: { label: "Heavy drizzle",  emoji: "🌧️" },
  61: { label: "Light rain",     emoji: "🌧️" },
  63: { label: "Rain",           emoji: "🌧️" },
  65: { label: "Heavy rain",     emoji: "🌧️" },
  71: { label: "Light snow",     emoji: "🌨️" },
  73: { label: "Snow",           emoji: "❄️" },
  75: { label: "Heavy snow",     emoji: "❄️" },
  77: { label: "Snow grains",    emoji: "❄️" },
  80: { label: "Rain showers",   emoji: "🌧️" },
  81: { label: "Rain showers",   emoji: "🌧️" },
  82: { label: "Heavy showers",  emoji: "⛈️" },
  85: { label: "Snow showers",   emoji: "🌨️" },
  86: { label: "Heavy snow",     emoji: "❄️" },
  95: { label: "Thunderstorm",   emoji: "⛈️" },
  96: { label: "Thunderstorm",   emoji: "⛈️" },
  99: { label: "Thunderstorm",   emoji: "⛈️" },
};

export interface WeatherData {
  temp: number;
  feelsLike: number;
  emoji: string;
  label: string;
  windSpeed: number;
  location: string;
}

/**
 * Builds a list of progressively simpler search terms from an address.
 * e.g. "Solfagravägen 42L, 141 42 Huddinge" →
 *   ["Solfagravägen 42L, 141 42 Huddinge", "Solfagravägen 42L", "Huddinge"]
 */
function buildSearchTerms(address: string): string[] {
  const terms: string[] = [address];

  const parts = address.split(",").map((s) => s.trim()).filter(Boolean);

  for (const part of parts) {
    // Strip leading postal-code numbers like "141 42 " to extract city name
    const stripped = part.replace(/^\d[\d\s]*/, "").trim();
    if (stripped && stripped !== address) terms.push(stripped);
    if (part !== address) terms.push(part);
  }

  // Always try the very last segment (usually the city)
  if (parts.length > 1) {
    const last = parts[parts.length - 1].replace(/^\d[\d\s]*/, "").trim();
    if (last) terms.push(last);
  }

  // Deduplicate while preserving order
  return [...new Set(terms)].filter(Boolean);
}

async function tryGeocode(
  term: string,
): Promise<{ latitude: number; longitude: number; name: string } | null> {
  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(term)}&count=1&language=en&format=json`,
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.results?.length) return null;
    return data.results[0] as { latitude: number; longitude: number; name: string };
  } catch {
    return null;
  }
}

export async function fetchWeather(address: string): Promise<WeatherData | null> {
  try {
    // Try each search term until we get a geocoding result
    const searchTerms = buildSearchTerms(address);
    let geoResult: { latitude: number; longitude: number; name: string } | null = null;

    for (const term of searchTerms) {
      geoResult = await tryGeocode(term);
      if (geoResult) break;
    }

    if (!geoResult) return null;

    const { latitude, longitude, name } = geoResult;

    // Fetch current weather
    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&timezone=auto`,
    );
    if (!wxRes.ok) return null;
    const wx = await wxRes.json();
    const c = wx.current;
    const wmo = WMO[c.weather_code as number] ?? { label: "Unknown", emoji: "🌡️" };

    return {
      temp: Math.round(c.temperature_2m as number),
      feelsLike: Math.round(c.apparent_temperature as number),
      emoji: wmo.emoji,
      label: wmo.label,
      windSpeed: Math.round(c.wind_speed_10m as number),
      location: name as string,
    };
  } catch {
    return null;
  }
}
