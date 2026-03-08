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

export interface HourlyForecast {
  hour: number;   // 0-23
  temp: number;
  emoji: string;
}

export interface WeatherData {
  temp: number;
  feelsLike: number;
  emoji: string;
  label: string;
  windSpeed: number;
  location: string;
  hourly: HourlyForecast[];  // next 12 hours
  sunrise: string;            // e.g. "06:42"
  sunset: string;             // e.g. "17:38"
  daylight: number;           // hours of daylight (rounded)
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

/** Parse "2024-03-08T06:42" → "06:42" */
function parseTime(iso: string): string {
  return iso.split("T")[1]?.slice(0, 5) ?? "–";
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

    // Fetch current + hourly + daily in one request
    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast` +
      `?latitude=${latitude}&longitude=${longitude}` +
      `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
      `&hourly=temperature_2m,weather_code` +
      `&daily=sunrise,sunset` +
      `&timezone=auto` +
      `&forecast_days=1`,
    );
    if (!wxRes.ok) return null;
    const wx = await wxRes.json();

    // ── Current ──────────────────────────────────────────────────────────────
    const c = wx.current;
    const wmo = WMO[c.weather_code as number] ?? { label: "Unknown", emoji: "🌡️" };

    // ── Hourly (next 12h from now) ────────────────────────────────────────────
    const nowHour = new Date().getHours();
    const rawTemps: number[]  = wx.hourly?.temperature_2m ?? [];
    const rawCodes: number[]  = wx.hourly?.weather_code   ?? [];

    const hourly: HourlyForecast[] = [];
    for (let i = 0; i < 12; i++) {
      const idx = nowHour + i;
      if (idx >= rawTemps.length) break;
      const code = rawCodes[idx] ?? 0;
      hourly.push({
        hour: idx % 24,
        temp: Math.round(rawTemps[idx]),
        emoji: (WMO[code] ?? WMO[0]).emoji,
      });
    }

    // ── Daily (sunrise / sunset) ──────────────────────────────────────────────
    const sunriseIso: string = wx.daily?.sunrise?.[0] ?? "";
    const sunsetIso:  string = wx.daily?.sunset?.[0]  ?? "";
    const sunrise = parseTime(sunriseIso);
    const sunset  = parseTime(sunsetIso);

    // Daylight hours
    let daylight = 0;
    if (sunrise !== "–" && sunset !== "–") {
      const [rh, rm] = sunrise.split(":").map(Number);
      const [sh, sm] = sunset.split(":").map(Number);
      daylight = Math.round(((sh * 60 + sm) - (rh * 60 + rm)) / 60);
    }

    return {
      temp: Math.round(c.temperature_2m as number),
      feelsLike: Math.round(c.apparent_temperature as number),
      emoji: wmo.emoji,
      label: wmo.label,
      windSpeed: Math.round(c.wind_speed_10m as number),
      location: name as string,
      hourly,
      sunrise,
      sunset,
      daylight,
    };
  } catch {
    return null;
  }
}
