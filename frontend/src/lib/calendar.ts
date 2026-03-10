// Google Calendar API v3 — uses OAuth Bearer token (no API key needed).
// Calendars do NOT need to be public. The signed-in user's private calendars
// and any calendars shared with them are all accessible.

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  location?: string;
  description?: string;
}

async function fetchSingleCalendar(
  calendarId: string,
  accessToken: string,
): Promise<CalendarEvent[]> {
  try {
    const now = new Date().toISOString();
    const url =
      `https://www.googleapis.com/calendar/v3/calendars/` +
      `${encodeURIComponent(calendarId)}/events` +
      `?timeMin=${encodeURIComponent(now)}` +
      `&maxResults=10` +
      `&singleEvents=true` +
      `&orderBy=startTime`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
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
      };
    });
  } catch {
    return [];
  }
}

/**
 * Fetch events from all selected calendars in parallel.
 * Merges, deduplicates by event id, sorts by start time, returns top 10.
 */
export async function fetchCalendarEvents(
  calendarIds: string[],
  accessToken: string,
): Promise<CalendarEvent[]> {
  if (calendarIds.length === 0 || !accessToken) return [];

  const results = await Promise.all(
    calendarIds.map((id) => fetchSingleCalendar(id, accessToken)),
  );

  const map = new Map<string, CalendarEvent>();
  for (const events of results) {
    for (const event of events) {
      if (!map.has(event.id)) map.set(event.id, event);
    }
  }

  return [...map.values()]
    .sort((a, b) => a.start.getTime() - b.start.getTime())
    .slice(0, 10);
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
