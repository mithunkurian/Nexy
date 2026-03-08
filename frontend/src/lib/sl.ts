// SL bus departures via Trafiklab ResRobot API
// Free API key from trafiklab.se → create account → add "ResRobot" product

import type { TransitRoute } from "@/lib/settings";

export interface RouteDeparture {
  route: TransitRoute;
  minutes: number[];   // up to 4 departure times in minutes from now
  lineName: string;    // e.g. "Länstrafik Bus 705"
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

export async function fetchRouteDepartures(
  routes: TransitRoute[],
  apiKey: string,
): Promise<RouteDeparture[]> {
  const results: RouteDeparture[] = [];

  for (const route of routes) {
    try {
      const stopId = await lookupStopId(route.fromStop, apiKey);
      if (!stopId) {
        results.push({ route, minutes: [], lineName: route.lineFilter });
        continue;
      }

      const res = await fetch(
        `https://api.resrobot.se/v2.1/departureBoard?id=${stopId}&format=json&accessId=${apiKey}&maxJourneys=30`,
      );
      if (!res.ok) {
        results.push({ route, minutes: [], lineName: route.lineFilter });
        continue;
      }

      const data = await res.json();
      const allDeps: {
        name: string;
        direction: string;
        time: string;
        date: string;
        rtTime?: string;
        rtDate?: string;
      }[] = data.Departure ?? [];

      // Filter by line number (dep.name contains e.g. "Länstrafik Bus 705")
      const filtered = allDeps.filter((dep) =>
        dep.name.toLowerCase().includes(route.lineFilter.toLowerCase()),
      );

      const lineName = filtered.length > 0 ? filtered[0].name : route.lineFilter;

      const now = new Date();
      const minutes = filtered.slice(0, 4).map((dep) => {
        const timeStr = dep.rtTime ?? dep.time;
        const dateStr = dep.rtDate ?? dep.date;
        const [h, m] = timeStr.split(":").map(Number);
        const depDate = new Date(dateStr);
        depDate.setHours(h, m, 0, 0);
        const diffMs = depDate.getTime() - now.getTime();
        return Math.max(0, Math.round(diffMs / 60_000));
      });

      results.push({ route, minutes, lineName });
    } catch {
      results.push({ route, minutes: [], lineName: route.lineFilter });
    }
  }

  return results;
}
