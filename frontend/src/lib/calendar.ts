// Google Calendar API v3 — requires a free Google Cloud API key
// with "Google Calendar API" enabled, and the calendar must be public
// OR the calendar ID + API key from a service account.

import type { CalendarColor, CalendarConfig } from "@/lib/settings";

export interface CalendarEntry {
  name: string;
  color: CalendarColor;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  description?: string;
  /** Which calendars this event belongs to (1 = personal, 2+ = shared) */
  calendars: CalendarEntry[];
}

async function fetchSingleCalendar(
  config: CalendarConfig,
  apiKey: string,
): Promise<CalendarEvent[]> {
  try {
    const now = new Date().toISOString();
    const url =
      `https://www.googleapis.com/calendar/v3/calendars/` +
      `${encodeURIComponent(config.calendarId)}/events` +
      `?key=${apiKey}` +
      `&timeMin=${encodeURIComponent(now)}` +
      `&maxResults=10` +
      `&singleEvents=true` +
      `&orderBy=startTime`;

    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    const items: {
      id: string;
      summary?: string;
      location?: string;
      description?: string;
      start: { dateTime?: string; date?: string };
      end:   { dateTime?: string; date?: string };
    }[] = data.items ?? [];

    return items.map((item) => {
      const allDay = !item.start.dateTime;
      const start = new Date(item.start.dateTime ?? item.start.date ?? "");
      const end   = new Date(item.end.dateTime   ?? item.end.date   ?? "");
      return {
        id: item.id,
        title: item.summary ?? "(No title)",
        start,
        end,
        allDay,
        location: item.location,
        description: item.description,
        calendars: [{ name: config.name, color: config.color }],
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fetch events from all configured calendars in parallel.
 * Events with the same Google event ID (shared/invited events) are merged into
 * one entry with multiple `calendars` entries so the UI can show all owners.
 */
export async function fetchCalendarEvents(
  configs: CalendarConfig[],
  apiKey: string,
): Promise<CalendarEvent[]> {
  if (configs.length === 0 || !apiKey) return [];

  const results = await Promise.all(
    configs.map((cfg) => fetchSingleCalendar(cfg, apiKey)),
  );

  // Deduplicate by event id — merge calendars arrays
  const map = new Map<string, CalendarEvent>();
  for (const events of results) {
    for (const event of events) {
      const existing = map.get(event.id);
      if (existing) {
        // Same event in another calendar — add that calendar's entry if not already present
        const alreadyHas = existing.calendars.some((c) => c.name === event.calendars[0].name);
        if (!alreadyHas) existing.calendars.push(event.calendars[0]);
      } else {
        map.set(event.id, event);
      }
    }
  }

  // Sort by start time and return top 8
  return [...map.values()]
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 8);
}

/** Format a CalendarEvent start time as a readable string */
export function formatEventTime(event: CalendarEvent): string {
  if (event.allDay) return "All day";
  const now = new Date();
  const isToday = event.start.toDateString() === now.toDateString();
  const isTomorrow =
    event.start.toDateString() ===
    new Date(now.getTime() + 86_400_000).toDateString();

  const timeStr = event.start.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isToday)    return `Today ${timeStr}`;
  if (isTomorrow) return `Tomorrow ${timeStr}`;

  return event.start.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }) + ` ${timeStr}`;
}
