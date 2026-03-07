// SL bus departures via Trafiklab ResRobot API
// Free API key from trafiklab.se → create account → add "ResRobot" product

export interface DepartureInfo {
  line: string;
  direction: string;
  minutes: number;
  isRealTime: boolean;
}

// In-memory cache of stop name → extId to avoid repeated lookups
const stopIdCache: Record<string, string> = {};

async function lookupStopId(name: string, apiKey: string): Promise<string | null> {
  if (stopIdCache[name]) return stopIdCache[name];

  const res = await fetch(
    `https://api.resrobot.se/v2.1/location.name?format=json&input=${encodeURIComponent(name)}&accessId=${apiKey}`,
  );
  if (!res.ok) return null;

  const data = await res.json();
  // ResRobot returns stopLocationOrCoordLocation array
  const stops = (data.stopLocationOrCoordLocation ?? [])
    .map((l: Record<string, unknown>) => l.StopLocation)
    .filter(Boolean) as { extId: string; name: string }[];

  if (!stops.length) return null;
  stopIdCache[name] = stops[0].extId;
  return stops[0].extId;
}

export async function fetchDepartures(
  stopName: string,
  apiKey: string,
): Promise<DepartureInfo[]> {
  try {
    const stopId = await lookupStopId(stopName, apiKey);
    if (!stopId) return [];

    const res = await fetch(
      `https://api.resrobot.se/v2.1/departureBoard?id=${stopId}&format=json&accessId=${apiKey}&maxJourneys=5`,
    );
    if (!res.ok) return [];

    const data = await res.json();
    const departures: {
      name: string;
      direction: string;
      time: string;
      date: string;
      rtTime?: string;
      rtDate?: string;
    }[] = data.Departure ?? [];

    const now = new Date();

    return departures.slice(0, 5).map((dep) => {
      const timeStr = dep.rtTime ?? dep.time;
      const dateStr = dep.rtDate ?? dep.date;
      const [h, m] = timeStr.split(":").map(Number);
      const depDate = new Date(dateStr);
      depDate.setHours(h, m, 0, 0);
      const diffMs = depDate.getTime() - now.getTime();
      const minutes = Math.max(0, Math.round(diffMs / 60_000));

      return {
        line: dep.name,
        direction: dep.direction,
        minutes,
        isRealTime: !!dep.rtTime,
      };
    });
  } catch {
    return [];
  }
}
