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

export async function fetchWeather(address: string): Promise<WeatherData | null> {
  try {
    // Geocode the address using Open-Meteo's free geocoding API
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(address)}&count=1&language=en&format=json`,
    );
    if (!geoRes.ok) return null;
    const geo = await geoRes.json();
    if (!geo.results?.length) return null;

    const { latitude, longitude, name } = geo.results[0];

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
